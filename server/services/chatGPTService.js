const OpenAI = require('openai');
const NodeCache = require('node-cache');

class ChatGPTService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes cache
    }

    // Generate professor recommendations based on course and preferences
    async generateProfessorRecommendations(courseCode, courseName, availableProfessors, userPreferences = {}) {
        const cacheKey = `recommendations_${courseCode}_${JSON.stringify(userPreferences)}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const prompt = this.buildRecommendationPrompt(courseCode, courseName, availableProfessors, userPreferences);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert academic advisor at Queens College, CUNY. You help students choose the best professors based on grade distributions, teaching styles, and student preferences. Provide clear, helpful recommendations with specific reasoning."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            });

            const recommendation = response.choices[0].message.content;
            this.cache.set(cacheKey, recommendation);
            
            return recommendation;
        } catch (error) {
            console.error('Error generating professor recommendations:', error);
            throw new Error('Failed to generate recommendations');
        }
    }

    // Analyze course difficulty and provide insights
    async analyzeCourseDifficulty(courseData, historicalData) {
        const cacheKey = `analysis_${courseData.courseCode}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const prompt = this.buildCourseAnalysisPrompt(courseData, historicalData);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an academic analyst specializing in course difficulty assessment. Analyze grade distributions and provide insights about course difficulty, success rates, and student performance patterns."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 600,
                temperature: 0.5
            });

            const analysis = response.choices[0].message.content;
            this.cache.set(cacheKey, analysis);
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing course difficulty:', error);
            throw new Error('Failed to analyze course difficulty');
        }
    }

    // Compare professors with AI insights
    async compareProfessorsAI(professorData1, professorData2, professorData3 = null) {
        const cacheKey = `comparison_${professorData1.name}_${professorData2.name}_${professorData3?.name || 'none'}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const prompt = this.buildComparisonPrompt(professorData1, professorData2, professorData3);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert professor evaluator. Compare professors based on their teaching performance, grade distributions, and student feedback. Provide balanced, objective analysis with specific recommendations."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.6
            });

            const comparison = response.choices[0].message.content;
            this.cache.set(cacheKey, comparison);
            
            return comparison;
        } catch (error) {
            console.error('Error comparing professors:', error);
            throw new Error('Failed to compare professors');
        }
    }

    // Generate study tips and advice for a course
    async generateStudyAdvice(courseCode, courseName, professorData, gradeDistribution) {
        const cacheKey = `advice_${courseCode}_${professorData.name}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const prompt = this.buildStudyAdvicePrompt(courseCode, courseName, professorData, gradeDistribution);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an experienced academic advisor and study skills expert. Provide practical, actionable advice for students taking specific courses with specific professors."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 700,
                temperature: 0.7
            });

            const advice = response.choices[0].message.content;
            this.cache.set(cacheKey, advice);
            
            return advice;
        } catch (error) {
            console.error('Error generating study advice:', error);
            throw new Error('Failed to generate study advice');
        }
    }

    // Answer general questions about courses and professors
    async answerQuestion(question, context = {}) {
        const cacheKey = `qa_${question.substring(0, 50)}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const prompt = this.buildQuestionPrompt(question, context);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful academic advisor at Queens College, CUNY. Answer questions about courses, professors, and academic planning based on available data and general academic knowledge."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.6
            });

            const answer = response.choices[0].message.content;
            this.cache.set(cacheKey, answer);
            
            return answer;
        } catch (error) {
            console.error('Error answering question:', error);
            throw new Error('Failed to answer question');
        }
    }

    // Build recommendation prompt
    buildRecommendationPrompt(courseCode, courseName, availableProfessors, userPreferences) {
        return `
I need help choosing a professor for ${courseCode} - ${courseName}.

Available professors and their data:
${availableProfessors.map(prof => `
- ${prof.name}
  * Average GPA: ${prof.avgGPA}
  * Total students: ${prof.totalStudents}
  * A grades: ${prof.aPercentage}%
  * B grades: ${prof.bPercentage}%
  * C grades: ${prof.cPercentage}%
  * D/F grades: ${prof.dfPercentage}%
`).join('\n')}

Student preferences: ${JSON.stringify(userPreferences)}

Please provide:
1. Top 2-3 professor recommendations with reasoning
2. What to expect from each professor
3. Tips for success with the recommended professors
4. Any red flags to watch out for

Format your response in a clear, structured way.
        `;
    }

    // Build course analysis prompt
    buildCourseAnalysisPrompt(courseData, historicalData) {
        return `
Analyze the difficulty and success patterns for ${courseData.courseCode} - ${courseData.courseName}.

Current semester data:
- Total sections: ${courseData.totalSections}
- Total enrollment: ${courseData.totalEnrollment}
- Average GPA: ${courseData.averageGPA}
- Grade distribution: A: ${courseData.aPercentage}%, B: ${courseData.bPercentage}%, C: ${courseData.cPercentage}%, D/F: ${courseData.dfPercentage}%

Historical trends: ${JSON.stringify(historicalData)}

Please provide:
1. Overall difficulty assessment
2. Success rate analysis
3. Key factors affecting student performance
4. Recommendations for students taking this course
5. How this course compares to similar courses

Format your response in a clear, structured way.
        `;
    }

    // Build comparison prompt
    buildComparisonPrompt(prof1, prof2, prof3) {
        const professors = [prof1, prof2];
        if (prof3) professors.push(prof3);

        const profData = professors.map(prof => `
${prof.name}:
- Average GPA: ${prof.avgGPA}
- Total students: ${prof.totalStudents}
- A grades: ${prof.aPercentage}%
- B grades: ${prof.bPercentage}%
- C grades: ${prof.cPercentage}%
- D/F grades: ${prof.dfPercentage}%
- Teaching style: ${prof.teachingStyle || 'Not specified'}
- Student feedback: ${prof.studentFeedback || 'Not available'}
        `).join('\n');

        return `
Compare these professors for the same course:

${profData}

Please provide:
1. Detailed comparison of teaching effectiveness
2. Grade distribution analysis
3. Student success patterns
4. Specific recommendations for different types of students
5. Overall ranking with reasoning

Format your response in a clear, structured way.
        `;
    }

    // Build study advice prompt
    buildStudyAdvicePrompt(courseCode, courseName, professorData, gradeDistribution) {
        return `
Generate study advice for students taking ${courseCode} - ${courseName} with Professor ${professorData.name}.

Professor data:
- Average GPA: ${professorData.avgGPA}
- Grade distribution: A: ${gradeDistribution.aPercentage}%, B: ${gradeDistribution.bPercentage}%, C: ${gradeDistribution.cPercentage}%, D/F: ${gradeDistribution.dfPercentage}%
- Total students: ${professorData.totalStudents}

Please provide:
1. Specific study strategies for this professor's teaching style
2. Common challenges students face
3. Tips for achieving higher grades
4. Recommended study schedule
5. Resources and support available

Format your response in a clear, actionable way.
        `;
    }

    // Build question prompt
    buildQuestionPrompt(question, context) {
        return `
Question: ${question}

Context: ${JSON.stringify(context)}

Please provide a helpful, accurate answer based on the available information and general academic knowledge. If you don't have enough information, say so and suggest where the student might find more details.
        `;
    }

    // Check if API key is configured
    isConfigured() {
        return !!process.env.OPENAI_API_KEY;
    }

    // Generate response for chat interface
    async generateResponse(prompt) {
        const cacheKey = `chat_${prompt.substring(0, 50)}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant for Queens College students. Provide clear, informative, and friendly responses about professors and courses."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            });

            const answer = response.choices[0].message.content;
            this.cache.set(cacheKey, answer);
            
            return answer;
        } catch (error) {
            console.error('Error generating chat response:', error);
            throw new Error('Failed to generate response');
        }
    }
}

module.exports = ChatGPTService;
