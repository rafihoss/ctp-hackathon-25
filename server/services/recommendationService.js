const DatabaseService = require('./databaseService');

class RecommendationService {
    constructor(databaseService = null) {
        this.databaseService = databaseService || new DatabaseService();
    }

    // Generate personalized course recommendations
    async generateRecommendations(studentProfile) {
        try {
            const {
                academicHistory = [],
                preferences = {},
                targetGPA = 3.0,
                learningStyle = 'balanced',
                workloadPreference = 'moderate'
            } = studentProfile;

            // Analyze student's academic patterns
            const patterns = this.analyzeAcademicPatterns(academicHistory);
            
            // Find similar students
            const similarStudents = await this.findSimilarStudents(patterns);
            
            // Get course recommendations based on patterns
            const recommendations = await this.getCourseRecommendations(
                patterns, 
                similarStudents, 
                preferences,
                targetGPA,
                learningStyle,
                workloadPreference
            );

            return {
                success: true,
                recommendations,
                patterns,
                reasoning: this.generateReasoning(patterns, recommendations)
            };
        } catch (error) {
            console.error('Recommendation generation error:', error);
            return {
                success: false,
                error: 'Failed to generate recommendations'
            };
        }
    }

    // Analyze student's academic patterns
    analyzeAcademicPatterns(academicHistory) {
        if (!academicHistory || academicHistory.length === 0) {
            return {
                avgGPA: 3.0,
                strengthAreas: [],
                weaknessAreas: [],
                difficultyPreference: 'moderate',
                consistency: 'unknown',
                improvementTrend: 'stable'
            };
        }

        const gpas = academicHistory.map(course => parseFloat(course.gpa) || 0);
        const avgGPA = gpas.reduce((sum, gpa) => sum + gpa, 0) / gpas.length;

        // Analyze performance by subject
        const subjectPerformance = {};
        academicHistory.forEach(course => {
            const subject = course.subject;
            if (!subjectPerformance[subject]) {
                subjectPerformance[subject] = [];
            }
            subjectPerformance[subject].push(parseFloat(course.gpa) || 0);
        });

        const strengthAreas = [];
        const weaknessAreas = [];
        
        Object.entries(subjectPerformance).forEach(([subject, grades]) => {
            const avgGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
            if (avgGrade >= 3.5) {
                strengthAreas.push(subject);
            } else if (avgGrade <= 2.5) {
                weaknessAreas.push(subject);
            }
        });

        // Analyze difficulty preference
        const difficultyScores = academicHistory.map(course => {
            const courseDifficulty = this.calculateCourseDifficulty(course);
            const studentPerformance = parseFloat(course.gpa) || 0;
            return { difficulty: courseDifficulty, performance: studentPerformance };
        });

        const difficultyPreference = this.analyzeDifficultyPreference(difficultyScores);

        // Analyze consistency and trends
        const consistency = this.analyzeConsistency(gpas);
        const improvementTrend = this.analyzeImprovementTrend(gpas);

        return {
            avgGPA,
            strengthAreas,
            weaknessAreas,
            difficultyPreference,
            consistency,
            improvementTrend,
            totalCourses: academicHistory.length
        };
    }

    // Calculate course difficulty based on historical data
    calculateCourseDifficulty(course) {
        // This would be enhanced with more sophisticated algorithms
        const avgGPA = parseFloat(course.avg_gpa) || 3.0;
        const withdrawalRate = (parseInt(course.w) || 0) / (parseInt(course.total) || 1);
        
        if (avgGPA < 2.5 || withdrawalRate > 0.15) return 'difficult';
        if (avgGPA > 3.5 && withdrawalRate < 0.05) return 'easy';
        return 'moderate';
    }

    // Analyze student's difficulty preference
    analyzeDifficultyPreference(difficultyScores) {
        const preferences = difficultyScores.map(score => {
            if (score.difficulty === 'difficult' && score.performance >= 3.0) return 'challenging';
            if (score.difficulty === 'easy' && score.performance >= 3.5) return 'comfortable';
            return 'moderate';
        });

        const challengingCount = preferences.filter(p => p === 'challenging').length;
        const comfortableCount = preferences.filter(p => p === 'comfortable').length;
        const moderateCount = preferences.filter(p => p === 'moderate').length;

        if (challengingCount > comfortableCount && challengingCount > moderateCount) return 'challenging';
        if (comfortableCount > challengingCount && comfortableCount > moderateCount) return 'comfortable';
        return 'moderate';
    }

    // Analyze academic consistency
    analyzeConsistency(gpas) {
        if (gpas.length < 2) return 'unknown';
        
        const variance = this.calculateVariance(gpas);
        if (variance < 0.3) return 'high';
        if (variance < 0.6) return 'moderate';
        return 'low';
    }

