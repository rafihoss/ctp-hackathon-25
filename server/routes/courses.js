const express = require('express');
const router = express.Router();

// Get all courses with filtering
router.get('/search', async (req, res) => {
  try {
    const { query, department, level, term } = req.query;
    
    let sql = `
      SELECT DISTINCT 
        subject,
        nbr,
        course_name,
        COUNT(*) as section_count,
        SUM(total) as total_enrollment,
        AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa,
        COUNT(DISTINCT prof) as professor_count
      FROM grades 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (query) {
      sql += ` AND (subject LIKE ? OR nbr LIKE ? OR course_name LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }
    
    if (department) {
      sql += ` AND subject = ?`;
      params.push(department);
    }
    
    if (level) {
      sql += ` AND CAST(SUBSTR(nbr, 1, 1) AS INTEGER) = ?`;
      params.push(level);
    }
    
    if (term) {
      sql += ` AND term = ?`;
      params.push(term);
    }
    
    sql += ` GROUP BY subject, nbr, course_name ORDER BY subject, nbr`;
    
    const courses = await req.databaseService.query(sql, params);
    
    res.json({
      success: true,
      courses: courses.map(course => ({
        id: `${course.subject}-${course.nbr}`,
        subject: course.subject,
        number: course.nbr,
        name: course.course_name,
        sectionCount: course.section_count,
        totalEnrollment: course.total_enrollment,
        avgGPA: course.avg_gpa ? parseFloat(course.avg_gpa).toFixed(2) : 'N/A',
        professorCount: course.professor_count
      }))
    });
  } catch (error) {
    console.error('Course search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search courses'
    });
  }
});

// Get detailed course analysis
router.get('/:courseId/analysis', async (req, res) => {
  try {
    const { courseId } = req.params;
    const [subject, number] = courseId.split('-');
    
    // Get course statistics
    const statsSql = `
      SELECT 
        subject,
        nbr,
        course_name,
        COUNT(*) as total_sections,
        SUM(total) as total_enrollment,
        AVG(CAST(avg_gpa AS FLOAT)) as overall_avg_gpa,
        SUM(a_plus + a + a_minus) as total_a_grades,
        SUM(b_plus + b + b_minus) as total_b_grades,
        SUM(c_plus + c + c_minus) as total_c_grades,
        SUM(d) as total_d_grades,
        SUM(f) as total_f_grades,
        SUM(w) as total_w_grades,
        SUM(inc_na) as total_inc_na
      FROM grades 
      WHERE subject = ? AND nbr = ?
      GROUP BY subject, nbr, course_name
    `;
    
    const stats = await req.databaseService.query(statsSql, [subject, number]);
    
    if (stats.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Get professor performance for this course
    const profSql = `
      SELECT 
        prof,
        COUNT(*) as sections_taught,
        SUM(total) as total_enrollment,
        AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa,
        SUM(a_plus + a + a_minus) as a_grades,
        SUM(b_plus + b + b_minus) as b_grades,
        SUM(c_plus + c + c_minus) as c_grades,
        SUM(d) as d_grades,
        SUM(f) as f_grades,
        SUM(w) as w_grades
      FROM grades 
      WHERE subject = ? AND nbr = ?
      GROUP BY prof
      ORDER BY avg_gpa DESC
    `;
    
    const professors = await req.databaseService.query(profSql, [subject, number]);
    
    // Get term-by-term performance
    const termSql = `
      SELECT 
        term,
        COUNT(*) as sections,
        SUM(total) as enrollment,
        AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa
      FROM grades 
      WHERE subject = ? AND nbr = ?
      GROUP BY term
      ORDER BY term DESC
    `;
    
    const terms = await req.databaseService.query(termSql, [subject, number]);
    
    const courseStats = stats[0];
    const totalStudents = courseStats.total_enrollment || 0;
    
    res.json({
      success: true,
      course: {
        id: courseId,
        subject: courseStats.subject,
        number: courseStats.nbr,
        name: courseStats.course_name,
        totalSections: courseStats.total_sections,
        totalEnrollment: totalStudents,
        avgGPA: courseStats.overall_avg_gpa ? parseFloat(courseStats.overall_avg_gpa).toFixed(2) : 'N/A',
        gradeDistribution: {
          aGrades: courseStats.total_a_grades || 0,
          bGrades: courseStats.total_b_grades || 0,
          cGrades: courseStats.total_c_grades || 0,
          dGrades: courseStats.total_d_grades || 0,
          fGrades: courseStats.total_f_grades || 0,
          withdrawals: courseStats.total_w_grades || 0,
          incomplete: courseStats.total_inc_na || 0
        },
        successRate: totalStudents > 0 ? 
          (((courseStats.total_a_grades || 0) + (courseStats.total_b_grades || 0) + (courseStats.total_c_grades || 0)) / totalStudents * 100).toFixed(1) : 0,
        difficulty: courseStats.overall_avg_gpa ? 
          (courseStats.overall_avg_gpa >= 3.5 ? 'Easy' : 
           courseStats.overall_avg_gpa >= 3.0 ? 'Moderate' : 
           courseStats.overall_avg_gpa >= 2.5 ? 'Challenging' : 'Difficult') : 'Unknown'
      },
      professors: professors.map(prof => ({
        name: prof.prof,
        sectionsTaught: prof.sections_taught,
        totalEnrollment: prof.total_enrollment,
        avgGPA: prof.avg_gpa ? parseFloat(prof.avg_gpa).toFixed(2) : 'N/A',
        gradeDistribution: {
          aGrades: prof.a_grades || 0,
          bGrades: prof.b_grades || 0,
          cGrades: prof.c_grades || 0,
          dGrades: prof.d_grades || 0,
          fGrades: prof.f_grades || 0,
          withdrawals: prof.w_grades || 0
        }
      })),
      termPerformance: terms.map(term => ({
        term: term.term,
        sections: term.sections,
        enrollment: term.enrollment,
        avgGPA: term.avg_gpa ? parseFloat(term.avg_gpa).toFixed(2) : 'N/A'
      }))
    });
  } catch (error) {
    console.error('Course analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze course'
    });
  }
});

