const fs = require('fs');
const path = require('path');
const { ingestGrades } = require('./ingestGrades');

// Sample CSV data for testing
const sampleCSVData = `TERM,SUBJECT,NBR,COURSE NAME,SECTION,PROF,TOTAL,A+,A,A-,B+,B,B-,C+,C,C-,D,F,W,INC/NA,AVG GPA
SP25,CSCI,111,Introduction to Computer Science,01,Dr. Smith,25,5,8,4,3,2,1,1,1,0,0,0,0,0,3.2
SP25,MATH,201,Calculus I,01,Dr. Johnson,30,3,10,5,4,3,2,1,1,0,0,0,0,0,3.1
FA24,CSCI,111,Introduction to Computer Science,01,Dr. Smith,28,4,9,5,3,3,1,1,1,0,0,0,0,0,3.3
FA24,MATH,201,Calculus I,01,Dr. Johnson,32,2,12,6,4,3,2,1,1,0,0,0,0,0,3.0`;

async function testIngestion() {
    console.log('🧪 Testing CSV Ingestion Process');
    console.log('================================\n');

    try {
        // Create test CSV file
        const csvDir = path.join(__dirname, '../../data/qc_grades');
        const testFile = path.join(csvDir, 'TEST_SP25.csv');
        
        // Ensure directory exists
        if (!fs.existsSync(csvDir)) {
            fs.mkdirSync(csvDir, { recursive: true });
        }
        
        // Write test CSV file
        fs.writeFileSync(testFile, sampleCSVData);
        console.log('✅ Created test CSV file: TEST_SP25.csv');
        
        // Run ingestion
        console.log('\n📊 Running ingestion process...');
        await ingestGrades();
        
        console.log('\n✅ Test completed successfully!');
        console.log('📋 Next steps:');
        console.log('   1. Replace TEST_SP25.csv with your actual CSV files');
        console.log('   2. Run "npm run ingest" again to load real data');
        console.log('   3. Start the server with "npm run dev"');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testIngestion();
}

module.exports = { testIngestion };
