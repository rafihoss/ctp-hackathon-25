// Test the improved course extraction function
const extractCourseInfo = (message) => {
  console.log('Extracting course info from:', message);
  
  // Patterns to match course codes like "CSCI 111", "CS 212", etc.
  const coursePatterns = [
    /(?:for|in|about|of)\s+([a-z]{2,4})\s*(\d{3,4})/i,  // "for CSCI 111", "in CS 212"
    /([a-z]{2,4})\s*(\d{3,4})\s+(?:class|course)/i,    // "CSCI 111 class", "CS 212 course"
    /(?:what is|what was|how is)\s+([a-z]{2,4})\s*(\d{3,4})/i,  // "what is CSCI 111"
    /([a-z]{2,4})\s*(\d{3,4})/i,  // Just "CSCI 111" as fallback
    // New patterns for course numbers without subject codes
    /(?:for|in|about|of)\s+(\d{3,4})\s+(?:class|course)/i,  // "for 212 class", "in 111 course"
    /(\d{3,4})\s+(?:class|course)/i,  // "212 class", "111 course"
    /(?:what is|what was|how is)\s+(\d{3,4})\s+(?:class|course)/i  // "what is 212 class"
  ];
  
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

// Test cases
const testCases = [
  "tell me about chyn's 212 class",
  "what is chyn's csci 212 class like",
  "chyn's csci 212",
  "tell me about professor chyn in csci 212",
  "what's the grade distribution for chyn in 212",
  "chyn csci 212 class",
  "chyn's 111 class",
  "what about chyn in 323",
  "what's the grade distribution for chyn in 212 class"
];

console.log('🧪 Testing improved course extraction function:\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: "${testCase}"`);
  const result = extractCourseInfo(testCase);
  console.log(`Result:`, result);
  console.log('---');
});
