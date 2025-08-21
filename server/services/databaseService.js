const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/grades.db');
        this.db = null;
    }

    // Initialize database connection
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to grades database');
                    resolve();
                }
            });
        });
    }

    // Close database connection
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Get all grade distribution data
    async getAllGrades() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM grades 
                ORDER BY term DESC, subject, nbr, section
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Search courses by code, name, or department
    async searchCourses(query) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT DISTINCT 
                    subject, nbr, course_name,
                    COUNT(*) as section_count,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as avg_gpa
                FROM grades 
                WHERE subject LIKE ? OR nbr LIKE ? OR course_name LIKE ?
                GROUP BY subject, nbr, course_name
                ORDER BY subject, nbr
            `;
            
            const searchTerm = `%${query}%`;
            this.db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Search professors by name
    async searchProfessor(professorName) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM grades 
                WHERE prof LIKE ? 
                ORDER BY term DESC, subject, nbr
            `;
            
            const searchTerm = `%${professorName}%`;
            this.db.all(sql, [searchTerm], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get course statistics by course code
    async getCourseStats(courseCode) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    subject, nbr, course_name,
                    COUNT(*) as total_sections,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as overall_avg_gpa,
                    SUM(a_plus + a + a_minus) as total_a_grades,
                    SUM(b_plus + b + b_minus) as total_b_grades,
                    SUM(c_plus + c + c_minus) as total_c_grades,
                    SUM(d) as total_d_grades,
                    SUM(f) as total_f_grades,
                    SUM(w) as total_w_grades,
                    SUM(inc_na) as total_inc_na
                FROM grades 
                WHERE (subject || nbr) = ?
                GROUP BY subject, nbr, course_name
            `;
            
            this.db.get(sql, [courseCode], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Get detailed course data including all sections
    async getCourseDetails(courseCode) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM grades 
                WHERE (subject || nbr) = ?
                ORDER BY term DESC, section
            `;
            
            this.db.all(sql, [courseCode], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get professor grades by name
    async getProfessorGrades(professorName) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    prof,
                    COUNT(*) as total_courses,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as avg_gpa,
                    SUM(a_plus + a + a_minus) as total_a_grades,
                    SUM(b_plus + b + b_minus) as total_b_grades,
                    SUM(c_plus + c + c_minus) as total_c_grades,
                    SUM(d) as total_d_grades,
                    SUM(f) as total_f_grades,
                    SUM(w) as total_w_grades,
                    SUM(inc_na) as total_inc_na
                FROM grades 
                WHERE prof LIKE ?
                GROUP BY prof
            `;
            
            const searchTerm = `%${professorName}%`;
            this.db.all(sql, [searchTerm], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get courses taught by a professor
    async getProfessorCourses(professorName) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    subject, nbr, course_name,
                    COUNT(*) as section_count,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as avg_gpa
                FROM grades 
                WHERE prof LIKE ?
                GROUP BY subject, nbr, course_name
                ORDER BY subject, nbr
            `;
            
            const searchTerm = `%${professorName}%`;
            this.db.all(sql, [searchTerm], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get all unique professors
    async getUniqueProfessors() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT DISTINCT prof 
                FROM grades 
                WHERE prof IS NOT NULL AND prof != ''
                ORDER BY prof
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.prof));
                }
            });
        });
    }

    // Get all unique courses
    async getUniqueCourses() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT DISTINCT subject, nbr, course_name
                FROM grades 
                ORDER BY subject, nbr
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get all departments/subjects
    async getDepartments() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT DISTINCT subject 
                FROM grades 
                WHERE subject IS NOT NULL AND subject != ''
                ORDER BY subject
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.subject));
                }
            });
        });
    }

    // Get courses by department
    async getCoursesByDepartment(department) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT DISTINCT 
                    subject, nbr, course_name,
                    COUNT(*) as section_count,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as avg_gpa
                FROM grades 
                WHERE subject = ?
                GROUP BY subject, nbr, course_name
                ORDER BY nbr
            `;
            
            this.db.all(sql, [department], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get grade summary by year/semester
    async getGradeSummary() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    term,
                    COUNT(*) as total_sections,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as avg_gpa,
                    SUM(a_plus + a + a_minus) as total_a_grades,
                    SUM(b_plus + b + b_minus) as total_b_grades,
                    SUM(c_plus + c + c_minus) as total_c_grades,
                    SUM(d) as total_d_grades,
                    SUM(f) as total_f_grades,
                    SUM(w) as total_w_grades,
                    SUM(inc_na) as total_inc_na
                FROM grades 
                GROUP BY term
                ORDER BY term DESC
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get professor performance over time
    async getProfessorPerformance(professorName) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    term,
                    COUNT(*) as courses_taught,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as avg_gpa
                FROM grades 
                WHERE prof LIKE ?
                GROUP BY term
                ORDER BY term DESC
            `;
            
            const searchTerm = `%${professorName}%`;
            this.db.all(sql, [searchTerm], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get top performing professors
    async getTopPerformingProfessors(limit = 10) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    prof,
                    COUNT(*) as total_courses,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as avg_gpa,
                    SUM(a_plus + a + a_minus) as total_a_grades,
                    SUM(b_plus + b + b_minus) as total_b_grades,
                    SUM(c_plus + c + c_minus) as total_c_grades,
                    SUM(d) as total_d_grades,
                    SUM(f) as total_f_grades
                FROM grades 
                WHERE prof IS NOT NULL AND prof != ''
                GROUP BY prof
                HAVING total_enrollment >= 10
                ORDER BY avg_gpa DESC
                LIMIT ?
            `;
            
            this.db.all(sql, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Calculate grade distribution percentages
    calculateGradeDistribution(row) {
        const total = row.total_enrollment || 0;
        if (total === 0) return {};

        return {
            a_plus: ((row.total_a_plus || 0) / total * 100).toFixed(1),
            a: ((row.total_a || 0) / total * 100).toFixed(1),
            a_minus: ((row.total_a_minus || 0) / total * 100).toFixed(1),
            b_plus: ((row.total_b_plus || 0) / total * 100).toFixed(1),
            b: ((row.total_b || 0) / total * 100).toFixed(1),
            b_minus: ((row.total_b_minus || 0) / total * 100).toFixed(1),
            c_plus: ((row.total_c_plus || 0) / total * 100).toFixed(1),
            c: ((row.total_c || 0) / total * 100).toFixed(1),
            c_minus: ((row.total_c_minus || 0) / total * 100).toFixed(1),
            d: ((row.total_d || 0) / total * 100).toFixed(1),
            f: ((row.total_f || 0) / total * 100).toFixed(1),
            w: ((row.total_w || 0) / total * 100).toFixed(1),
            inc_na: ((row.total_inc_na || 0) / total * 100).toFixed(1)
        };
    }

    // Get database statistics
    async getDatabaseStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT prof) as unique_professors,
                    COUNT(DISTINCT subject || nbr) as unique_courses,
                    COUNT(DISTINCT term) as unique_terms,
                    SUM(total) as total_enrollment,
                    AVG(avg_gpa) as overall_avg_gpa
                FROM grades
            `;
            
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = DatabaseService;
