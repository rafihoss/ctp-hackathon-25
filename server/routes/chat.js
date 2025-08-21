const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const ChatGPTService = require('../services/chatGPTService');
const DatabaseService = require('../services/databaseService');
const RateMyProfessorService = require('../services/rateMyProfessorService');
const FuzzyMatchService = require('../services/fuzzyMatchService');

const chatGPTService = new ChatGPTService();
const databaseService = new DatabaseService();
const rmpService = new RateMyProfessorService();
const fuzzyMatchService = new FuzzyMatchService();

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

// Extract professor name from user message with fuzzy matching
const extractProfessorFromMessage = async (message) => {
  console.log('Extracting professor name from:', message);
  
  try {
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

    // Get all professor names from database for fuzzy matching
    let allProfessorNames = [];
    try {
      const professors = await databaseService.getUniqueProfessors();
      allProfessorNames = professors || [];
      console.log(`Loaded ${allProfessorNames.length} professor names for fuzzy matching`);
    } catch (error) {
      console.error('Failed to get professor names for fuzzy matching:', error);
      // Continue without fuzzy matching if database fails
    }

    // First, try to find possessive forms (e.g., "chyn's", "waxman's")
    // But exclude common contractions like "what's", "it's", "that's"
    const possessiveMatch = message.match(/([a-z]+(?:\s*[,\s]\s*[a-z])?)'s/i);
    if (possessiveMatch && possessiveMatch[1]) {
      const extracted = possessiveMatch[1].trim();
      const lowerExtracted = extracted.toLowerCase();
      
      // Skip common contractions
      const contractions = ['what', 'it', 'that', 'this', 'there', 'here', 'where', 'when', 'why', 'how'];
      if (contractions.includes(lowerExtracted)) {
        console.log('Skipping contraction:', extracted);
      } else {
        console.log('Extracted professor name from possessive:', extracted);
        
        // Use fuzzy matching to find the best match
        if (allProfessorNames.length > 0) {
          try {
            const fuzzyMatches = fuzzyMatchService.findBestMatches(extracted, allProfessorNames, 0.6, 1);
            if (fuzzyMatches.length > 0) {
              console.log(`Fuzzy match found: "${extracted}" -> "${fuzzyMatches[0].name}" (${fuzzyMatches[0].similarity})`);
              return fuzzyMatches[0].name;
            }
          } catch (error) {
            console.error('Error in fuzzy matching:', error);
          }
        }
        
        return extracted;
      }
    }
    
    // Common patterns for asking about professors
    const patterns = [
      /(?:professor|prof|dr\.?)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)(?:\s|$)/i,
      /(?:grade distribution|grades) for (?:professor|prof|dr\.?)?\s*([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
      /(?:tell me about|what about|how is) (?:professor|prof|dr\.?)?\s*([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
      /(?:in|for|with) (?:professor|prof|dr\.?)?\s*([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
      /(?:like for|distribution like for)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
      // More specific patterns to avoid false matches with "what's"
      /(?:what is|what was)\s+(?:the\s+)?(?:grade distribution|grades)\s+(?:for|of)\s+(?:professor|prof|dr\.?)?\s*([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
      /(?:what is|what was)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:grade distribution|grades)\s+(?:like|for)/i,
      /(?:what is|what was)\s+([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:spring|fall|summer|sp|fa|su)\s*\d+/i,
      /([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:grade distribution|grades)\s+(?:like|for)/i,
      /([a-z]+(?:\s*[,\s]\s*[a-z])?)\s+(?:spring|fall|summer|sp|fa|su)\s*\d+\s+(?:grade distribution|grades)/i,
      // Pattern specifically for "what's the grade distribution for professor X"
      /(?:what's|what is|what was)\s+(?:the\s+)?(?:grade distribution|grades)\s+(?:for|of)\s+(?:professor|prof|dr\.?)?\s*([a-z]+(?:\s*[,\s]\s*[a-z])?)/i,
      // Fallback patterns - more specific to avoid semester code confusion
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
        const invalidWords = [
          'spring', 'fall', 'summer', 'sp', 'fa', 'su',
          'what', 'is', 'was', 'the', 'grade', 'distribution', 'grades',
          'like', 'for', 'give', 'me', 'just', 'numbers', 'number', 'data',
          'show', 'only', 'about', 'how', 'tell', 'can', 'you', 'display',
          'professor', 'prof', 'dr', 'of', 'in', 'with', 'about'
        ];
        
        if (invalidWords.includes(lowerExtracted) || lowerExtracted.length < 2) {
          console.log(`Skipping invalid extraction: ${extracted}`);
          continue;
        }
        
        // Use fuzzy matching to find the best match
        if (allProfessorNames.length > 0) {
          try {
            const fuzzyMatches = fuzzyMatchService.findBestMatches(extracted, allProfessorNames, 0.6, 1);
            if (fuzzyMatches.length > 0) {
              console.log(`Fuzzy match found: "${extracted}" -> "${fuzzyMatches[0].name}" (${fuzzyMatches[0].similarity})`);
              return fuzzyMatches[0].name;
            }
          } catch (error) {
            console.error('Error in fuzzy matching:', error);
          }
        }
        
        return extracted;
      }
    }
    
    // If no pattern matches, try to extract any name-like pattern including comma format
    const nameMatch = message.match(/\b([a-z]+(?:\s*[,\s]\s*[a-z])?)\s*(?:j\.?|jr\.?|sr\.?|iii|iv|v|vi|vii|viii|ix|x)?\b/i);
    if (nameMatch && nameMatch[1]) {
      const extracted = nameMatch[1].trim();
      console.log('Extracted name from fallback:', extracted);
      
      // Use fuzzy matching to find the best match
      if (allProfessorNames.length > 0) {
        try {
          const fuzzyMatches = fuzzyMatchService.findBestMatches(extracted, allProfessorNames, 0.6, 1);
          if (fuzzyMatches.length > 0) {
            console.log(`Fuzzy match found: "${extracted}" -> "${fuzzyMatches[0].name}" (${fuzzyMatches[0].similarity})`);
            return fuzzyMatches[0].name;
          }
        } catch (error) {
          console.error('Error in fuzzy matching:', error);
        }
      }
      
      return extracted;
    }
    
    // Final fallback: if the message is just a single word that looks like a name, treat it as a professor name
    const words = message.trim().split(/\s+/);
    if (words.length === 1 && words[0].length >= 3) {
      const singleWord = words[0].toLowerCase();
      const invalidWords = [
        'what', 'is', 'was', 'the', 'grade', 'distribution', 'grades',
        'like', 'for', 'give', 'me', 'just', 'numbers', 'number', 'data',
        'show', 'only', 'about', 'how', 'tell', 'can', 'you', 'display',
        'professor', 'prof', 'dr', 'of', 'in', 'with', 'about', 'help',
        'search', 'find', 'look', 'get', 'want', 'need', 'please', 'thanks',
        'thank', 'hello', 'hi', 'hey', 'good', 'bad', 'yes', 'no', 'ok',
        'okay', 'sure', 'maybe', 'probably', 'definitely', 'absolutely'
      ];
      
      if (!invalidWords.includes(singleWord)) {
        console.log(`Treating single word "${words[0]}" as professor name`);
        
        // Use fuzzy matching to find the best match
        if (allProfessorNames.length > 0) {
          try {
            const fuzzyMatches = fuzzyMatchService.findBestMatches(words[0], allProfessorNames, 0.5, 1);
            if (fuzzyMatches.length > 0) {
              console.log(`Fuzzy match found: "${words[0]}" -> "${fuzzyMatches[0].name}" (${fuzzyMatches[0].similarity})`);
              return fuzzyMatches[0].name;
            }
          } catch (error) {
            console.error('Error in fuzzy matching:', error);
          }
        }
        
        return words[0];
      }
    }
    
    console.log('No professor name found');
    return null;
  } catch (error) {
    console.error('Error in extractProfessorFromMessage:', error);
    return null;
  }
};

// Search for professor grades with multiple name formats
const searchProfessorGrades = async (professorName) => {
  try {
    console.log(`🔍 Starting search for: "${professorName}"`);
    
    if (!professorName || professorName.trim().length === 0) {
      console.log('❌ No professor name provided');
      return [];
    }
    
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
    
    // If still no results, try case-insensitive search
    if (!grades || grades.length === 0) {
      console.log(`🔄 Trying case-insensitive search for: "${professorName}"`);
      try {
        // Get all professors and do a manual case-insensitive search
        const allProfessors = await databaseService.getUniqueProfessors();
        if (allProfessors && allProfessors.length > 0) {
          const matchingProfessors = allProfessors.filter(prof => 
            prof.toLowerCase().includes(professorName.toLowerCase()) ||
            professorName.toLowerCase().includes(prof.toLowerCase().split(',')[0])
          );
          
          if (matchingProfessors.length > 0) {
            console.log(`🔍 Found ${matchingProfessors.length} matching professors:`, matchingProfessors);
            // Get grades for the first matching professor
            grades = await databaseService.searchProfessor(matchingProfessors[0]);
            console.log(`📊 Case-insensitive search results: ${grades ? grades.length : 0}`);
          }
        }
      } catch (error) {
        console.error('Error in case-insensitive search:', error);
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

// Enhanced RMP scraping using the service
const scrapeRMP = async (url) => {
  try {
    const result = await rmpService.getProfessorData(url);
    return result.data;
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
      reviews: [],
      scrapingStatus: 'error'
    };
  }
};

// Main chat endpoint
router.post('/', checkAPIKey, async (req, res) => {
  try {
    // Initialize database if not already done
    await initDatabase();
    
    const { message, rmpLinks, sessionId } = req.body;
    
    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await req.conversationService.createSession();
    } else {
      await req.conversationService.updateSessionActivity(currentSessionId);
    }
    
    // Check if user provided RMP links or just a message
    if (!rmpLinks || rmpLinks.length === 0) {
      // No RMP links provided, check if message contains professor name
      if (!message || message.trim().length === 0) {
        const response = "Please provide either Rate My Professor links or ask me about a specific professor (e.g., 'What's the grade distribution for Professor Smith?' or 'Tell me about Professor Johnson in CSCI 212')";
        
        // Save the conversation
        await req.conversationService.saveMessage(currentSessionId, message || '', response, {
          professorName: null,
          courseInfo: null,
          rmpLinks: null,
          gradeData: null
        });
        
        return res.json({
          response,
          sessionId: currentSessionId
        });
      }
      
      // Process text-only query (existing logic)
      return await processTextOnlyQuery(message, res, currentSessionId);
    }
    
    // Process RMP links (with optional text query)
    return await processRMPQuery(message, rmpLinks, res, currentSessionId);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      response: "I'm sorry, I encountered an error while processing your request. Please try again."
    });
  }
});

// Process text-only queries (existing functionality)
async function processTextOnlyQuery(message, res, sessionId) {
      
             // Try to extract professor name and course info from message
       const professorName = await extractProfessorFromMessage(message);
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
         
         // Check if we have any data after filtering
         if (filteredGradeData.length === 0) {
           return res.json({
             response: `I couldn't find any grade distribution data for Professor ${targetProfessor}${semesterFilter ? ` in ${semesterFilter}` : ''}${courseInfo ? ` in ${courseInfo.subject} ${courseInfo.number}` : ''}.\n\n💡 Try:\n• Checking the spelling of the professor's name\n• Searching for a different semester\n• Looking for the professor in a different course\n• Using the search page to browse all available data`
           });
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
       
       // Check if OpenAI API is configured
       if (!chatGPTService.isConfigured()) {
         console.log('❌ OpenAI API key not configured');
         return res.json({ 
           response: "I found Professor Waxman's grade distribution data, but I need to configure the AI analysis feature. Here's what I found:\n\n" +
           filteredGradeData.map(course => 
             `📚 ${course.course_name} (${course.term}):\n` +
             `   • Total Students: ${course.total}\n` +
             `   • Average GPA: ${course.avg_gpa || 'N/A'}\n` +
             `   • A Grades: ${(course.a_plus || 0) + (course.a || 0) + (course.a_minus || 0)} students\n` +
             `   • B Grades: ${(course.b_plus || 0) + (course.b || 0) + (course.b_minus || 0)} students\n` +
             `   • C Grades: ${(course.c_plus || 0) + (course.c || 0) + (course.c_minus || 0)} students\n` +
             `   • D/F Grades: ${(course.d || 0) + (course.f || 0)} students\n` +
             `   • Withdrawals: ${course.w || 0} students`
           ).join('\n\n') + 
           "\n\n💡 To get AI-powered analysis, please configure the OPENAI_API_KEY in your environment variables.",
           gradeData: filteredGradeData // Send grade data for charts
         });
       }
       
       try {
         const aiResponse = await chatGPTService.generateResponse(prompt);
         return res.json({ 
           response: aiResponse,
           gradeData: filteredGradeData // Send grade data for charts
         });
       } catch (error) {
         console.error('❌ Error generating AI response:', error);
         console.error('❌ Error details:', {
           message: error.message,
           code: error.code,
           status: error.status,
           response: error.response?.data
         });
         
         // Check if it's an API key issue
         if (error.message.includes('API key') || error.status === 401) {
           return res.json({ 
             response: "I found Professor Waxman's grade distribution data, but there's an issue with the AI API key. Here's what I found:\n\n" +
             filteredGradeData.map(course => 
               `📚 ${course.course_name} (${course.term}):\n` +
               `   • Total Students: ${course.total}\n` +
               `   • Average GPA: ${course.avg_gpa || 'N/A'}\n` +
               `   • A Grades: ${(course.a_plus || 0) + (course.a || 0) + (course.a_minus || 0)} students\n` +
               `   • B Grades: ${(course.b_plus || 0) + (course.b || 0) + (course.b_minus || 0)} students\n` +
               `   • C Grades: ${(course.c_plus || 0) + (course.c || 0) + (course.c_minus || 0)} students\n` +
               `   • D/F Grades: ${(course.d || 0) + (course.f || 0)} students\n` +
               `   • Withdrawals: ${course.w || 0} students`
             ).join('\n\n') + 
             "\n\n💡 Please check your OPENAI_API_KEY configuration.",
             gradeData: filteredGradeData // Send grade data for charts
           });
         }
         
         return res.json({ 
           response: "I found Professor Waxman's grade distribution data, but there was an issue with the AI analysis. Here's what I found:\n\n" +
           filteredGradeData.map(course => 
             `📚 ${course.course_name} (${course.term}):\n` +
             `   • Total Students: ${course.total}\n` +
             `   • Average GPA: ${course.avg_gpa || 'N/A'}\n` +
             `   • A Grades: ${(course.a_plus || 0) + (course.a || 0) + (course.a_minus || 0)} students\n` +
             `   • B Grades: ${(course.b_plus || 0) + (course.b || 0) + (course.b_minus || 0)} students\n` +
             `   • C Grades: ${(course.c_plus || 0) + (course.c || 0) + (course.c_minus || 0)} students\n` +
             `   • D/F Grades: ${(course.d || 0) + (course.f || 0)} students\n` +
             `   • Withdrawals: ${course.w || 0} students`
           ).join('\n\n') + 
           "\n\n💡 The grade data is available, but AI analysis is temporarily unavailable.",
           gradeData: filteredGradeData // Send grade data for charts
         });
       }
}

// Process RMP queries (new enhanced functionality)
async function processRMPQuery(message, rmpLinks, res, sessionId) {
  try {
    // Initialize database if not already done
    await initDatabase();
    
    if (rmpLinks.length > 3) {
      return res.json({
        response: "I can only analyze up to 3 professors at once. Please provide fewer links."
      });
    }
    
    console.log(`🔍 Processing ${rmpLinks.length} RMP links`);
    
    // Scrape RMP data for each link
    const rmpData = [];
    for (const link of rmpLinks) {
      console.log(`📊 Scraping RMP data from: ${link}`);
      const data = await scrapeRMP(link);
      if (data) {
        rmpData.push(data);
        console.log(`✅ Successfully scraped data for: ${data.name}`);
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
      console.log(`📚 Searching grade data for: ${professorName}`);
      const grades = await searchProfessorGrades(professorName);
      
      gradeData.push({
        name: professorName,
        grades: grades
      });
      
      console.log(`📊 Found ${grades.length} grade records for ${professorName}`);
    }
    
    // Check if user also asked a specific question
    const hasSpecificQuestion = message && message.trim().length > 0 && 
                               !message.match(/https?:\/\/www\.ratemyprofessors\.com\/professor\/[^\s]+/g);
    
    // Generate AI response
    let prompt = `
You are a helpful assistant for Queens College students. Analyze the following professor data and provide insights:

RATE MY PROFESSOR DATA:
${rmpData.map(rmp => `
Professor: ${rmp.name}
Overall Rating: ${rmp.overallRating}
Would Take Again: ${rmp.wouldTakeAgain}
Difficulty: ${rmp.difficulty}
Total Ratings: ${rmp.totalRatings}
Scraping Status: ${rmp.scrapingStatus || 'unknown'}
Recent Reviews: ${rmp.reviews.map(r => r.text).join(' | ')}
`).join('\n')}

GRADE DISTRIBUTION DATA:
${gradeData.map(gd => `
Professor: ${gd.name}
Courses Taught: ${gd.grades.length}
Grade Data: ${gd.grades.map(g => `${g.course_name} (${g.term}): A+=${g.a_plus || 0}, A=${g.a || 0}, A-=${g.a_minus || 0}, B+=${g.b_plus || 0}, B=${g.b || 0}, B-=${g.b_minus || 0}, C+=${g.c_plus || 0}, C=${g.c || 0}, C-=${g.c_minus || 0}, D=${g.d || 0}, F=${g.f || 0}, W=${g.w || 0}, Avg GPA=${g.avg_gpa || 'N/A'}`).join('; ')}
`).join('\n')}

${hasSpecificQuestion ? `USER QUESTION: ${message}` : ''}

Please provide a comprehensive analysis including:
1. Overall assessment of each professor
2. Grade distribution patterns and what they indicate
3. Comparison between RMP ratings and actual grade distributions
4. Recommendations for students considering these professors
5. Any red flags or positive indicators
${hasSpecificQuestion ? '6. Address the specific question asked by the user' : ''}

Keep the response conversational and helpful for students making course decisions.
`;

    const aiResponse = await chatGPTService.generateResponse(prompt);
    
    // Prepare grade data for charts (combine all professors' data)
    const allGradeData = gradeData.flatMap(gd => gd.grades || []);
    
    res.json({
      response: aiResponse,
      gradeData: allGradeData
    });
    
  } catch (error) {
    console.error('Error processing RMP query:', error);
    res.status(500).json({
      response: "I'm sorry, I encountered an error while processing your request. Please try again."
    });
  }
}

module.exports = router;
