#!/usr/bin/env node

const RecommendationService = require('./server/services/recommendationService');
const DatabaseService = require('./server/services/databaseService');

async function demoAIRecommendations() {
    console.log('🚀 CUNY RMP Bot - AI Recommendation System Demo');
    console.log('================================================\n');

    // Initialize database service
    const databaseService = new DatabaseService();
    await databaseService.connect();
    
    const recommendationService = new RecommendationService(databaseService);

    // Sample student profile
    const studentProfile = {
        academicHistory: [
            { subject: 'CSCI', nbr: '111', course_name: 'Introduction to Computer Science', gpa: 3.8, term: 'FA24' },
            { subject: 'MATH', nbr: '141', course_name: 'Calculus I', gpa: 3.2, term: 'FA24' },
            { subject: 'ENGL', nbr: '110', course_name: 'College Composition', gpa: 3.5, term: 'FA24' },
            { subject: 'CSCI', nbr: '211', course_name: 'Object-Oriented Programming', gpa: 3.6, term: 'SP25' },
            { subject: 'MATH', nbr: '142', course_name: 'Calculus II', gpa: 2.8, term: 'SP25' }
        ],
        preferences: {
            preferredSubjects: ['CSCI', 'MATH'],
            avoidSubjects: ['PHYS'],
            targetGPA: 3.5
        },
        targetGPA: 3.5,
        learningStyle: 'balanced',
        workloadPreference: 'moderate'
    };

    console.log('📊 Analyzing Student Profile...');
    console.log('--------------------------------');
    console.log(`Student GPA: ${studentProfile.academicHistory.reduce((sum, course) => sum + course.gpa, 0) / studentProfile.academicHistory.length.toFixed(2)}`);
    console.log(`Courses taken: ${studentProfile.academicHistory.length}`);
    console.log(`Target GPA: ${studentProfile.targetGPA}`);
    console.log('');

    try {
        // Generate recommendations
        console.log('🤖 Generating AI Recommendations...');
        console.log('-----------------------------------');
        
        const result = await recommendationService.generateRecommendations(studentProfile);
        
        if (result.success) {
            console.log('✅ Recommendations Generated Successfully!\n');
            
            // Display patterns
            console.log('📈 Academic Pattern Analysis:');
            console.log('-----------------------------');
            console.log(`Average GPA: ${result.patterns.avgGPA.toFixed(2)}`);
            console.log(`Strength Areas: ${result.patterns.strengthAreas.join(', ') || 'None identified'}`);
            console.log(`Weakness Areas: ${result.patterns.weaknessAreas.join(', ') || 'None identified'}`);
            console.log(`Difficulty Preference: ${result.patterns.difficultyPreference}`);
            console.log(`Academic Consistency: ${result.patterns.consistency}`);
            console.log(`Performance Trend: ${result.patterns.improvementTrend}`);
            console.log('');

            // Display top recommendations
            console.log('🎯 Top Course Recommendations:');
            console.log('-------------------------------');
            result.recommendations.slice(0, 5).forEach((course, index) => {
                console.log(`${index + 1}. ${course.subject} ${course.nbr} - ${course.course_name}`);
                console.log(`   📊 Avg GPA: ${parseFloat(course.avg_gpa).toFixed(2)} | Success Probability: ${course.successProbability}%`);
                console.log(`   🏷️  Category: ${course.category} | Score: ${course.recommendationScore.toFixed(1)}/100`);
                console.log(`   💡 Reasoning: ${course.reasoning}`);
                console.log('');
            });

            // Display overall reasoning
            console.log('🧠 AI Reasoning:');
            console.log('----------------');
            console.log(result.reasoning);
            console.log('');

            // Demo professor recommendations
            if (result.recommendations.length > 0) {
                const topCourse = result.recommendations[0];
                const courseCode = `${topCourse.subject}${topCourse.nbr}`;
                
                console.log(`👨‍🏫 Professor Recommendations for ${courseCode}:`);
                console.log('------------------------------------------------');
                
                const professorRecs = await recommendationService.getProfessorRecommendations(courseCode, {
                    academicHistory: studentProfile.academicHistory,
                    patterns: result.patterns
                });
                
                professorRecs.slice(0, 3).forEach((prof, index) => {
                    console.log(`${index + 1}. ${prof.prof}`);
                    console.log(`   📊 Avg GPA: ${parseFloat(prof.avg_gpa).toFixed(2)} | Success Probability: ${prof.successProbability}%`);
                    console.log(`   💡 ${prof.reasoning}`);
                    console.log('');
                });
            }

        } else {
            console.log('❌ Failed to generate recommendations:', result.error);
        }

    } catch (error) {
        console.error('❌ Error during demo:', error);
    }

    console.log('🎉 Demo completed!');
    console.log('\n💡 To try the full interactive experience:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Start the client: npm run client');
    console.log('   3. Navigate to the AI Recommendations page');
    console.log('   4. Experience the full AI-powered recommendation system!');
}

// Run the demo
demoAIRecommendations().catch(console.error);
