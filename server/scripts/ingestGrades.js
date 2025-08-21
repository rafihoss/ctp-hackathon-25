const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

// Database configuration
const DB_PATH = path.join(__dirname, '../data/grades.db');
const CSV_DIR = path.join(__dirname, '../../data/qc_grades');

// Expected columns (normalized)
const EXPECTED_COLUMNS = [
    'TERM', 'SUBJECT', 'NBR', 'COURSE_NAME', 'SECTION', 'PROF', 'TOTAL',
    'A_PLUS', 'A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'C_MINUS',
    'D', 'F', 'W', 'INC_NA', 'AVG_GPA'
];

// Column mapping from various possible CSV headers to normalized names
const COLUMN_MAPPING = {
    // Term variations
    'TERM': 'TERM',
    'Term': 'TERM',
    'term': 'TERM',
    'SEMESTER': 'TERM',
    'Semester': 'TERM',
    'semester': 'TERM',
    
    // Subject variations
    'SUBJECT': 'SUBJECT',
    'Subject': 'SUBJECT',
    'subject': 'SUBJECT',
    'DEPT': 'SUBJECT',
    'Dept': 'SUBJECT',
    'dept': 'SUBJECT',
    'DEPARTMENT': 'SUBJECT',
    'Department': 'SUBJECT',
    'department': 'SUBJECT',
    
    // Course number variations
    'NBR': 'NBR',
    'Nbr': 'NBR',
    'nbr': 'NBR',
    'COURSE_NBR': 'NBR',
    'Course Nbr': 'NBR',
    'Course Number': 'NBR',
    'COURSE_NUMBER': 'NBR',
    
    // Course name variations
    'COURSE NAME': 'COURSE_NAME',
    'Course Name': 'COURSE_NAME',
    'COURSE_NAME': 'COURSE_NAME',
    'course name': 'COURSE_NAME',
    'TITLE': 'COURSE_NAME',
    'Title': 'COURSE_NAME',
    'title': 'COURSE_NAME',
    
    // Section variations
    'SECTION': 'SECTION',
    'Section': 'SECTION',
    'section': 'SECTION',
    'SEC': 'SECTION',
    'Sec': 'SECTION',
    'sec': 'SECTION',
    
    // Professor variations
    'PROF': 'PROF',
    'Prof': 'PROF',
    'prof': 'PROF',
    'PROFESSOR': 'PROF',
    'Professor': 'PROF',
    'professor': 'PROF',
    'INSTRUCTOR': 'PROF',
    'Instructor': 'PROF',
    'instructor': 'PROF',
    
    // Total variations
    'TOTAL': 'TOTAL',
    'Total': 'TOTAL',
    'total': 'TOTAL',
    'ENROLLMENT': 'TOTAL',
    'Enrollment': 'TOTAL',
    'enrollment': 'TOTAL',
    
    // Grade variations
    'A+': 'A_PLUS',
    'A_PLUS': 'A_PLUS',
    'A Plus': 'A_PLUS',
    'A': 'A',
    'A-': 'A_MINUS',
    'A_MINUS': 'A_MINUS',
    'A Minus': 'A_MINUS',
    'B+': 'B_PLUS',
    'B_PLUS': 'B_PLUS',
    'B Plus': 'B_PLUS',
    'B': 'B',
    'B-': 'B_MINUS',
    'B_MINUS': 'B_MINUS',
    'B Minus': 'B_MINUS',
    'C+': 'C_PLUS',
    'C_PLUS': 'C_PLUS',
    'C Plus': 'C_PLUS',
    'C': 'C',
    'C-': 'C_MINUS',
    'C_MINUS': 'C_MINUS',
    'C Minus': 'C_MINUS',
    'D': 'D',
    'F': 'F',
    'W': 'W',
    'WITHDRAW': 'W',
    'Withdraw': 'W',
    'withdraw': 'W',
    'INC/NA': 'INC_NA',
    'INC_NA': 'INC_NA',
    'INC': 'INC_NA',
    'NA': 'INC_NA',
    'Incomplete': 'INC_NA',
    'incomplete': 'INC_NA',
    
    // GPA variations
    'AVG GPA': 'AVG_GPA',
    'AVG_GPA': 'AVG_GPA',
    'Average GPA': 'AVG_GPA',
    'GPA': 'AVG_GPA',
    'gpa': 'AVG_GPA'
};

