const DatabaseService = require('./services/databaseService');

async function listProfessors() {
  const databaseService = new DatabaseService();
  
  try {
    // Connect to database
    await databaseService.connect();
    console.log('✅ Connected to database');
    
    // Get all unique professors
    const allProfessors = await databaseService.getUniqueProfessors();
    console.log(`\n📚 Total professors in database: ${allProfessors.length}`);
    
    // Show first 20 professors
    console.log('\n👥 First 20 professors:');
    allProfessors.slice(0, 20).forEach((prof, index) => {
      console.log(`${index + 1}. ${prof}`);
    });
    
    // Show last 20 professors
    console.log('\n👥 Last 20 professors:');
    allProfessors.slice(-20).forEach((prof, index) => {
      console.log(`${index + 1}. ${prof}`);
    });
    
    // Search for professors with "W" (in case Waxman is spelled differently)
    console.log('\n🔍 Professors starting with "W":');
    const wProfessors = allProfessors.filter(prof => 
      prof.toUpperCase().startsWith('W')
    );
    console.log(`Found ${wProfessors.length} professors starting with "W":`);
    wProfessors.forEach(prof => console.log(`- ${prof}`));
    
    // Close database
    await databaseService.close();
    console.log('\n✅ Professor listing completed');
    
  } catch (error) {
    console.error('❌ Error listing professors:', error);
  }
}

listProfessors();
