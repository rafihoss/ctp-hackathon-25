const DatabaseService = require('./services/databaseService');

async function testWaxman() {
  const databaseService = new DatabaseService();
  
  try {
    // Connect to database
    await databaseService.connect();
    console.log('✅ Connected to database');
    
    // Test 1: Search for "waxman"
    console.log('\n🔍 Testing search for "waxman":');
    const waxmanResults = await databaseService.searchProfessor('waxman');
    console.log('Results:', waxmanResults ? waxmanResults.length : 0);
    if (waxmanResults && waxmanResults.length > 0) {
      console.log('First result:', waxmanResults[0]);
    }
    
    // Test 2: Search for "WAXMAN"
    console.log('\n🔍 Testing search for "WAXMAN":');
    const WAXMANResults = await databaseService.searchProfessor('WAXMAN');
    console.log('Results:', WAXMANResults ? WAXMANResults.length : 0);
    if (WAXMANResults && WAXMANResults.length > 0) {
      console.log('First result:', WAXMANResults[0]);
    }
    
    // Test 3: Search for "WAXMAN, J"
    console.log('\n🔍 Testing search for "WAXMAN, J":');
    const waxmanJResults = await databaseService.searchProfessor('WAXMAN, J');
    console.log('Results:', waxmanJResults ? waxmanJResults.length : 0);
    if (waxmanJResults && waxmanJResults.length > 0) {
      console.log('First result:', waxmanJResults[0]);
    }
    
    // Test 4: Get all professors and search for any with "WAXMAN"
    console.log('\n🔍 Searching all professors for "WAXMAN":');
    const allGrades = await databaseService.getAllGrades();
    const waxmanProfessors = allGrades.filter(row => 
      row.PROF && row.PROF.toUpperCase().includes('WAXMAN')
    );
    console.log('Professors with WAXMAN in name:', waxmanProfessors.length);
    if (waxmanProfessors.length > 0) {
      console.log('WAXMAN professors found:', waxmanProfessors.map(p => p.PROF));
      console.log('Sample course:', waxmanProfessors[0]);
    }
    
    // Test 5: Search for any professor with "J" as initial
    console.log('\n🔍 Searching for professors with "J" initial:');
    const jProfessors = allGrades.filter(row => 
      row.PROF && row.PROF.includes(', J')
    );
    console.log('Professors with "J" initial:', jProfessors.length);
    if (jProfessors.length > 0) {
      console.log('First 5 J professors:', jProfessors.slice(0, 5).map(p => p.PROF));
    }
    
    // Close database
    await databaseService.close();
    console.log('\n✅ Waxman test completed');
    
  } catch (error) {
    console.error('❌ Error testing Waxman:', error);
  }
}

testWaxman();