    // Analyze improvement trend
    analyzeImprovementTrend(gpas) {
        if (gpas.length < 3) return 'stable';
        
        const recentGrades = gpas.slice(-3);
        const earlierGrades = gpas.slice(0, 3);
        
        const recentAvg = recentGrades.reduce((sum, grade) => sum + grade, 0) / recentGrades.length;
        const earlierAvg = earlierGrades.reduce((sum, grade) => sum + grade, 0) / earlierGrades.length;
        
        if (recentAvg - earlierAvg > 0.5) return 'improving';
        if (earlierAvg - recentAvg > 0.5) return 'declining';
        return 'stable';
    }

    // Calculate variance
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }

    // Find students with similar academic patterns
    async findSimilarStudents(patterns) {
        try {
            const sql = `
                SELECT DISTINCT 
                    prof,
                    subject,
                    nbr,
                    course_name,
                    AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa,
                    COUNT(*) as course_count,
                    SUM(total) as total_enrollment
                FROM grades 
                WHERE prof IS NOT NULL AND prof != ''
                GROUP BY prof, subject, nbr, course_name
                HAVING course_count >= 2
                ORDER BY avg_gpa DESC
                LIMIT 50
            `;
            
            const courses = await this.databaseService.query(sql);
            
            // Filter courses based on student patterns
            return courses.filter(course => {
                const courseGPA = parseFloat(course.avg_gpa) || 0;
                
                // Match difficulty preference
                if (patterns.difficultyPreference === 'challenging' && courseGPA < 3.0) return true;
                if (patterns.difficultyPreference === 'comfortable' && courseGPA > 3.3) return true;
                if (patterns.difficultyPreference === 'moderate' && courseGPA >= 2.8 && courseGPA <= 3.5) return true;
                
                // Match strength areas
                if (patterns.strengthAreas.includes(course.subject)) return true;
                
                return false;
            });
        } catch (error) {
            console.error('Error finding similar students:', error);
            return [];
        }
    }

    // Get course recommendations
    async getCourseRecommendations(patterns, similarCourses, preferences, targetGPA, learningStyle, workloadPreference) {
        try {
            // Get all available courses
            const sql = `
                SELECT DISTINCT 
                    subject, nbr, course_name,
                    COUNT(*) as section_count,
                    AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa,
                    SUM(total) as total_enrollment,
                    AVG(CAST(w AS FLOAT) / CAST(total AS FLOAT)) as withdrawal_rate
                FROM grades 
                WHERE prof IS NOT NULL AND prof != ''
                GROUP BY subject, nbr, course_name
                HAVING section_count >= 2
                ORDER BY avg_gpa DESC
            `;
            
            const allCourses = await this.databaseService.query(sql);
            
            // Score and rank courses
            const scoredCourses = allCourses.map(course => {
                const score = this.calculateRecommendationScore(
                    course, 
                    patterns, 
                    preferences, 
                    targetGPA, 
                    learningStyle, 
                    workloadPreference
                );
                
                return {
                    ...course,
                    recommendationScore: score,
                    successProbability: this.calculateSuccessProbability(course, patterns),
                    reasoning: this.generateCourseReasoning(course, patterns)
                };
            });

            // Sort by recommendation score and return top recommendations
            return scoredCourses
                .sort((a, b) => b.recommendationScore - a.recommendationScore)
                .slice(0, 10)
                .map((course, index) => ({
                    ...course,
                    rank: index + 1,
                    category: this.categorizeRecommendation(course, patterns)
                }));
        } catch (error) {
            console.error('Error getting course recommendations:', error);
            return [];
        }
    }

    // Calculate recommendation score for a course
    calculateRecommendationScore(course, patterns, preferences, targetGPA, learningStyle, workloadPreference) {
        let score = 0;
        const courseGPA = parseFloat(course.avg_gpa) || 0;
        const withdrawalRate = parseFloat(course.withdrawal_rate) || 0;

        // GPA alignment with target
        const gpaAlignment = 1 - Math.abs(courseGPA - targetGPA) / 4.0;
        score += gpaAlignment * 30;

        // Difficulty preference matching
        if (patterns.difficultyPreference === 'challenging' && courseGPA < 3.2) score += 25;
        else if (patterns.difficultyPreference === 'comfortable' && courseGPA > 3.3) score += 25;
        else if (patterns.difficultyPreference === 'moderate' && courseGPA >= 2.8 && courseGPA <= 3.5) score += 25;

        // Strength area bonus
        if (patterns.strengthAreas.includes(course.subject)) score += 20;

        // Withdrawal rate penalty
        score -= withdrawalRate * 100;

        // Consistency bonus
        if (patterns.consistency === 'high') score += 10;
        else if (patterns.consistency === 'moderate') score += 5;

        // Improvement trend bonus
        if (patterns.improvementTrend === 'improving') score += 15;
        else if (patterns.improvementTrend === 'stable') score += 10;

        return Math.max(0, Math.min(100, score));
    }

    // Calculate success probability
    calculateSuccessProbability(course, patterns) {
        const courseGPA = parseFloat(course.avg_gpa) || 0;
        const studentGPA = patterns.avgGPA;
        
        // Base probability based on GPA comparison
        let probability = 50;
        
        if (studentGPA > courseGPA + 0.5) probability += 30;
        else if (studentGPA > courseGPA) probability += 15;
        else if (studentGPA < courseGPA - 0.5) probability -= 20;
        
        // Adjust based on patterns
        if (patterns.strengthAreas.includes(course.subject)) probability += 15;
        if (patterns.consistency === 'high') probability += 10;
        if (patterns.improvementTrend === 'improving') probability += 10;
        
        return Math.max(0, Math.min(100, probability));
    }

    // Generate reasoning for course recommendation
    generateCourseReasoning(course, patterns) {
        const reasons = [];
        const courseGPA = parseFloat(course.avg_gpa) || 0;
        
        if (patterns.strengthAreas.includes(course.subject)) {
            reasons.push(`You excel in ${course.subject} courses`);
        }
        
        if (courseGPA >= patterns.avgGPA + 0.3) {
            reasons.push(`Course GPA (${courseGPA.toFixed(2)}) is above your average (${patterns.avgGPA.toFixed(2)})`);
        }
        
        if (patterns.difficultyPreference === 'challenging' && courseGPA < 3.2) {
            reasons.push('Matches your preference for challenging courses');
        }
        
        if (patterns.consistency === 'high') {
            reasons.push('Your consistent academic performance suggests you can handle this course');
        }
        
        return reasons.length > 0 ? reasons.join('. ') : 'Good match based on course difficulty and your academic profile';
    }

    // Categorize recommendation
    categorizeRecommendation(course, patterns) {
        const courseGPA = parseFloat(course.avg_gpa) || 0;
        const probability = this.calculateSuccessProbability(course, patterns);
        
        if (probability >= 80) return 'excellent';
        if (probability >= 65) return 'good';
        if (probability >= 50) return 'moderate';
        return 'challenging';
    }

    // Generate overall reasoning
    generateReasoning(patterns, recommendations) {
        const reasoning = [];
        
        if (patterns.strengthAreas.length > 0) {
            reasoning.push(`You show strong performance in: ${patterns.strengthAreas.join(', ')}`);
        }
        
        if (patterns.weaknessAreas.length > 0) {
            reasoning.push(`Consider focusing on: ${patterns.weaknessAreas.join(', ')}`);
        }
        
        reasoning.push(`Your academic consistency is ${patterns.consistency}`);
        reasoning.push(`Your performance trend is ${patterns.improvementTrend}`);
        
        const topRecommendation = recommendations[0];
        if (topRecommendation) {
            reasoning.push(`Top recommendation: ${topRecommendation.subject} ${topRecommendation.nbr} with ${topRecommendation.successProbability}% success probability`);
        }
        
        return reasoning.join('. ');
    }

    // Get professor recommendations for a specific course
    async getProfessorRecommendations(courseCode, studentProfile) {
        try {
            const sql = `
                SELECT 
                    prof,
                    subject,
                    nbr,
                    course_name,
                    term,
                    AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa,
                    COUNT(*) as section_count,
                    SUM(total) as total_enrollment,
                    AVG(CAST(w AS FLOAT) / CAST(total AS FLOAT)) as withdrawal_rate
                FROM grades 
                WHERE (subject || nbr) = ? AND prof IS NOT NULL AND prof != ''
                GROUP BY prof
                HAVING section_count >= 1
                ORDER BY avg_gpa DESC
            `;
            
            const professors = await this.databaseService.query(sql, [courseCode]);
            
            return professors.map(prof => ({
                ...prof,
                successProbability: this.calculateProfessorSuccessProbability(prof, studentProfile),
                reasoning: this.generateProfessorReasoning(prof, studentProfile)
            })).sort((a, b) => b.successProbability - a.successProbability);
        } catch (error) {
            console.error('Error getting professor recommendations:', error);
            return [];
        }
    }

    // Calculate professor success probability
    calculateProfessorSuccessProbability(professor, studentProfile) {
        const professorGPA = parseFloat(professor.avg_gpa) || 0;
        const studentGPA = studentProfile.patterns?.avgGPA || 3.0;
        
        let probability = 50;
        
        if (professorGPA > studentGPA + 0.3) probability += 25;
        else if (professorGPA > studentGPA) probability += 15;
        else if (professorGPA < studentGPA - 0.3) probability -= 15;
        
        const withdrawalRate = parseFloat(professor.withdrawal_rate) || 0;
        probability -= withdrawalRate * 100;
        
        return Math.max(0, Math.min(100, probability));
    }

    // Generate professor reasoning
    generateProfessorReasoning(professor, studentProfile) {
        const professorGPA = parseFloat(professor.avg_gpa) || 0;
        const studentGPA = studentProfile.patterns?.avgGPA || 3.0;
        
        if (professorGPA > studentGPA + 0.5) {
            return `Professor typically achieves higher grades than your average`;
        } else if (professorGPA > studentGPA) {
            return `Good match for your academic level`;
        } else {
            return `Challenging but manageable based on your performance`;
        }
    }
}

module.exports = RecommendationService;
