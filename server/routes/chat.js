const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const ChatGPTService = require('../services/chatGPTService');
const DatabaseService = require('../services/databaseService');

const chatGPTService = new ChatGPTService();
const databaseService = new DatabaseService();

// Simple conversation context (in a real app, this would be per-user session)
let conversationContext = {
  lastProfessor: null,
  lastCourse: null,
  lastSemester: null
};

// Initialize database connection
let dbInitialized = false;
const initDatabase = async () => {
  if (!dbInitialized) {
    try {
      await databaseService.connect();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to connect to database:', error);
    }
  }
};

// Middleware to check if OpenAI API key is configured
const checkAPIKey = (req, res, next) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    return res.status(400).json({ 
      error: 'OpenAI API key not configured',
      message: 'Please set your OPENAI_API_KEY in the environment variables to use the chatbot.'
    });
  }
  next();
};

// Extract professor name from RMP URL
const extractProfessorName = (url) => {
  try {
    const match = url.match(/\/professor\/([^\/]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/-/g, ' '));
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Extract course information from user message
const extractCourseInfo = (message) => {
  console.log('Extracting course info from:', message);
  
  // Patterns to match course codes like "CSCI 111", "CS 212", etc.
  const coursePatterns = [
    /(?:for|in|about|of)\s+([a-z]{2,4})\s*(\d{3,4})/i,  // "for CSCI 111", "in CS 212"
    /([a-z]{2,4})\s*(\d{3,4})\s+(?:class|course)/i,    // "CSCI 111 class", "CS 212 course"
    /(?:what is|what was|how is)\s+([a-z]{2,4})\s*(\d{3,4})/i,  // "what is CSCI 111"
    /([a-z]{2,4})\s*(\d{3,4})/i  // Just "CSCI 111" as fallback
  ];
  
  for (const pattern of coursePatterns) {
    const match = message.match(pattern);
    if (match && match[1] && match[2]) {
      const subject = match[1].toUpperCase();
      const number = match[2];
      console.log(`📚 Extracted course: ${subject} ${number}`);
      return { subject, number };
    }
  }
  
  console.log('No course info found');
  return null;
};

// Extract professor name from user message
const extractProfessorFromMessage = (message) => {
  console.log('Extracting professor name from:', message);
  
  // Check for context-based requests that don't need new professor extraction
  const contextRequests = [
    /^(?:give me|show me|just|only)\s+(?:the\s+)?(?:numbers?|data|distribution|grades?|stats?)/i,
    /^(?:what about|how about|tell me about)\s+(?:the\s+)?(?:numbers?|data|distribution|grades?|stats?)/i,
    /^(?:can you\s+)?(?:show|give|display)\s+(?:me\s+)?(?:just\s+)?(?:the\s+)?(?:numbers?|data|distribution|grades?|stats?)/i,
    /^(?:give|show|just|only)\s+(?:me\s+)?(?:the\s+)?(?:numbers?|data|distribution|grades?|stats?)/i
  ];
  
  for (const pattern of contextRequests) {
    if (pattern.test(message)) {
      console.log('Detected context-based request, no new professor name needed');
      return null; // Return null to indicate this is a context request
    }
  }
  
  // First, try to find possessive forms (e.g., "chyn's", "waxman's")
  const possessiveMatch = message.match(/([a-z]+(?:\s*[,\s]\s*[a-z])?)'s/i);
  if (possessiveMatch && possessiveMatch[1]) {
    const extracted = possessiveMatch[1].trim();
    console.log('Extracted professor name from possessive:', extracted);
    return extracted;
  }
  
  // Common patterns for asking about professors
  const patterns = [
    /(?:professor|prof|dr\.?)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
    /(?:grade distribution|grades) for (?:professor|prof|dr\.?)?\s*([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
    /(?:tell me about|what about|how is) (?:professor|prof|dr\.?)?\s*([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
    /(?:in|for|with) (?:professor|prof|dr\.?)?\s*([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
    /(?:like for|distribution like for)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
    // Fixed patterns for follow-up questions - more specific to avoid false matches
    /(?:what is|what was)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:grade distribution|grades)\s+(?:like|for)/i,
    /(?:what is|what was)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:spring|fall|summer|sp|fa|su)\s*\d+/i,
    /([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:grade distribution|grades)\s+(?:like|for)/i,
    /([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:spring|fall|summer|sp|fa|su)\s*\d+\s+(?:grade distribution|grades)/i,
    // More specific patterns to avoid semester code confusion
    /(?:what is|what was)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:grade distribution|grades)/i,
    /([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:grade distribution|grades)/i
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = message.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      console.log(`Extracted professor name from pattern ${i}:`, extracted);
      
      // Additional validation: make sure we're not extracting semester codes or other words
      const lowerExtracted = extracted.toLowerCase();
      if (lowerExtracted === 'spring' || lowerExtracted === 'fall' || lowerExtracted === 'summer' || 
          lowerExtracted === 'sp' || lowerExtracted === 'fa' || lowerExtracted === 'su' ||
          lowerExtracted === 'what' || lowerExtracted === 'is' || lowerExtracted === 'was' ||
          lowerExtracted === 'grade' || lowerExtracted === 'distribution' || lowerExtracted === 'grades' ||
          lowerExtracted === 'like' || lowerExtracted === 'for' || lowerExtracted === 'give' || 
          lowerExtracted === 'me' || lowerExtracted === 'just' || lowerExtracted === 'the' ||
          lowerExtracted === 'numbers' || lowerExtracted === 'number' || lowerExtracted === 'data' ||
          lowerExtracted === 'show' || lowerExtracted === 'only' || lowerExtracted === 'about' ||
          lowerExtracted === 'how' || lowerExtracted === 'tell' || lowerExtracted === 'can' ||
          lowerExtracted === 'you' || lowerExtracted === 'display') {
        console.log(`Skipping invalid extraction: ${extracted}`);
        continue;
      }
      
      return extracted;
    }
  }
  
  // If no pattern matches, try to extract any name-like pattern including comma format
  const nameMatch = message.match(/\b([a-z]+(?:\s*[,\s]\s*[a-z])?)\s*(?:j\.?|jr\.?|sr\.?|iii|iv|v|vi|vii|viii|ix|x)?\b/i);
  if (nameMatch && nameMatch[1]) {
    const extracted = nameMatch[1].trim();
    console.log('Extracted name from fallback:', extracted);
    return extracted;
  }
  
  console.log('No professor name found');
  return null;
};

// Search for professor grades with multiple name formats
const searchProfessorGrades = async (professorName) => {
  try {
    console.log(`🔍 Starting search for: "${professorName}"`);
    
    // First, try exact match with the full name as provided
    let grades = await databaseService.searchProfessor(professorName);
    console.log(`📊 Exact match results: ${grades ? grades.length : 0}`);
    
    // If no results, try to parse the name more intelligently
    if (!grades || grades.length === 0) {
      // Check if the name contains a comma (like "Williams, C")
      if (professorName.includes(',')) {
        console.log(`🔄 Trying exact comma format: "${professorName}"`);
        grades = await databaseService.searchProfessor(professorName);
        console.log(`📊 Comma format results: ${grades ? grades.length : 0}`);
      }
      
      // If still no results, try with just the last name
      if (!grades || grades.length === 0) {
        const lastName = professorName.split(/[,\s]/)[0]; // Get last name before comma or space
        console.log(`🔄 Trying search with last name: "${lastName}"`);
        grades = await databaseService.searchProfessor(lastName);
        console.log(`📊 Last name search results: ${grades ? grades.length : 0}`);
        
        // If we got results with just last name, filter to only exact matches
        if (grades && grades.length > 0) {
          console.log(`🔍 Filtering results to find exact match for "${professorName}"`);
          const filteredGrades = grades.filter(g => {
            const profName = g.prof.toLowerCase();
            const searchName = professorName.toLowerCase();
            
            // Check for exact match or if the search name is contained in the professor name
            return profName === searchName || 
                   profName.includes(searchName) || 
                   searchName.includes(profName.split(',')[0]);
          });
          
          if (filteredGrades.length > 0) {
            console.log(`✅ Found ${filteredGrades.length} exact matches after filtering`);
            grades = filteredGrades;
          } else {
            console.log(`❌ No exact matches found after filtering`);
            grades = [];
          }
        }
      }
    }
    
    // If still no results, try with first initial + last name format
    if (!grades || grades.length === 0) {
      const nameParts = professorName.split(/[,\s]/);
      if (nameParts.length >= 2) {
        const firstInitial = nameParts[1] ? nameParts[1].charAt(0) : nameParts[0].charAt(0);
        const lastName = nameParts[0];
        const formattedName = `${lastName}, ${firstInitial}`;
        console.log(`🔄 Trying search with formatted name: "${formattedName}"`);
        grades = await databaseService.searchProfessor(formattedName);
        console.log(`📊 Formatted name search results: ${grades ? grades.length : 0}`);
      }
    }
    
    console.log(`✅ Final results for "${professorName}": ${grades ? grades.length : 0} records`);
    if (grades && grades.length > 0) {
      console.log(`📋 Professors found: ${[...new Set(grades.map(g => g.prof))].join(', ')}`);
    }
    return grades || [];
  } catch (error) {
    console.error(`❌ Error searching for professor ${professorName}:`, error);
    return [];
  }
};

// Scrape RMP data
const scrapeRMP = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Try multiple selectors for name
    let name = $('h1').first().text().trim();
    if (!name) {
      name = $('[data-testid="professor-name"]').text().trim();
    }
    if (!name) {
      name = $('.ProfessorName__StyledProfessorName-sc-1y6qp06-0').text().trim();
    }
    
    // Try multiple selectors for ratings
    let overallRating = $('[data-testid="overall-rating"]').text().trim();
    if (!overallRating) {
      overallRating = $('.RatingValue__StyledRating-sc-1y6qp06-0').first().text().trim();
    }
    
    let wouldTakeAgain = $('[data-testid="would-take-again"]').text().trim();
    if (!wouldTakeAgain) {
      wouldTakeAgain = $('.RatingValue__StyledRating-sc-1y6qp06-0').eq(1).text().trim();
    }
    
    let difficulty = $('[data-testid="difficulty"]').text().trim();
    if (!difficulty) {
      difficulty = $('.RatingValue__StyledRating-sc-1y6qp06-0').eq(2).text().trim();
    }
    
    let totalRatings = $('[data-testid="total-ratings"]').text().trim();
    if (!totalRatings) {
      totalRatings = $('.RatingValue__StyledRating-sc-1y6qp06-0').eq(3).text().trim();
    }
    
    // Get recent reviews with more flexible selectors
    const reviews = [];
    $('.Comments__StyledComments-sc-1y6qp06-0, .Review__StyledReview-sc-1y6qp06-0').each((i, element) => {
      if (i < 3) {
        const reviewText = $(element).text().trim();
        if (reviewText && reviewText.length > 10) {
          reviews.push({ text: reviewText, rating: 'N/A' });
        }
      }
    });
    
    // If we couldn't get much data, return basic info
    if (!name) {
      const urlMatch = url.match(/\/professor\/([^\/]+)/);
      if (urlMatch) {
        name = decodeURIComponent(urlMatch[1].replace(/-/g, ' '));
      }
    }
    
    return {
      name: name || 'Unknown Professor',
      overallRating: overallRating || 'N/A',
      wouldTakeAgain: wouldTakeAgain || 'N/A',
      difficulty: difficulty || 'N/A',
      totalRatings: totalRatings || 'N/A',
      reviews: reviews.slice(0, 3)
    };
  } catch (error) {
    console.error('Error scraping RMP:', error);
    // Return basic info from URL if scraping fails
    const urlMatch = url.match(/\/professor\/([^\/]+)/);
    const name = urlMatch ? decodeURIComponent(urlMatch[1].replace(/-/g, ' ')) : 'Unknown Professor';
    
    return {
      name,
      overallRating: 'N/A',
      wouldTakeAgain: 'N/A',
      difficulty: 'N/A',
      totalRatings: 'N/A',
      reviews: []
    };
  }
};

// Main chat endpoint
router.post('/', checkAPIKey, async (req, res) => {
  try {
    // Initialize database if not already done
    await initDatabase();
    
    const { message, rmpLinks } = req.body;
    
    // Check if user provided RMP links or just a message
    if (!rmpLinks || rmpLinks.length === 0) {
      // No RMP links provided, check if message contains professor name
      if (!message || message.trim().length === 0) {
        return res.json({
          response: "Please provide either Rate My Professor links or ask me about a specific professor (e.g., 'What's the grade distribution for Professor Smith?' or 'Tell me about Professor Johnson in CSCI 212')"
        });
      }
      
             // Try to extract professor name and course info from message
       const professorName = extractProfessorFromMessage(message);
       let courseInfo = extractCourseInfo(message);
       
       // Check if this is a context-based request (like "give me just the numbers")
       const isContextRequest = !professorName && (
         /^(?:give me|show me|just|only)\s+(?:the\s+)?(?:numbers?|data|distribution|grades?|stats?)/i.test(message) ||
         /^(?:what about|how about|tell me about)\s+(?:the\s+)?(?:numbers?|data|distribution|grades?|stats?)/i.test(message) ||
         /^(?:can you\s+)?(?:show|give|display)\s+(?:me\s+)?(?:just\s+)?(?:the\s+)?(?:numbers?|data|distribution|grades?|stats?)/i.test(message)
       );
       
       if (!professorName && !isContextRequest) {
         return res.json({
           response: "I couldn't identify a professor name in your message. Please provide Rate My Professor links or ask about a specific professor (e.g., 'What's the grade distribution for Professor Smith?')"
         });
       }
       
       // For context requests, we need to get the last professor from the conversation
       // For now, we'll need to implement a simple conversation context
       // This is a simplified approach - in a real app you'd want proper session management
       let targetProfessor = professorName;
       let isNumbersOnlyRequest = false;
       
               if (isContextRequest) {
          // Use conversation context for follow-up questions
          if (conversationContext.lastProfessor) {
            targetProfessor = conversationContext.lastProfessor;
            console.log(`🔄 Using conversation context: Professor ${targetProfessor}`);
            
            // Also use course context if available
            if (conversationContext.lastCourse) {
              courseInfo = conversationContext.lastCourse;
              console.log(`🔄 Using conversation context: Course ${courseInfo.subject} ${courseInfo.number}`);
            }
          } else {
            // If we can't determine the professor, ask for clarification
            return res.json({
              response: "I'm not sure which professor you're asking about. Could you please specify the professor name?"
            });
          }
          isNumbersOnlyRequest = /numbers?|data|distribution|grades?|stats?/i.test(message);
        }
      
                    // Search for professor in database
       console.log(`🔍 Searching for professor: "${targetProfessor}"`);
       const gradeData = await searchProfessorGrades(targetProfessor);
       console.log(`📊 Found ${gradeData.length} grade records for "${targetProfessor}"`);
       
       // Generate AI response for professor query
       console.log(`📝 Sending to AI: ${gradeData.length} records found for ${targetProfessor}`);
       
       // Debug: Log the actual grade data structure
       if (gradeData.length > 0) {
         console.log(`📊 Sample grade record:`, JSON.stringify(gradeData[0], null, 2));
       }
       
                        // Check if this is a follow-up question about a specific semester
         const semesterMatch = message.match(/(?:spring|fall|summer|sp|fa|su)\s*(\d+)/i);
         let semesterFilter = null;
         
         if (semesterMatch) {
           const fullMatch = semesterMatch[0].toLowerCase();
           const year = semesterMatch[1];
           
           // Convert to database format
           if (fullMatch.includes('spring') || fullMatch.includes('sp')) {
             semesterFilter = `SP${year}`;
           } else if (fullMatch.includes('fall') || fullMatch.includes('fa')) {
             semesterFilter = `FA${year}`;
           } else if (fullMatch.includes('summer') || fullMatch.includes('su')) {
             semesterFilter = `SU${year}`;
           }
           
           console.log(`📅 Detected semester: "${fullMatch}" -> "${semesterFilter}"`);
         }
         
         // Filter data by semester if specified
         let filteredGradeData = gradeData;
         if (semesterFilter) {
           filteredGradeData = gradeData.filter(g => g.term && g.term.toUpperCase().includes(semesterFilter));
           console.log(`📅 Filtering for semester: ${semesterFilter}, found ${filteredGradeData.length} courses`);
         }
         
         // Filter data by specific course if specified
         if (courseInfo) {
           const originalCount = filteredGradeData.length;
           filteredGradeData = filteredGradeData.filter(g => 
             g.subject && g.subject.toUpperCase() === courseInfo.subject &&
             g.nbr && g.nbr.toString() === courseInfo.number
           );
           console.log(`📚 Filtering for course: ${courseInfo.subject} ${courseInfo.number}, found ${filteredGradeData.length} courses (was ${originalCount})`);
         }
         
         // Handle numbers-only request
         if (isNumbersOnlyRequest) {
           if (filteredGradeData.length === 0) {
             return res.json({
               response: `No grade distribution data found for Professor ${targetProfessor}${semesterFilter ? ` in ${semesterFilter}` : ''}.`
             });
           }
           
           // Format the response as just numbers
           const formattedResponse = filteredGradeData.map(course => {
             return `${course.course_name} (${course.term}):\n` +
                    `- A+: ${course.a_plus || 0}\n` +
                    `- A: ${course.a || 0}\n` +
                    `- A-: ${course.a_minus || 0}\n` +
                    `- B+: ${course.b_plus || 0}\n` +
                    `- B: ${course.b || 0}\n` +
                    `- B-: ${course.b_minus || 0}\n` +
                    `- C+: ${course.c_plus || 0}\n` +
                    `- C: ${course.c || 0}\n` +
                    `- C-: ${course.c_minus || 0}\n` +
                    `- D: ${course.d || 0}\n` +
                    `- F: ${course.f || 0}\n` +
                    `- W: ${course.w || 0}\n` +
                    `- Avg GPA: ${course.avg_gpa || 'N/A'}`;
           }).join('\n\n');
           
           return res.json({ response: formattedResponse });
         }
        
                 const prompt = `
You are a helpful assistant for Queens College students. Provide concise, clear analysis.

GRADE DISTRIBUTION DATA:
${filteredGradeData.length > 0 ? `
Professor: ${targetProfessor}
${semesterFilter ? `Semester: ${semesterFilter}` : ''}
${courseInfo ? `Course: ${courseInfo.subject} ${courseInfo.number} (${filteredGradeData[0].course_name})` : ''}
Grade Data: ${filteredGradeData.map(g => `${g.course_name} (${g.term}): A+=${g.a_plus || 0}, A=${g.a || 0}, A-=${g.a_minus || 0}, B+=${g.b_plus || 0}, B=${g.b || 0}, B-=${g.b_minus || 0}, C+=${g.c_plus || 0}, C=${g.c || 0}, C-=${g.c_minus || 0}, D=${g.d || 0}, F=${g.f || 0}, W=${g.w || 0}, Avg GPA=${g.avg_gpa || 'N/A'}`).join('; ')}
` : `
Professor: ${targetProfessor}
${semesterFilter ? `Semester: ${semesterFilter}` : ''}
${courseInfo ? `Course: ${courseInfo.subject} ${courseInfo.number}` : ''}
No grade distribution data found.
`}

INSTRUCTIONS:
- Focus ONLY on Professor ${targetProfessor}${courseInfo ? ` and ${courseInfo.subject} ${courseInfo.number}` : ''}
- Keep response concise and to the point
- Analyze grade patterns, difficulty level, and teaching style
- Provide practical insights for students
${courseInfo ? `- Do NOT mention other courses` : ''}

${filteredGradeData.length > 0 ? `
Provide a brief analysis of the grade distribution patterns and what they indicate about course difficulty and Professor ${targetProfessor}'s teaching style.
` : `
Explain that no data was found and suggest alternative ways to get information about Professor ${targetProfessor}.
`}
`;
      
             // Update conversation context
       conversationContext.lastProfessor = targetProfessor;
       conversationContext.lastCourse = courseInfo;
       conversationContext.lastSemester = semesterFilter;
       
       // Clear cache to ensure fresh response
       chatGPTService.cache.flushAll();
       const aiResponse = await chatGPTService.generateResponse(prompt);
       return res.json({ response: aiResponse });
    }
    
    if (rmpLinks.length > 3) {
      return res.json({
        response: "I can only analyze up to 3 professors at once. Please provide fewer links."
      });
    }
    
    // Scrape RMP data for each link
    const rmpData = [];
    for (const link of rmpLinks) {
      const data = await scrapeRMP(link);
      if (data) {
        rmpData.push(data);
      }
    }
    
    if (rmpData.length === 0) {
      return res.json({
        response: "I couldn't extract data from the provided Rate My Professor links. Please make sure the links are valid and accessible."
      });
    }
    
    // Get grade distribution data for each professor
    const gradeData = [];
    for (const rmp of rmpData) {
      const professorName = rmp.name;
      const grades = await searchProfessorGrades(professorName);
      
      gradeData.push({
        name: professorName,
        grades: grades
      });
    }
    
    // Generate AI response
    const prompt = `
You are a helpful assistant for Queens College students. Analyze the following professor data and provide insights:

RATE MY PROFESSOR DATA:
${rmpData.map(rmp => `
Professor: ${rmp.name}
Overall Rating: ${rmp.overallRating}
Would Take Again: ${rmp.wouldTakeAgain}
Difficulty: ${rmp.difficulty}
Total Ratings: ${rmp.totalRatings}
Recent Reviews: ${rmp.reviews.map(r => r.text).join(' | ')}
`).join('\n')}

GRADE DISTRIBUTION DATA:
${gradeData.map(gd => `
Professor: ${gd.name}
Courses Taught: ${gd.grades.length}
Grade Data: ${gd.grades.map(g => `${g.COURSE_NAME} (${g.TERM}): A+=${g['A+']}, A=${g.A}, A-=${g['A-']}, B+=${g['B+']}, B=${g.B}, B-=${g['B-']}, C+=${g['C+']}, C=${g.C}, C-=${g['C-']}, D=${g.D}, F=${g.F}, W=${g.W}, Avg GPA=${g['AVG GPA']}`).join('; ')}
`).join('\n')}

Please provide a comprehensive analysis including:
1. Overall assessment of each professor
2. Grade distribution patterns and what they indicate
3. Comparison between RMP ratings and actual grade distributions
4. Recommendations for students considering these professors
5. Any red flags or positive indicators

Keep the response conversational and helpful for students making course decisions.
`;

    const aiResponse = await chatGPTService.generateResponse(prompt);
    
    res.json({
      response: aiResponse
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      response: "I'm sorry, I encountered an error while processing your request. Please try again."
    });
  }
});

module.exports = router;