// Get course recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { department, level, difficulty } = req.query;
    
    let sql = `
      SELECT 
        subject,
        nbr,
        course_name,
        COUNT(*) as total_sections,
        SUM(total) as total_enrollment,
        AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa,
        COUNT(DISTINCT prof) as professor_count
      FROM grades 
      WHERE 1=1
    `;
    
    const params = [];
    
    if (department) {
      sql += ` AND subject = ?`;
      params.push(department);
    }
    
    if (level) {
      sql += ` AND CAST(SUBSTR(nbr, 1, 1) AS INTEGER) = ?`;
      params.push(level);
    }
    
    sql += ` GROUP BY subject, nbr, course_name HAVING total_enrollment >= 10`;
    
    // Add difficulty filtering
    if (difficulty === 'easy') {
      sql += ` AND avg_gpa >= 3.5`;
    } else if (difficulty === 'moderate') {
      sql += ` AND avg_gpa >= 3.0 AND avg_gpa < 3.5`;
    } else if (difficulty === 'challenging') {
      sql += ` AND avg_gpa >= 2.5 AND avg_gpa < 3.0`;
    } else if (difficulty === 'difficult') {
      sql += ` AND avg_gpa < 2.5`;
    }
    
    sql += ` ORDER BY avg_gpa DESC LIMIT 10`;
    
    const courses = await req.databaseService.query(sql, params);
    
    res.json({
      success: true,
      recommendations: courses.map(course => ({
        id: `${course.subject}-${course.nbr}`,
        subject: course.subject,
        number: course.nbr,
        name: course.course_name,
        sectionCount: course.total_sections,
        totalEnrollment: course.total_enrollment,
        avgGPA: course.avg_gpa ? parseFloat(course.avg_gpa).toFixed(2) : 'N/A',
        professorCount: course.professor_count,
        difficulty: course.avg_gpa ? 
          (course.avg_gpa >= 3.5 ? 'Easy' : 
           course.avg_gpa >= 3.0 ? 'Moderate' : 
           course.avg_gpa >= 2.5 ? 'Challenging' : 'Difficult') : 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Course recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

module.exports = router;
