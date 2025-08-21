const DatabaseService = require('./services/databaseService');

const databaseService = new DatabaseService();

async function testFiltering() {
  try {
    await databaseService.connect();
    
    console.log('🔍 Testing professor filtering...\n');
    
    // Test 1: Search for "Williams, C"
    console.log('Test 1: Searching for "Williams, C"');
    let grades = await databaseService.searchProfessor('Williams, C');
    console.log(`Found ${grades.length} records`);
    if (grades.length > 0) {
      console.log('Professors found:', [...new Set(grades.map(g => g.prof))]);
      console.log('Sample course:', grades[0].course_name);
    }
    console.log('');
    
    // Test 2: Search for "Williams" (should find all Williams)
    console.log('Test 2: Searching for "Williams"');
    grades = await databaseService.searchProfessor('Williams');
    console.log(`Found ${grades.length} records`);
    if (grades.length > 0) {
      console.log('All professors found:', [...new Set(grades.map(g => g.prof))]);
    }
    console.log('');
    
    // Test 3: Test filtering logic
    console.log('Test 3: Testing filtering logic for "Williams, C"');
    const allWilliams = await databaseService.searchProfessor('Williams');
    const filteredGrades = allWilliams.filter(g => {
      const profName = g.prof.toLowerCase();
      const searchName = 'williams, c';
      
      return profName === searchName || 
             profName.includes(searchName) || 
             searchName.includes(profName.split(',')[0]);
    });
    
    console.log(`Filtered results: ${filteredGrades.length} records`);
    if (filteredGrades.length > 0) {
      console.log('Filtered professors:', [...new Set(filteredGrades.map(g => g.prof))]);
    }
    console.log('');
    
    // Test 4: Test for "Chyn"
    console.log('Test 4: Searching for "Chyn"');
    grades = await databaseService.searchProfessor('Chyn');
    console.log(`Found ${grades.length} records`);
    if (grades.length > 0) {
      console.log('Professors found:', [...new Set(grades.map(g => g.prof))]);
      console.log('Sample course:', grades[0].course_name);
    }
    
    await databaseService.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testFiltering();


