const express = require('express');
const router = express.Router();
const RecommendationService = require('../services/recommendationService');

// Get personalized course recommendations
router.post('/courses', async (req, res) => {
    try {
        const recommendationService = new RecommendationService(req.databaseService);
        
        const {
            academicHistory = [],
            preferences = {},
            targetGPA = 3.0,
            learningStyle = 'balanced',
            workloadPreference = 'moderate'
        } = req.body;

        const studentProfile = {
            academicHistory,
            preferences,
            targetGPA,
            learningStyle,
            workloadPreference
        };

        const result = await recommendationService.generateRecommendations(studentProfile);

        if (result.success) {
            res.json({
                success: true,
                recommendations: result.recommendations,
                patterns: result.patterns,
                reasoning: result.reasoning,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Course recommendation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate course recommendations'
        });
    }
});

// Get professor recommendations for a specific course
router.post('/professors/:courseCode', async (req, res) => {
    try {
        const recommendationService = new RecommendationService(req.databaseService);
        const { courseCode } = req.params;
        const { academicHistory = [], preferences = {} } = req.body;

        const studentProfile = {
            academicHistory,
            preferences,
            patterns: recommendationService.analyzeAcademicPatterns(academicHistory)
        };

        const recommendations = await recommendationService.getProfessorRecommendations(courseCode, studentProfile);

        res.json({
            success: true,
            courseCode,
            recommendations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Professor recommendation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate professor recommendations'
        });
    }
});

// Get academic pattern analysis
router.post('/analyze-patterns', async (req, res) => {
    try {
        const recommendationService = new RecommendationService(req.databaseService);
        const { academicHistory = [] } = req.body;

        const patterns = recommendationService.analyzeAcademicPatterns(academicHistory);

        res.json({
            success: true,
            patterns,
            insights: generateInsights(patterns),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Pattern analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze academic patterns'
        });
    }
});

// Get course difficulty analysis
router.get('/course-difficulty/:courseCode', async (req, res) => {
    try {
        const { courseCode } = req.params;

        const sql = `
            SELECT 
                subject, nbr, course_name,
                AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa,
                COUNT(*) as section_count,
                SUM(total) as total_enrollment,
                AVG(CAST(w AS FLOAT) / CAST(total AS FLOAT)) as withdrawal_rate,
                AVG(CAST(a_plus + a + a_minus AS FLOAT) / CAST(total AS FLOAT)) as a_rate,
                AVG(CAST(b_plus + b + b_minus AS FLOAT) / CAST(total AS FLOAT)) as b_rate,
                AVG(CAST(c_plus + c + c_minus AS FLOAT) / CAST(total AS FLOAT)) as c_rate,
                AVG(CAST(d AS FLOAT) / CAST(total AS FLOAT)) as d_rate,
                AVG(CAST(f AS FLOAT) / CAST(total AS FLOAT)) as f_rate
            FROM grades 
            WHERE (subject || nbr) = ?
            GROUP BY subject, nbr, course_name
        `;

        const courseData = await req.databaseService.query(sql, [courseCode]);

        if (courseData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        const course = courseData[0];
        const recommendationService = new RecommendationService(req.databaseService);
        const difficulty = recommendationService.calculateCourseDifficulty(course);

        res.json({
            success: true,
            course: {
                ...course,
                difficulty,
                difficultyScore: calculateDifficultyScore(course),
                recommendations: generateDifficultyRecommendations(course, difficulty)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Course difficulty analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze course difficulty'
        });
    }
});

// Get learning path recommendations
router.post('/learning-path', async (req, res) => {
    try {
        const recommendationService = new RecommendationService(req.databaseService);
        const {
            currentCourses = [],
            targetCourses = [],
            academicHistory = [],
            targetGPA = 3.0
        } = req.body;

        const patterns = recommendationService.analyzeAcademicPatterns(academicHistory);
        
        // Generate learning path based on current and target courses
        const learningPath = await generateLearningPath(
            currentCourses, 
            targetCourses, 
            patterns, 
            targetGPA,
            req.databaseService
        );

        res.json({
            success: true,
            learningPath,
            patterns,
            estimatedCompletion: calculateCompletionTime(learningPath),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Learning path error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate learning path'
        });
    }
});

// Helper functions
function generateInsights(patterns) {
    const insights = [];

    if (patterns.strengthAreas.length > 0) {
        insights.push({
            type: 'strength',
            message: `You excel in ${patterns.strengthAreas.join(', ')} courses`,
            recommendation: 'Consider taking advanced courses in these subjects'
        });
    }

    if (patterns.weaknessAreas.length > 0) {
        insights.push({
            type: 'improvement',
            message: `You may want to focus on ${patterns.weaknessAreas.join(', ')}`,
            recommendation: 'Consider taking foundational courses or seeking tutoring'
        });
    }

    if (patterns.consistency === 'low') {
        insights.push({
            type: 'consistency',
            message: 'Your academic performance varies significantly',
            recommendation: 'Consider developing better study habits and time management'
        });
    }

    if (patterns.improvementTrend === 'declining') {
        insights.push({
            type: 'trend',
            message: 'Your recent performance shows a declining trend',
            recommendation: 'Consider reducing course load or seeking academic support'
        });
    }

    return insights;
}

function calculateDifficultyScore(course) {
    const avgGPA = parseFloat(course.avg_gpa) || 3.0;
    const withdrawalRate = parseFloat(course.withdrawal_rate) || 0;
    const failRate = parseFloat(course.f_rate) || 0;

    // Lower GPA and higher withdrawal/fail rates = higher difficulty
    let score = 50; // Base score

    if (avgGPA < 2.5) score += 30;
    else if (avgGPA < 3.0) score += 15;
    else if (avgGPA > 3.5) score -= 20;

    score += withdrawalRate * 200;
    score += failRate * 300;

    return Math.max(0, Math.min(100, score));
}

function generateDifficultyRecommendations(course, difficulty) {
    const recommendations = [];

    if (difficulty === 'difficult') {
        recommendations.push('Consider taking prerequisite courses first');
        recommendations.push('Plan for extra study time (10+ hours per week)');
        recommendations.push('Form study groups with classmates');
        recommendations.push('Seek tutoring or office hours early');
    } else if (difficulty === 'moderate') {
        recommendations.push('Standard study time (6-8 hours per week)');
        recommendations.push('Attend all lectures and complete assignments on time');
        recommendations.push('Review material regularly');
    } else {
        recommendations.push('Good course for building confidence');
        recommendations.push('Consider taking additional challenging courses');
        recommendations.push('Use extra time for other demanding courses');
    }

    return recommendations;
}

async function generateLearningPath(currentCourses, targetCourses, patterns, targetGPA, databaseService) {
    const path = [];
    const completed = new Set(currentCourses.map(c => `${c.subject}${c.nbr}`));
    const targets = new Set(targetCourses.map(c => `${c.subject}${c.nbr}`));

    // Get all available courses
    const sql = `
        SELECT DISTINCT 
            subject, nbr, course_name,
            AVG(CAST(avg_gpa AS FLOAT)) as avg_gpa,
            COUNT(*) as section_count
        FROM grades 
        WHERE prof IS NOT NULL AND prof != ''
        GROUP BY subject, nbr, course_name
        HAVING section_count >= 2
        ORDER BY subject, nbr
    `;

    const allCourses = await databaseService.query(sql);

    // Find courses that lead to target courses
    for (const target of targetCourses) {
        const targetCode = `${target.subject}${target.nbr}`;
        if (completed.has(targetCode)) continue;

        // Find prerequisites or related courses
        const relatedCourses = allCourses.filter(course => {
            const courseCode = `${course.subject}${course.nbr}`;
            return !completed.has(courseCode) && 
                   (course.subject === target.subject || 
                    parseInt(course.nbr) < parseInt(target.nbr));
        });

        // Sort by recommendation score
        const recommendationService = new RecommendationService(databaseService);
        const scoredCourses = relatedCourses.map(course => ({
            ...course,
            score: recommendationService.calculateRecommendationScore(
                course, patterns, {}, targetGPA, 'balanced', 'moderate'
            )
        })).sort((a, b) => b.score - a.score);

        path.push({
            target: target,
            prerequisites: scoredCourses.slice(0, 3),
            estimatedSemesters: Math.ceil(scoredCourses.length / 2)
        });
    }

    return path;
}

function calculateCompletionTime(learningPath) {
    const totalSemesters = learningPath.reduce((sum, path) => sum + path.estimatedSemesters, 0);
    return {
        semesters: totalSemesters,
        years: Math.ceil(totalSemesters / 2),
        recommendedPace: totalSemesters <= 4 ? 'normal' : 'accelerated'
    };
}

module.exports = router;
