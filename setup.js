#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 CUNY RMP Bot Setup Script');
console.log('============================\n');

// Check if Node.js is installed
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js v14 or higher.');
  process.exit(1);
}

// Install server dependencies
console.log('\n📦 Installing server dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Server dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install server dependencies');
  process.exit(1);
}

// Install client dependencies
console.log('\n📦 Installing client dependencies...');
try {
  execSync('cd client && npm install', { stdio: 'inherit' });
  console.log('✅ Client dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install client dependencies');
  process.exit(1);
}

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating .env file from template...');
  try {
    const envExamplePath = path.join(__dirname, 'env.example');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created successfully');
    } else {
      console.log('⚠️  env.example file not found. Please create .env file manually.');
    }
  } catch (error) {
    console.error('❌ Failed to create .env file');
  }
} else {
  console.log('✅ .env file already exists');
}

// Create data directories if they don't exist
const dataDir = path.join(__dirname, 'data');
const qcGradesDir = path.join(dataDir, 'qc_grades');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

if (!fs.existsSync(qcGradesDir)) {
  fs.mkdirSync(qcGradesDir, { recursive: true });
  console.log('✅ Created qc_grades directory');
}

// Check if CSV files exist
const csvFiles = fs.readdirSync(qcGradesDir).filter(file => file.endsWith('.csv'));
if (csvFiles.length === 0) {
  console.log('\n⚠️  No CSV files found in ./data/qc_grades/');
  console.log('   Please add CSV files from the Queens College Grade Distribution Google Sheet');
  console.log('   Expected format: SP25.csv, FA24.csv, etc.');
} else {
  console.log(`✅ Found ${csvFiles.length} CSV file(s) in ./data/qc_grades/`);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('   1. Add CSV files to ./data/qc_grades/ directory');
console.log('   2. Run "npm run ingest" to load data into database');
console.log('   3. Run "npm run dev" to start the development server');
console.log('   4. Run "npm run client" in another terminal to start the frontend');
console.log('\n📖 For detailed instructions, see README.md');
