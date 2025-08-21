const DatabaseService = require('./services/databaseService');

async function testDatabase() {
  const databaseService = new DatabaseService();
  
  try {
    // Connect to database
    await databaseService.connect();
    console.log('✅ Connected to database');
    
    // Test 1: Search for "Chyn"
    console.log('\n🔍 Testing search for "Chyn":');
    const chynResults = await databaseService.searchProfessor('Chyn');
    console.log('Results:', chynResults ? chynResults.length : 0);
    if (chynResults && chynResults.length > 0) {
      console.log('First result:', chynResults[0]);
    }
    
    // Test 2: Search for "CHYN, X"
    console.log('\n🔍 Testing search for "CHYN, X":');
    const chynFormattedResults = await databaseService.searchProfessor('CHYN, X');
    console.log('Results:', chynFormattedResults ? chynFormattedResults.length : 0);
    if (chynFormattedResults && chynFormattedResults.length > 0) {
      console.log('First result:', chynFormattedResults[0]);
    }
    
    // Test 3: Get all unique professors to see the format
    console.log('\n🔍 Getting all unique professors (first 10):');
    const allProfessors = await databaseService.getUniqueProfessors();
    console.log('Total professors:', allProfessors.length);
    console.log('First 10 professors:', allProfessors.slice(0, 10));
    
    // Test 4: Search for any professor with "CHYN" in the name
    console.log('\n🔍 Testing search for any professor with "CHYN":');
    const allGrades = await databaseService.getAllGrades();
    const chynProfessors = allGrades.filter(row => 
      row.PROF && row.PROF.toUpperCase().includes('CHYN')
    );
    console.log('Professors with CHYN in name:', chynProfessors.length);
    if (chynProfessors.length > 0) {
      console.log('CHYN professors found:', chynProfessors.map(p => p.PROF));
    }
    
    // Close database
    await databaseService.close();
    console.log('\n✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
  }
}

testDatabase();
