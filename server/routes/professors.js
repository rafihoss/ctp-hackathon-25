const express = require('express');
const router = express.Router();

// Get all professors
router.get('/search', async (req, res) => {
  try {
    const { query, department } = req.query;
    
    let sql = `
      SELECT DISTINCT 
        prof as professor_name,
        subject as department,
        COUNT(*) as course_count,
        AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa_overall
      FROM grades 
      WHERE prof IS NOT NULL AND prof != ''
    `;
    
    const params = [];
    
    if (query) {
      sql += ` AND (prof LIKE ? OR subject LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }
    
    if (department) {
      sql += ` AND subject = ?`;
      params.push(department);
    }
    
    sql += ` GROUP BY prof, subject ORDER BY prof`;
    
    const professors = await req.databaseService.query(sql, params);
    
    res.json({
      success: true,
      professors: professors.map(prof => ({
        id: prof.professor_name.toLowerCase().replace(/\s+/g, '-'),
        name: prof.professor_name,
        department: prof.department,
        courseCount: prof.course_count,
        avgGPA: prof.avg_gpa_overall ? parseFloat(prof.avg_gpa_overall).toFixed(2) : 'N/A'
      }))
    });
  } catch (error) {
    console.error('Professor search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search professors'
    });
  }
});

// Get professor comparison data
router.post('/compare', async (req, res) => {
  try {
    const { professorNames } = req.body;
    
    if (!professorNames || !Array.isArray(professorNames) || professorNames.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least 2 professor names to compare'
      });
    }
    
    const comparisonData = [];
    
    for (const professorName of professorNames) {
      const sql = `
        SELECT 
          prof as professor_name,
          subject as department,
          course_name,
          term,
          a_plus, a, a_minus,
          b_plus, b, b_minus,
          c_plus, c, c_minus,
          d, f, w,
          avg_gpa,
          total as total_students
        FROM grades 
        WHERE prof = ?
        ORDER BY term DESC, course_name
      `;
      
      const grades = await req.databaseService.query(sql, [professorName]);
      
      if (grades.length > 0) {
        comparisonData.push({
          name: professorName,
          department: grades[0].department,
          grades: grades.map(grade => ({
            course_name: grade.course_name,
            term: grade.term,
            a_plus: grade.a_plus || 0,
            a: grade.a || 0,
            a_minus: grade.a_minus || 0,
            b_plus: grade.b_plus || 0,
            b: grade.b || 0,
            b_minus: grade.b_minus || 0,
            c_plus: grade.c_plus || 0,
            c: grade.c || 0,
            c_minus: grade.c_minus || 0,
            d: grade.d || 0,
            f: grade.f || 0,
            w: grade.w || 0,
            avg_gpa: grade.avg_gpa || 'N/A',
            total_students: grade.total_students || 0
          }))
        });
      }
    }
    
    res.json({
      success: true,
      comparisonData
    });
  } catch (error) {
    console.error('Professor comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare professors'
    });
  }
});

// Get departments list
router.get('/departments', async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT subject as department
      FROM grades 
      WHERE subject IS NOT NULL AND subject != ''
      ORDER BY subject
    `;
    
    const departments = await req.databaseService.query(sql);
    
    res.json({
      success: true,
      departments: departments.map(dept => dept.department)
    });
  } catch (error) {
    console.error('Departments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get departments'
    });
  }
});

module.exports = router;
