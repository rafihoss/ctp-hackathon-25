const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, '../data/grades.db');

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  const { q, type = 'all' } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ suggestions: [] });
  }

  try {
    const db = new sqlite3.Database(DB_PATH);
    const suggestions = [];

    // Search for professors
    if (type === 'all' || type === 'professors') {
      const professorQuery = `
        SELECT DISTINCT prof as name, subject as department, 'professor' as type
        FROM grades 
        WHERE prof LIKE ? 
        ORDER BY prof 
        LIMIT 10
      `;
      
      await new Promise((resolve, reject) => {
        db.all(professorQuery, [`%${q}%`], (err, rows) => {
          if (err) reject(err);
          else {
            suggestions.push(...rows);
            resolve();
          }
        });
      });
    }

    // Search for courses
    if (type === 'all' || type === 'courses') {
      const courseQuery = `
        SELECT DISTINCT 
          subject || ' ' || nbr as name, 
          course_name as fullName,
          subject as department,
          'course' as type
        FROM grades 
        WHERE (subject || ' ' || nbr) LIKE ? OR course_name LIKE ?
        ORDER BY subject, nbr 
        LIMIT 10
      `;
      
      await new Promise((resolve, reject) => {
        db.all(courseQuery, [`%${q}%`, `%${q}%`], (err, rows) => {
          if (err) reject(err);
          else {
            suggestions.push(...rows);
            resolve();
          }
        });
      });
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.name === suggestion.name)
      )
      .slice(0, 15);

    db.close();
    res.json({ suggestions: uniqueSuggestions });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Advanced search endpoint
router.post('/advanced', async (req, res) => {
  const { query, filters = {} } = req.body;
  
  try {
    const db = new sqlite3.Database(DB_PATH);
    let sql = `
      SELECT 
        prof,
        subject,
        nbr,
        course_name,
        section,
        term,
        total,
        a_plus, a, a_minus,
        b_plus, b, b_minus,
        c_plus, c, c_minus,
        d, f, w, inc_na,
        avg_gpa,
        ROUND((a_plus + a + a_minus) * 100.0 / total, 2) as a_percentage,
        ROUND((b_plus + b + b_minus) * 100.0 / total, 2) as b_percentage,
        ROUND((c_plus + c + c_minus) * 100.0 / total, 2) as c_percentage,
        ROUND((d + f) * 100.0 / total, 2) as df_percentage
      FROM grades 
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search conditions
    if (query) {
      sql += ` AND (
        prof LIKE ? OR 
        subject LIKE ? OR 
        nbr LIKE ? OR 
        course_name LIKE ?
      )`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add filters
    if (filters.department) {
      sql += ` AND subject = ?`;
      params.push(filters.department);
    }
    
    if (filters.term) {
      sql += ` AND term = ?`;
      params.push(filters.term);
    }
    
    if (filters.minGPA) {
      sql += ` AND avg_gpa >= ?`;
      params.push(filters.minGPA);
    }
    
    if (filters.maxGPA) {
      sql += ` AND avg_gpa <= ?`;
      params.push(filters.maxGPA);
    }
    
    sql += ` ORDER BY avg_gpa DESC LIMIT 100`;
    
    const results = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    res.json({ results });
    
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Advanced search failed' });
  }
});

// Get departments for filter
router.get('/departments', async (req, res) => {
  try {
    const db = new sqlite3.Database(DB_PATH);
    
    const departments = await new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT subject FROM grades ORDER BY subject', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.subject));
      });
    });
    
    db.close();
    res.json({ departments });
    
  } catch (error) {
    console.error('Departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get terms for filter
router.get('/terms', async (req, res) => {
  try {
    const db = new sqlite3.Database(DB_PATH);
    
    const terms = await new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT term FROM grades ORDER BY term DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.term));
      });
    });
    
    db.close();
    res.json({ terms });
    
  } catch (error) {
    console.error('Terms error:', error);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

// Get grade trends for a professor
router.get('/trends/:professorName', async (req, res) => {
  const { professorName } = req.params;
  
  try {
    const db = new sqlite3.Database(DB_PATH);
    
    const trends = await new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          term,
          subject,
          nbr,
          course_name,
          section,
          total,
          a_plus, a, a_minus,
          b_plus, b, b_minus,
          c_plus, c, c_minus,
          d, f, w, inc_na,
          avg_gpa,
          ROUND((a_plus + a + a_minus) * 100.0 / total, 2) as a_percentage,
          ROUND((b_plus + b + b_minus) * 100.0 / total, 2) as b_percentage,
          ROUND((c_plus + c + c_minus) * 100.0 / total, 2) as c_percentage,
          ROUND((d + f) * 100.0 / total, 2) as df_percentage
        FROM grades 
        WHERE prof LIKE ?
        ORDER BY term
      `;
      
      db.all(sql, [`%${professorName}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    res.json({ trends });
    
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get department performance comparison
router.get('/department-performance', async (req, res) => {
  try {
    const db = new sqlite3.Database(DB_PATH);
    
    const performance = await new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          subject as department,
          COUNT(DISTINCT prof) as professor_count,
          COUNT(*) as course_count,
          ROUND(AVG(avg_gpa), 2) as avg_gpa,
          ROUND(AVG((a_plus + a + a_minus) * 100.0 / total), 2) as avg_a_percentage,
          ROUND(AVG((b_plus + b + b_minus) * 100.0 / total), 2) as avg_b_percentage,
          ROUND(AVG((c_plus + c + c_minus) * 100.0 / total), 2) as avg_c_percentage,
          ROUND(AVG((d + f) * 100.0 / total), 2) as avg_df_percentage,
          SUM(total) as total_enrollment
        FROM grades 
        GROUP BY subject
        ORDER BY avg_gpa DESC
      `;
      
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    res.json({ performance });
    
  } catch (error) {
    console.error('Department performance error:', error);
    res.status(500).json({ error: 'Failed to fetch department performance' });
  }
});

module.exports = router;
