const DatabaseService = require('./databaseService');
const NodeCache = require('node-cache');

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

class GradeDistributionService {
  constructor() {
    this.dbService = new DatabaseService();
    this.cache = cache;
  }

  // Initialize database connection
  async initialize() {
    try {
      await this.dbService.connect();
      console.log('Database service initialized successfully');
    } catch (error) {
      console.error('Error initializing database service:', error);
      throw new Error('Database initialization failed');
    }
  }

  // Get grade distribution data from database
  async getGradeDistribution() {
    const cacheKey = 'grades_all_data';
    
    // Check cache first
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      const data = await this.dbService.getAllGrades();
      
      // Cache the result
      this.cache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching grade distribution:', error);
      throw new Error(`Failed to fetch grade distribution: ${error.message}`);
    }
  }

  // Search for courses by department or course code
  async searchCourses(query) {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      const results = await this.dbService.searchCourses(query);
      return results;
    } catch (error) {
      console.error('Error searching courses:', error);
      throw new Error(`Failed to search courses: ${error.message}`);
    }
  }

  // Get grade statistics for a specific course
  async getCourseStats(courseCode) {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      const courseData = await this.dbService.getCourseStats(courseCode);
      
      if (!courseData) {
        throw new Error(`No data found for course: ${courseCode}`);
      }

      // Calculate additional statistics
      const stats = {
        courseCode: courseCode,
        courseName: courseData.course_name,
        subject: courseData.subject,
        totalSections: courseData.total_sections,
        totalEnrollment: courseData.total_enrollment,
        averageGPA: courseData.overall_avg_gpa,
        averageGrades: this.calculateAverageGrades(courseData),
        gradeDistribution: this.dbService.calculateGradeDistribution(courseData),
        professors: await this.getUniqueProfessors(courseCode)
      };

      return stats;
    } catch (error) {
      console.error('Error getting course stats:', error);
      throw new Error(`Failed to get course stats: ${error.message}`);
    }
  }

  // Calculate average grades across all sections
  calculateAverageGrades(courseData) {
    const totalStudents = courseData.total_enrollment || 0;
    const totalAs = (courseData.total_a_grades || 0);
    const totalBs = (courseData.total_b_grades || 0);
    const totalCs = (courseData.total_c_grades || 0);
    const totalDs = (courseData.total_d_grades || 0);
    const totalFs = (courseData.total_f_grades || 0);

    return {
      totalStudents,
      aPercentage: totalStudents > 0 ? ((totalAs / totalStudents) * 100).toFixed(2) : 0,
      bPercentage: totalStudents > 0 ? ((totalBs / totalStudents) * 100).toFixed(2) : 0,
      cPercentage: totalStudents > 0 ? ((totalCs / totalStudents) * 100).toFixed(2) : 0,
      dPercentage: totalStudents > 0 ? ((totalDs / totalStudents) * 100).toFixed(2) : 0,
      fPercentage: totalStudents > 0 ? ((totalFs / totalStudents) * 100).toFixed(2) : 0
    };
  }

  // Get unique professors for a course
  async getUniqueProfessors(courseCode) {
    try {
      const courseDetails = await this.dbService.getCourseDetails(courseCode);
      const professors = new Set();
      courseDetails.forEach(row => {
        if (row.prof) {
          professors.add(row.prof);
        }
      });
      return Array.from(professors);
    } catch (error) {
      console.error('Error getting unique professors:', error);
      return [];
    }
  }

  // Get professor-specific grade data
  async getProfessorGrades(professorName) {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      const professorData = await this.dbService.getProfessorGrades(professorName);
      
      if (!professorData || professorData.length === 0) {
        throw new Error(`No data found for professor: ${professorName}`);
      }

      const professor = professorData[0];
      const courses = await this.dbService.getProfessorCourses(professorName);

      const stats = {
        professor: professorName,
        totalCourses: professor.total_courses,
        totalEnrollment: professor.total_enrollment,
        averageGPA: professor.avg_gpa,
        averageGrades: this.calculateAverageGrades(professor),
        gradeDistribution: this.dbService.calculateGradeDistribution(professor),
        courses: courses.map(course => `${course.subject}${course.nbr} - ${course.course_name}`)
      };

      return stats;
    } catch (error) {
      console.error('Error getting professor grades:', error);
      throw new Error(`Failed to get professor grades: ${error.message}`);
    }
  }

  // Get all unique professors
  async getUniqueProfessors() {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      return await this.dbService.getUniqueProfessors();
    } catch (error) {
      console.error('Error getting unique professors:', error);
      throw new Error(`Failed to get unique professors: ${error.message}`);
    }
  }

  // Get all unique courses
  async getUniqueCourses() {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      return await this.dbService.getUniqueCourses();
    } catch (error) {
      console.error('Error getting unique courses:', error);
      throw new Error(`Failed to get unique courses: ${error.message}`);
    }
  }

  // Get all departments
  async getDepartments() {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      return await this.dbService.getDepartments();
    } catch (error) {
      console.error('Error getting departments:', error);
      throw new Error(`Failed to get departments: ${error.message}`);
    }
  }

  // Get courses by department
  async getCoursesByDepartment(department) {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      return await this.dbService.getCoursesByDepartment(department);
    } catch (error) {
      console.error('Error getting courses by department:', error);
      throw new Error(`Failed to get courses by department: ${error.message}`);
    }
  }

  // Get grade summary by year/semester
  async getGradeSummary() {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      return await this.dbService.getGradeSummary();
    } catch (error) {
      console.error('Error getting grade summary:', error);
      throw new Error(`Failed to get grade summary: ${error.message}`);
    }
  }

  // Get professor performance over time
  async getProfessorPerformance(professorName) {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      return await this.dbService.getProfessorPerformance(professorName);
    } catch (error) {
      console.error('Error getting professor performance:', error);
      throw new Error(`Failed to get professor performance: ${error.message}`);
    }
  }

  // Get top performing professors
  async getTopPerformingProfessors(limit = 10) {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      return await this.dbService.getTopPerformingProfessors(limit);
    } catch (error) {
      console.error('Error getting top performing professors:', error);
      throw new Error(`Failed to get top performing professors: ${error.message}`);
    }
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      if (!this.dbService.db) {
        await this.initialize();
      }
      
      return await this.dbService.getDatabaseStats();
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }
}

module.exports = new GradeDistributionService();
