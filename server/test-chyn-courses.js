const DatabaseService = require('./services/databaseService');

async function testChynCourses() {
  const databaseService = new DatabaseService();
  
  try {
    await databaseService.connect();
    console.log('✅ Connected to database');
    
    // Search for Chyn
    console.log('\n🔍 Searching for Professor Chyn...');
    const chynData = await databaseService.searchProfessor('CHYN, X');
    
    if (chynData && chynData.length > 0) {
      console.log(`📊 Found ${chynData.length} courses for Professor Chyn:`);
      
      // Group by course
      const courses = {};
      chynData.forEach(course => {
        const key = `${course.subject} ${course.nbr}`;
        if (!courses[key]) {
          courses[key] = [];
        }
        courses[key].push(course);
      });
      
      console.log('\n📚 Courses taught by Professor Chyn:');
      Object.keys(courses).forEach(courseKey => {
        const courseList = courses[courseKey];
        console.log(`\n${courseKey}:`);
        courseList.forEach(course => {
          console.log(`  - ${course.course_name} (${course.term})`);
        });
      });
      
      // Test course filtering for CSCI 212
      console.log('\n🔍 Testing course filtering for CSCI 212...');
      const csci212Courses = chynData.filter(course => 
        course.subject && course.subject.toUpperCase() === 'CSCI' &&
        course.nbr && course.nbr.toString() === '212'
      );
      
      console.log(`📊 Found ${csci212Courses.length} CSCI 212 courses:`);
      csci212Courses.forEach(course => {
        console.log(`  - ${course.course_name} (${course.term})`);
      });
      
      // Test course filtering for 212 (just the number)
      console.log('\n🔍 Testing course filtering for course number 212...');
      const course212Courses = chynData.filter(course => 
        course.nbr && course.nbr.toString() === '212'
      );
      
      console.log(`📊 Found ${course212Courses.length} courses with number 212:`);
      course212Courses.forEach(course => {
        console.log(`  - ${course.subject} ${course.nbr}: ${course.course_name} (${course.term})`);
      });
      
    } else {
      console.log('❌ No data found for Professor Chyn');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await databaseService.close();
    console.log('\n✅ Database connection closed');
  }
}

testChynCourses();
