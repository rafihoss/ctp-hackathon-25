const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testDatabaseDirect() {
  const dbPath = path.join(__dirname, 'data/grades.db');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ Connected to database directly');
      
      // Test 1: Count total records
      db.get('SELECT COUNT(*) as count FROM grades', [], (err, row) => {
        if (err) {
          console.error('Error counting records:', err);
        } else {
          console.log(`📊 Total records in database: ${row.count}`);
        }
        
        // Test 2: Search for Williams directly
        db.all('SELECT * FROM grades WHERE prof LIKE ? LIMIT 5', ['%WILLIAMS%'], (err, rows) => {
          if (err) {
            console.error('Error searching for Williams:', err);
          } else {
            console.log(`🔍 Found ${rows.length} records with WILLIAMS in prof field`);
            if (rows.length > 0) {
              console.log('Sample records:');
              rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.prof} - ${row.course_name} (${row.term})`);
              });
            }
          }
          
          // Test 3: Check unique professor names
          db.all('SELECT DISTINCT prof FROM grades WHERE prof LIKE ? ORDER BY prof', ['%WILLIAMS%'], (err, rows) => {
            if (err) {
              console.error('Error getting unique Williams:', err);
            } else {
              console.log(`👥 Unique Williams professors: ${rows.length}`);
              rows.forEach(row => console.log(`- ${row.prof}`));
            }
            
            // Test 4: Check if there are any professors at all
            db.all('SELECT DISTINCT prof FROM grades LIMIT 10', [], (err, rows) => {
              if (err) {
                console.error('Error getting sample professors:', err);
              } else {
                console.log(`📝 Sample professors in database:`);
                rows.forEach(row => console.log(`- ${row.prof}`));
              }
              
              db.close((err) => {
                if (err) {
                  console.error('Error closing database:', err);
                } else {
                  console.log('✅ Database test completed');
                }
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

testDatabaseDirect();
