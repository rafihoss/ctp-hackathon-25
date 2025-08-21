class FuzzyMatchService {
  constructor() {
    this.cache = new Map();
  }

  // Calculate Levenshtein distance between two strings
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Calculate similarity score (0-1, where 1 is perfect match)
  calculateSimilarity(str1, str2) {
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  // Find best matches from a list of names
  findBestMatches(query, names, threshold = 0.6, maxResults = 5) {
    const cacheKey = `${query.toLowerCase()}-${names.length}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const matches = names.map(name => ({
      name,
      similarity: this.calculateSimilarity(query, name)
    }))
    .filter(match => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

    this.cache.set(cacheKey, matches);
    return matches;
  }

  // Extract professor names from text with fuzzy matching
  extractProfessorNames(text, allProfessorNames) {
    const words = text.split(/\s+/);
    const potentialNames = [];
    
    // Look for patterns like "Professor X", "Prof. Y", "Dr. Z"
    const titlePatterns = [
      /professor\s+([a-z]+)/i,
      /prof\.\s+([a-z]+)/i,
      /dr\.\s+([a-z]+)/i,
      /([a-z]+)\s+professor/i
    ];

    for (const pattern of titlePatterns) {
      const matches = text.match(new RegExp(pattern, 'gi'));
      if (matches) {
        for (const match of matches) {
          const nameMatch = match.match(pattern);
          if (nameMatch && nameMatch[1]) {
            potentialNames.push(nameMatch[1]);
          }
        }
      }
    }

    // Also check individual words that might be names
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleanWord.length >= 3 && !this.isCommonWord(cleanWord)) {
        potentialNames.push(cleanWord);
      }
    }

    // Find fuzzy matches for each potential name
    const results = [];
    for (const potentialName of potentialNames) {
      const matches = this.findBestMatches(potentialName, allProfessorNames, 0.5, 3);
      results.push(...matches);
    }

    // Remove duplicates and sort by similarity
    const uniqueResults = results
      .filter((result, index, self) => 
        index === self.findIndex(r => r.name === result.name)
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    return uniqueResults;
  }

  // Check if a word is too common to be a name
  isCommonWord(word) {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'can', 'what', 'when', 'where', 'why', 'how', 'who', 'which',
      'that', 'this', 'these', 'those', 'all', 'any', 'some', 'no', 'not',
      'very', 'more', 'most', 'much', 'many', 'few', 'little', 'good', 'bad',
      'new', 'old', 'big', 'small', 'high', 'low', 'first', 'last', 'next',
      'previous', 'current', 'grade', 'distribution', 'professor', 'course',
      'class', 'student', 'teacher', 'instructor', 'lecturer', 'assistant',
      'associate', 'full', 'adjunct', 'visiting', 'emeritus', 'department',
      'college', 'university', 'school', 'faculty', 'staff', 'member'
    ]);
    
    return commonWords.has(word.toLowerCase());
  }

  // Suggest corrections for misspelled names
  suggestCorrections(query, allProfessorNames, maxSuggestions = 3) {
    const matches = this.findBestMatches(query, allProfessorNames, 0.3, maxSuggestions);
    return matches.map(match => ({
      original: query,
      suggestion: match.name,
      confidence: match.similarity
    }));
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = FuzzyMatchService;
