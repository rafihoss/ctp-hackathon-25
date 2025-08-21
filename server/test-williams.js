const DatabaseService = require('./services/databaseService');

async function testWilliams() {
  const databaseService = new DatabaseService();
  
  try {
    // Connect to database
    await databaseService.connect();
    console.log('✅ Connected to database');
    
    // Test 1: Search for "Williams"
    console.log('\n🔍 Testing search for "Williams":');
    const williamsResults = await databaseService.searchProfessor('Williams');
    console.log('Results:', williamsResults ? williamsResults.length : 0);
    if (williamsResults && williamsResults.length > 0) {
      console.log('First result:', williamsResults[0]);
      console.log('All Williams professors found:', williamsResults.map(r => r.PROF));
    }
    
    // Test 2: Search for "WILLIAMS"
    console.log('\n🔍 Testing search for "WILLIAMS":');
    const WILLIAMSResults = await databaseService.searchProfessor('WILLIAMS');
    console.log('Results:', WILLIAMSResults ? WILLIAMSResults.length : 0);
    if (WILLIAMSResults && WILLIAMSResults.length > 0) {
      console.log('First result:', WILLIAMSResults[0]);
    }
    
    // Test 3: Get all professors and search for any with "WILLIAMS"
    console.log('\n🔍 Searching all professors for "WILLIAMS":');
    const allGrades = await databaseService.getAllGrades();
    const williamsProfessors = allGrades.filter(row => 
      row.PROF && row.PROF.toUpperCase().includes('WILLIAMS')
    );
    console.log('Professors with WILLIAMS in name:', williamsProfessors.length);
    if (williamsProfessors.length > 0) {
      console.log('WILLIAMS professors found:', [...new Set(williamsProfessors.map(p => p.PROF))]);
      console.log('Sample course:', williamsProfessors[0]);
    }
    
    // Close database
    await databaseService.close();
    console.log('\n✅ Williams test completed');
    
  } catch (error) {
    console.error('❌ Error testing Williams:', error);
  }
}

testWilliams();