// Initialize database
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
                return;
            }
            
            console.log('Connected to SQLite database.');
            
            // Create grades table
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS grades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    term TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    nbr TEXT NOT NULL,
                    course_name TEXT NOT NULL,
                    section TEXT NOT NULL,
                    prof TEXT NOT NULL,
                    total INTEGER DEFAULT 0,
                    a_plus INTEGER DEFAULT 0,
                    a INTEGER DEFAULT 0,
                    a_minus INTEGER DEFAULT 0,
                    b_plus INTEGER DEFAULT 0,
                    b INTEGER DEFAULT 0,
                    b_minus INTEGER DEFAULT 0,
                    c_plus INTEGER DEFAULT 0,
                    c INTEGER DEFAULT 0,
                    c_minus INTEGER DEFAULT 0,
                    d INTEGER DEFAULT 0,
                    f INTEGER DEFAULT 0,
                    w INTEGER DEFAULT 0,
                    inc_na INTEGER DEFAULT 0,
                    avg_gpa REAL DEFAULT 0.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(term, subject, nbr, section, prof)
                )
            `;
            
            db.run(createTableSQL, (err) => {
                if (err) {
                    console.error('Error creating table:', err.message);
                    reject(err);
                    return;
                }
                
                console.log('Grades table created successfully.');
                resolve(db);
            });
        });
    });
}

// Normalize column headers
function normalizeHeaders(headers) {
    return headers.map(header => {
        const normalized = COLUMN_MAPPING[header.trim()];
        if (!normalized) {
            console.warn(`Warning: Unknown column header "${header}" - skipping`);
            return null;
        }
        return normalized;
    });
}

// Parse numeric value, defaulting to 0 if invalid
function parseNumeric(value) {
    if (!value || value === '' || value === 'N/A' || value === 'NA') {
        return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

// Process a single CSV file
function processCSVFile(db, filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        let headers = null;
        let normalizedHeaders = null;
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (headerList) => {
                headers = headerList;
                normalizedHeaders = normalizeHeaders(headers);
                console.log(`Processing ${path.basename(filePath)} with ${headers.length} columns`);
            })
            .on('data', (data) => {
                const row = {};
                
                // Map data to normalized column names
                headers.forEach((header, index) => {
                    const normalizedHeader = normalizedHeaders[index];
                    if (normalizedHeader) {
                        row[normalizedHeader] = data[header];
                    }
                });
                
                // Ensure all expected columns exist with default values
                EXPECTED_COLUMNS.forEach(col => {
                    if (!(col in row)) {
                        row[col] = col.includes('GPA') ? 0.0 : 0;
                    }
                });
                
                results.push(row);
            })
            .on('end', () => {
                console.log(`Parsed ${results.length} rows from ${path.basename(filePath)}`);
                resolve(results);
            })
            .on('error', (error) => {
                console.error(`Error processing ${filePath}:`, error);
                reject(error);
            });
    });
}

// Insert data into database
function insertData(db, data) {
    return new Promise((resolve, reject) => {
        const insertSQL = `
            INSERT OR REPLACE INTO grades (
                term, subject, nbr, course_name, section, prof, total,
                a_plus, a, a_minus, b_plus, b, b_minus, c_plus, c, c_minus,
                d, f, w, inc_na, avg_gpa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const stmt = db.prepare(insertSQL);
        let inserted = 0;
        let errors = 0;
        
        data.forEach(row => {
            const values = [
                row.TERM,
                row.SUBJECT,
                row.NBR,
                row.COURSE_NAME,
                row.SECTION,
                row.PROF,
                parseNumeric(row.TOTAL),
                parseNumeric(row.A_PLUS),
                parseNumeric(row.A),
                parseNumeric(row.A_MINUS),
                parseNumeric(row.B_PLUS),
                parseNumeric(row.B),
                parseNumeric(row.B_MINUS),
                parseNumeric(row.C_PLUS),
                parseNumeric(row.C),
                parseNumeric(row.C_MINUS),
                parseNumeric(row.D),
                parseNumeric(row.F),
                parseNumeric(row.W),
                parseNumeric(row.INC_NA),
                parseNumeric(row.AVG_GPA)
            ];
            
            stmt.run(values, function(err) {
                if (err) {
                    console.error('Error inserting row:', err);
                    errors++;
                } else {
                    inserted++;
                }
            });
        });
        
        stmt.finalize((err) => {
            if (err) {
                console.error('Error finalizing statement:', err);
                reject(err);
            } else {
                console.log(`Inserted ${inserted} rows, ${errors} errors`);
                resolve({ inserted, errors });
            }
        });
    });
}

// Main ingestion function
async function ingestGrades() {
    try {
        // Check if CSV directory exists
        if (!fs.existsSync(CSV_DIR)) {
            console.error(`CSV directory not found: ${CSV_DIR}`);
            console.log('Please create the directory and add CSV files from the Queens College Grade Distribution sheet.');
            return;
        }
        
        // Get all CSV files
        const files = fs.readdirSync(CSV_DIR)
            .filter(file => file.toLowerCase().endsWith('.csv'))
            .map(file => path.join(CSV_DIR, file));
        
        if (files.length === 0) {
            console.log('No CSV files found in the data directory.');
            console.log(`Expected location: ${CSV_DIR}`);
            return;
        }
        
        console.log(`Found ${files.length} CSV files to process:`);
        files.forEach(file => console.log(`  - ${path.basename(file)}`));
        
        // Initialize database
        const db = await initializeDatabase();
        
        // Create data directory for database if it doesn't exist
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        let totalInserted = 0;
        let totalErrors = 0;
        
        // Process each CSV file
        for (const file of files) {
            try {
                console.log(`\nProcessing ${path.basename(file)}...`);
                const data = await processCSVFile(db, file);
                const result = await insertData(db, data);
                totalInserted += result.inserted;
                totalErrors += result.errors;
            } catch (error) {
                console.error(`Failed to process ${path.basename(file)}:`, error);
                totalErrors++;
            }
        }
        
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('\nDatabase connection closed.');
            }
        });
        
        console.log(`\n=== INGESTION COMPLETE ===`);
        console.log(`Total rows inserted: ${totalInserted}`);
        console.log(`Total errors: ${totalErrors}`);
        console.log(`Database location: ${DB_PATH}`);
        
    } catch (error) {
        console.error('Ingestion failed:', error);
        process.exit(1);
    }
}

// Run ingestion if this script is executed directly
if (require.main === module) {
    ingestGrades();
}

module.exports = { ingestGrades, initializeDatabase };
