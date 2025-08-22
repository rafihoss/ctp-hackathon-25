// Debug script to test extraction functions
const extractCourseInfo = (message) => {
  console.log('Extracting course info from:', message);
  
  // Patterns to match course codes like "CSCI 111", "CS 212", etc.
  const coursePatterns = [
    /(?:for|in|about|of)\s+([a-z]{2,4})\s*(\d{3,4})/i,  // "for CSCI 111", "in CS 212"
    /([a-z]{2,4})\s*(\d{3,4})\s+(?:class|course)/i,    // "CSCI 111 class", "CS 212 course"
    /(?:what is|what was|how is)\s+([a-z]{2,4})\s*(\d{3,4})/i,  // "what is CSCI 111"
    /([a-z]{2,4})\s*(\d{3,4})/i,  // Just "CSCI 111" as fallback
    // New patterns for course numbers without subject codes (more specific to avoid conflicts)
    /(\d{3,4})\s+(?:class|course)/i,  // "212 class", "111 course"
    /(?:what is|what was|how is)\s+(\d{3,4})\s+(?:class|course)/i  // "what is 212 class"
  ];
  
  // First, check if the message contains a possessive form that might be a professor name
  // If so, skip course extraction to avoid conflicts
  const possessiveMatch = message.match(/([a-z]+(?:\s*[,\s]\s*[a-z])?)'s/i);
  if (possessiveMatch && possessiveMatch[1]) {
    const extracted = possessiveMatch[1].trim();
    const lowerExtracted = extracted.toLowerCase();
    
    // Skip common contractions
    const contractions = ['what', 'it', 'that', 'this', 'there', 'here', 'where', 'when', 'why', 'how'];
    if (!contractions.includes(lowerExtracted)) {
      console.log('Found possessive form, skipping course extraction to avoid conflicts');
      return null;
    }
  }
  
  // Also check for words that might be professor names (like "chyns")
  // If we find a word that looks like a professor name, skip course extraction
  const words = message.toLowerCase().split(/\s+/);
  const potentialProfessorNames = ['chyn', 'chyns', 'waxman', 'williams', 'smith', 'johnson'];
  for (const word of words) {
    if (potentialProfessorNames.includes(word)) {
      console.log(`Found potential professor name "${word}", skipping course extraction`);
      return null;
    }
  }
  
  for (let i = 0; i < coursePatterns.length; i++) {
    const pattern = coursePatterns[i];
    const match = message.match(pattern);
    if (match && match[1]) {
      // For patterns with both subject and number
      if (match[2]) {
        const subject = match[1].toUpperCase();
        const number = match[2];
        console.log(`📚 Extracted course: ${subject} ${number}`);
        return { subject, number };
      }
      // For patterns with only number (patterns 4-6)
      else if (i >= 4) {
        const number = match[1];
        console.log(`📚 Extracted course number: ${number} (no subject specified)`);
        return { subject: null, number };
      }
    }
  }
  
  console.log('No course info found');
  return null;
};

// Test the extraction
const testMessage = "tell me about chyns 212 class";
console.log('Testing message:', testMessage);
const result = extractCourseInfo(testMessage);
console.log('Result:', result);
