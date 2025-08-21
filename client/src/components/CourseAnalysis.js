import React, { useState } from 'react';
import { BookOpen, Search, TrendingUp, Users, Award, Filter } from 'lucide-react';
import GradeDistributionChart from './GradeDistributionChart';

const CourseAnalysis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseAnalysis, setCourseAnalysis] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const departments = ['CSCI', 'MATH', 'ENGL', 'HIST', 'PHIL', 'PSYC', 'SOCI', 'ECON'];
  const levels = ['1', '2', '3', '4'];
  const difficulties = ['easy', 'moderate', 'challenging', 'difficult'];

  const handleSearch = async () => {
    if (!searchTerm.trim() && !selectedDepartment && !selectedLevel && !selectedDifficulty) return;
    
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('query', searchTerm);
      if (selectedDepartment) params.append('department', selectedDepartment);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      
      const response = await fetch(`/api/courses/search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.courses);
      } else {
        console.error('Search failed:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course);
    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`/api/courses/${course.id}/analysis`);
      const data = await response.json();
      
      if (data.success) {
        setCourseAnalysis(data);
      } else {
        console.error('Analysis failed:', data.error);
        setCourseAnalysis(null);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setCourseAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedLevel('');
    setSelectedDifficulty('');
    setSearchResults([]);
    setSelectedCourse(null);
    setCourseAnalysis(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
          Course Analysis Tool
        </h2>
        {(searchTerm || selectedDepartment || selectedLevel || selectedDifficulty) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by name, code, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}00 Level</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Search Results ({searchResults.length} courses)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(course => (
              <div
                key={course.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                onClick={() => handleCourseSelect(course)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {course.subject} {course.number}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {course.avgGPA} GPA
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {course.name}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{course.sectionCount} sections</span>
                  <span>{course.totalEnrollment} students</span>
                  <span>{course.professorCount} professors</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Analysis */}
      {selectedCourse && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedCourse.subject} {selectedCourse.number} - {selectedCourse.name}
            </h3>
            {isAnalyzing && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Analyzing...
              </div>
            )}
          </div>

          {courseAnalysis && (
            <div className="space-y-6">
              {/* Course Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Total Students</p>
                      <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        {courseAnalysis.course.totalEnrollment.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Success Rate</p>
                      <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                        {courseAnalysis.course.successRate}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Difficulty</p>
                      <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                        {courseAnalysis.course.difficulty}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="text-sm text-orange-600 dark:text-orange-400">Sections</p>
                      <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                        {courseAnalysis.course.totalSections}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grade Distribution Chart */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Overall Grade Distribution
                </h4>
                <GradeDistributionChart 
                  data={[courseAnalysis.course.gradeDistribution]}
                  type="bar"
                  title={`${selectedCourse.subject} ${selectedCourse.number} - Grade Distribution`}
                />
              </div>

              {/* Professor Performance */}
              {courseAnalysis.professors.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Professor Performance
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courseAnalysis.professors.map((prof, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {prof.name}
                        </h5>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600 dark:text-gray-300">
                            Sections: {prof.sectionsTaught}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            Students: {prof.totalEnrollment}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            GPA: {prof.avgGPA}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {searchResults.length === 0 && !selectedCourse && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium mb-2">Start Analyzing Courses</p>
          <p className="text-sm">
            Search for courses above and click on any course to see detailed analysis, 
            grade distributions, and professor performance.
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseAnalysis;
