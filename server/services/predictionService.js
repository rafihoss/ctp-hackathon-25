const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class PredictionService {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/grades.db');
  }

  // Predict likely grade for a student based on historical data
  async predictGrade(professorName, courseSubject, courseNumber, studentGPA = null) {
    try {
      const db = new sqlite3.Database(this.dbPath);
      
      // Get historical data for the professor and course
      const historicalData = await new Promise((resolve, reject) => {
        const sql = `
          SELECT 
            avg_gpa,
            ROUND((a_plus + a + a_minus) * 100.0 / total, 2) as a_percentage,
            ROUND((b_plus + b + b_minus) * 100.0 / total, 2) as b_percentage,
            ROUND((c_plus + c + c_minus) * 100.0 / total, 2) as c_percentage,
            ROUND((d + f) * 100.0 / total, 2) as df_percentage,
            total,
            term
          FROM grades 
          WHERE prof LIKE ? 
            AND subject = ? 
            AND nbr = ?
          ORDER BY term DESC
          LIMIT 10
        `;
        
        db.all(sql, [`%${professorName}%`, courseSubject, courseNumber], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (historicalData.length === 0) {
        db.close();
        return {
          prediction: 'Insufficient data',
          confidence: 0,
          reasoning: 'No historical data available for this professor and course combination.'
        };
      }

      // Calculate weighted average based on recent performance
      let weightedGPA = 0;
      let totalWeight = 0;
      let recentTrend = 0;

      historicalData.forEach((row, index) => {
        const weight = Math.pow(0.9, index); // More recent data has higher weight
        weightedGPA += parseFloat(row.avg_gpa) * weight;
        totalWeight += weight;
      });

      const averageGPA = weightedGPA / totalWeight;

      // Calculate grade distribution probabilities
      const avgAPercentage = historicalData.reduce((sum, row) => sum + parseFloat(row.a_percentage), 0) / historicalData.length;
      const avgBPercentage = historicalData.reduce((sum, row) => sum + parseFloat(row.b_percentage), 0) / historicalData.length;
      const avgCPercentage = historicalData.reduce((sum, row) => sum + parseFloat(row.c_percentage), 0) / historicalData.length;
      const avgDFPercentage = historicalData.reduce((sum, row) => sum + parseFloat(row.df_percentage), 0) / historicalData.length;

      // Determine most likely grade
      const gradeProbabilities = [
        { grade: 'A', probability: avgAPercentage },
        { grade: 'B', probability: avgBPercentage },
        { grade: 'C', probability: avgCPercentage },
        { grade: 'D/F', probability: avgDFPercentage }
      ];

      const mostLikelyGrade = gradeProbabilities.reduce((max, current) => 
        current.probability > max.probability ? current : max
      );

      // Calculate confidence based on data consistency
      const gpaVariance = historicalData.reduce((sum, row) => {
        const diff = parseFloat(row.avg_gpa) - averageGPA;
        return sum + (diff * diff);
      }, 0) / historicalData.length;

      const confidence = Math.max(0.3, Math.min(0.95, 1 - (gpaVariance / 2)));

      // Generate reasoning
      let reasoning = `Based on ${historicalData.length} semesters of data, `;
      reasoning += `Professor ${professorName} has an average GPA of ${averageGPA.toFixed(2)} in ${courseSubject} ${courseNumber}. `;
      reasoning += `The most common grade is ${mostLikelyGrade.grade} (${mostLikelyGrade.probability.toFixed(1)}% of students). `;

      if (studentGPA !== null) {
        if (studentGPA > averageGPA + 0.5) {
          reasoning += `Your GPA (${studentGPA}) is significantly higher than the class average, suggesting you may perform above average.`;
        } else if (studentGPA < averageGPA - 0.5) {
          reasoning += `Your GPA (${studentGPA}) is below the class average, so you may need to put in extra effort.`;
        } else {
          reasoning += `Your GPA (${studentGPA}) is close to the class average, so you can expect typical performance.`;
        }
      }

      db.close();

      return {
        prediction: mostLikelyGrade.grade,
        confidence: confidence,
        averageGPA: averageGPA,
        gradeProbabilities: gradeProbabilities,
        reasoning: reasoning,
        dataPoints: historicalData.length
      };

    } catch (error) {
      console.error('Grade prediction error:', error);
      throw error;
    }
  }

  // Recommend courses based on student preferences and performance
  async recommendCourses(studentGPA, preferredSubjects = [], maxDifficulty = 4.0) {
    try {
      const db = new sqlite3.Database(this.dbPath);
      
      // Get course recommendations
      const recommendations = await new Promise((resolve, reject) => {
        let sql = `
          SELECT 
            subject,
            nbr,
            course_name,
            prof,
            ROUND(AVG(avg_gpa), 2) as avg_gpa,
            ROUND(AVG((a_plus + a + a_minus) * 100.0 / total), 2) as a_percentage,
            ROUND(AVG((b_plus + b + b_minus) * 100.0 / total), 2) as b_percentage,
            ROUND(AVG((c_plus + c + c_minus) * 100.0 / total), 2) as c_percentage,
            ROUND(AVG((d + f) * 100.0 / total), 2) as df_percentage,
            COUNT(*) as offerings,
            SUM(total) as total_enrollment
          FROM grades 
          WHERE avg_gpa <= ?
        `;

        const params = [maxDifficulty];

        if (preferredSubjects.length > 0) {
          sql += ` AND subject IN (${preferredSubjects.map(() => '?').join(',')})`;
          params.push(...preferredSubjects);
        }

        sql += `
          GROUP BY subject, nbr, course_name, prof
          HAVING offerings >= 2
          ORDER BY avg_gpa DESC, a_percentage DESC
          LIMIT 20
        `;

        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Calculate recommendation scores
      const scoredRecommendations = recommendations.map(course => {
        const score = this.calculateRecommendationScore(course, studentGPA);
        return {
          ...course,
          score: score,
          difficulty: this.categorizeDifficulty(course.avg_gpa),
          recommendation: this.generateRecommendationReasoning(course, studentGPA)
        };
      });

      // Sort by score and return top recommendations
      const topRecommendations = scoredRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      db.close();

      return {
        recommendations: topRecommendations,
        totalCourses: recommendations.length,
        filters: {
          maxDifficulty,
          preferredSubjects,
          studentGPA
        }
      };

    } catch (error) {
      console.error('Course recommendation error:', error);
      throw error;
    }
  }

  // Calculate recommendation score based on multiple factors
  calculateRecommendationScore(course, studentGPA) {
    const gpaScore = Math.max(0, 1 - Math.abs(parseFloat(course.avg_gpa) - studentGPA) / 2);
    const aScore = parseFloat(course.a_percentage) / 100;
    const enrollmentScore = Math.min(1, course.total_enrollment / 1000);
    const offeringsScore = Math.min(1, course.offerings / 5);

    return (gpaScore * 0.4 + aScore * 0.3 + enrollmentScore * 0.2 + offeringsScore * 0.1);
  }

  // Categorize course difficulty
  categorizeDifficulty(avgGPA) {
    if (avgGPA >= 3.5) return 'Easy';
    if (avgGPA >= 3.0) return 'Moderate';
    if (avgGPA >= 2.5) return 'Challenging';
    return 'Difficult';
  }

  // Generate reasoning for recommendation
  generateRecommendationReasoning(course, studentGPA) {
    const avgGPA = parseFloat(course.avg_gpa);
    const aPercentage = parseFloat(course.a_percentage);
    
    let reasoning = `${course.subject} ${course.nbr} has an average GPA of ${avgGPA} `;
    reasoning += `with ${aPercentage}% of students earning A grades. `;
    
    if (studentGPA > avgGPA + 0.5) {
      reasoning += `This course should be manageable given your strong academic record.`;
    } else if (studentGPA < avgGPA - 0.5) {
      reasoning += `This course may be challenging, but the high A percentage suggests good teaching.`;
    } else {
      reasoning += `This course aligns well with your current academic performance.`;
    }

    return reasoning;
  }

  // Get professor matching based on learning style
  async matchProfessor(studentGPA, courseSubject, courseNumber, learningStyle = 'balanced') {
    try {
      const db = new sqlite3.Database(this.dbPath);
      
      const professors = await new Promise((resolve, reject) => {
        const sql = `
          SELECT 
            prof,
            ROUND(AVG(avg_gpa), 2) as avg_gpa,
            ROUND(AVG((a_plus + a + a_minus) * 100.0 / total), 2) as a_percentage,
            ROUND(AVG((b_plus + b + b_minus) * 100.0 / total), 2) as b_percentage,
            ROUND(AVG((c_plus + c + c_minus) * 100.0 / total), 2) as c_percentage,
            ROUND(AVG((d + f) * 100.0 / total), 2) as df_percentage,
            COUNT(*) as course_count,
            SUM(total) as total_students
          FROM grades 
          WHERE subject = ? AND nbr = ?
          GROUP BY prof
          HAVING course_count >= 2
          ORDER BY avg_gpa DESC
        `;
        
        db.all(sql, [courseSubject, courseNumber], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (professors.length === 0) {
        db.close();
        return { matches: [], reasoning: 'No professor data available for this course.' };
      }

      // Score professors based on learning style and student GPA
      const scoredProfessors = professors.map(prof => {
        const score = this.calculateProfessorMatchScore(prof, studentGPA, learningStyle);
        return {
          ...prof,
          score: score,
          matchReasoning: this.generateProfessorMatchReasoning(prof, studentGPA, learningStyle)
        };
      });

      const topMatches = scoredProfessors
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      db.close();

      return {
        matches: topMatches,
        reasoning: `Found ${professors.length} professors teaching ${courseSubject} ${courseNumber}. ` +
                  `Top matches are ranked by compatibility with your GPA (${studentGPA}) and learning style (${learningStyle}).`
      };

    } catch (error) {
      console.error('Professor matching error:', error);
      throw error;
    }
  }

  // Calculate professor match score
  calculateProfessorMatchScore(professor, studentGPA, learningStyle) {
    const avgGPA = parseFloat(professor.avg_gpa);
    const aPercentage = parseFloat(professor.a_percentage);
    const bPercentage = parseFloat(professor.b_percentage);
    const cPercentage = parseFloat(professor.c_percentage);

    let score = 0;

    // GPA compatibility
    const gpaDiff = Math.abs(avgGPA - studentGPA);
    score += Math.max(0, 1 - gpaDiff / 2) * 0.4;

    // Learning style compatibility
    switch (learningStyle) {
      case 'high_achiever':
        score += (aPercentage / 100) * 0.4;
        break;
      case 'balanced':
        score += ((aPercentage + bPercentage) / 200) * 0.4;
        break;
      case 'supportive':
        score += ((aPercentage + bPercentage + cPercentage) / 300) * 0.4;
        break;
      default:
        score += (aPercentage / 100) * 0.4;
    }

    // Experience factor
    score += Math.min(1, professor.course_count / 5) * 0.2;

    return score;
  }

  // Generate reasoning for professor match
  generateProfessorMatchReasoning(professor, studentGPA, learningStyle) {
    const avgGPA = parseFloat(professor.avg_gpa);
    const aPercentage = parseFloat(professor.a_percentage);
    
    let reasoning = `Professor ${professor.prof} has an average GPA of ${avgGPA} `;
    reasoning += `with ${aPercentage}% A grades. `;
    
    if (learningStyle === 'high_achiever') {
      reasoning += `High A percentage suggests challenging but rewarding coursework.`;
    } else if (learningStyle === 'supportive') {
      reasoning += `Good grade distribution indicates supportive teaching approach.`;
    } else {
      reasoning += `Balanced grade distribution suitable for most students.`;
    }

    return reasoning;
  }
}

module.exports = PredictionService;
