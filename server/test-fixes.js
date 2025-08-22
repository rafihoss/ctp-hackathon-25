const DatabaseService = require('./services/databaseService');
const FuzzyMatchService = require('./services/fuzzyMatchService');

async function testFixes() {
  const databaseService = new DatabaseService();
  const fuzzyMatchService = new FuzzyMatchService();
  
  try {
    await databaseService.connect();
    console.log('✅ Connected to database');
    
    // Test 1: Fuzzy matching for "chyns" -> "CHYN, X"
    console.log('\n🧪 Test 1: Fuzzy matching for "chyns"');
    const professors = await databaseService.getUniqueProfessors();
    console.log(`Loaded ${professors.length} professor names`);
    
    const chynsMatches = fuzzyMatchService.findBestMatches('chyns', professors, 0.6, 3);
    console.log('Fuzzy matches for "chyns":', chynsMatches);
    
    // Test 2: Fuzzy matching for "chyn" (without 's')
    console.log('\n🧪 Test 2: Fuzzy matching for "chyn" (without s)');
    const chynMatches = fuzzyMatchService.findBestMatches('chyn', professors, 0.6, 3);
    console.log('Fuzzy matches for "chyn":', chynMatches);
    
    // Test 3: Check if "CHYN, X" exists in database
    console.log('\n🧪 Test 3: Check if CHYN, X exists');
    const chynData = await databaseService.searchProfessor('CHYN, X');
    console.log(`Found ${chynData ? chynData.length : 0} records for CHYN, X`);
    
    if (chynData && chynData.length > 0) {
      console.log('Sample course:', chynData[0].course_name);
    }
    
    // Test 4: Check CSCI 212 specifically
    console.log('\n🧪 Test 4: Check CSCI 212 courses');
    const csci212Courses = chynData ? chynData.filter(course => 
      course.subject === 'CSCI' && course.nbr === '212'
    ) : [];
    console.log(`Found ${csci212Courses.length} CSCI 212 courses for CHYN, X`);
    
    if (csci212Courses.length > 0) {
      console.log('CSCI 212 course:', csci212Courses[0].course_name, `(${csci212Courses[0].term})`);
    }
    
    // Test 5: Find all professors containing "chyn"
    console.log('\n🧪 Test 5: Find all professors containing "chyn"');
    const chynProfessors = professors.filter(prof => 
      prof.toLowerCase().includes('chyn')
    );
    console.log('Professors containing "chyn":', chynProfessors);
    
    // Test 6: Check first 10 professor names to see format
    console.log('\n🧪 Test 6: Sample professor names');
    professors.slice(0, 10).forEach((prof, i) => {
      console.log(`${i + 1}. ${prof}`);
    });
    
    // Test 7: Test direct string matching logic
    console.log('\n🧪 Test 7: Direct string matching logic');
    const withoutS = 'chyn'; // from "chyns"
    const directMatch = professors.find(prof => 
      prof.toLowerCase().includes(withoutS.toLowerCase()) ||
      withoutS.toLowerCase().includes(prof.toLowerCase().split(',')[0])
    );
    console.log(`Direct match for "${withoutS}":`, directMatch);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await databaseService.close();
    console.log('\n✅ Database connection closed');
  }
}

testFixes();
