import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, BookOpen, User, Target, Zap, Star } from 'lucide-react';

const AIPredictions = () => {
  const [activeTab, setActiveTab] = useState('grade');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Grade Prediction Form
  const [gradeForm, setGradeForm] = useState({
    professorName: '',
    courseSubject: '',
    courseNumber: '',
    studentGPA: ''
  });

  // Course Recommendations Form
  const [courseForm, setCourseForm] = useState({
    studentGPA: '',
    preferredSubjects: [],
    maxDifficulty: '4.0',
    learningStyle: 'balanced'
  });

  // Professor Matching Form
  const [professorForm, setProfessorForm] = useState({
    studentGPA: '',
    courseSubject: '',
    courseNumber: '',
    learningStyle: 'balanced'
  });

  const [learningStyles, setLearningStyles] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchLearningStyles();
    fetchDepartments();
  }, []);

  const fetchLearningStyles = async () => {
    try {
      const response = await fetch('/api/predictions/learning-styles');
      if (response.ok) {
        const data = await response.json();
        setLearningStyles(data.learningStyles);
      }
    } catch (error) {
      console.error('Error fetching learning styles:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/search/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleGradePrediction = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predictions/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gradeForm),
      });

      if (response.ok) {
        const data = await response.json();
        setResults({ type: 'grade', data });
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError('Failed to generate grade prediction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseRecommendations = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predictions/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseForm),
      });

      if (response.ok) {
        const data = await response.json();
        setResults({ type: 'courses', data });
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError('Failed to generate course recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfessorMatching = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predictions/professors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(professorForm),
      });

      if (response.ok) {
        const data = await response.json();
        setResults({ type: 'professors', data });
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError('Failed to match professors');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGradePredictionForm = () => (
    <form onSubmit={handleGradePrediction} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Professor Name
          </label>
          <input
            type="text"
            value={gradeForm.professorName}
            onChange={(e) => setGradeForm(prev => ({ ...prev, professorName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Professor Smith"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Course Subject
          </label>
          <select
            value={gradeForm.courseSubject}
            onChange={(e) => setGradeForm(prev => ({ ...prev, courseSubject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Course Number
          </label>
          <input
            type="text"
            value={gradeForm.courseNumber}
            onChange={(e) => setGradeForm(prev => ({ ...prev, courseNumber: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 212"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your GPA (Optional)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4"
            value={gradeForm.studentGPA}
            onChange={(e) => setGradeForm(prev => ({ ...prev, studentGPA: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 3.5"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Predicting...' : 'Predict Grade'}
      </button>
    </form>
  );

  const renderCourseRecommendationsForm = () => (
    <form onSubmit={handleCourseRecommendations} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your GPA
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4"
            value={courseForm.studentGPA}
            onChange={(e) => setCourseForm(prev => ({ ...prev, studentGPA: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 3.5"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Difficulty
          </label>
          <select
            value={courseForm.maxDifficulty}
            onChange={(e) => setCourseForm(prev => ({ ...prev, maxDifficulty: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="4.0">Any Difficulty</option>
            <option value="3.5">Easy to Moderate</option>
            <option value="3.0">Easy Only</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preferred Departments (Optional)
        </label>
        <select
          multiple
          value={courseForm.preferredSubjects}
          onChange={(e) => setCourseForm(prev => ({ 
            ...prev, 
            preferredSubjects: Array.from(e.target.selectedOptions, option => option.value)
          }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          size="4"
        >
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Hold Ctrl/Cmd to select multiple departments
        </p>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Finding Recommendations...' : 'Get Course Recommendations'}
      </button>
    </form>
  );

  const renderProfessorMatchingForm = () => (
    <form onSubmit={handleProfessorMatching} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your GPA
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4"
            value={professorForm.studentGPA}
            onChange={(e) => setProfessorForm(prev => ({ ...prev, studentGPA: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 3.5"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Learning Style
          </label>
          <select
            value={professorForm.learningStyle}
            onChange={(e) => setProfessorForm(prev => ({ ...prev, learningStyle: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {learningStyles.map(style => (
              <option key={style.id} value={style.id}>{style.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Course Subject
          </label>
          <select
            value={professorForm.courseSubject}
            onChange={(e) => setProfessorForm(prev => ({ ...prev, courseSubject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Course Number
          </label>
          <input
            type="text"
            value={professorForm.courseNumber}
            onChange={(e) => setProfessorForm(prev => ({ ...prev, courseNumber: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 212"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Matching Professors...' : 'Match Professors'}
      </button>
    </form>
  );

  const renderGradePredictionResults = () => {
    if (!results?.data) return null;
    const data = results.data;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Grade Prediction Results
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Predicted Grade</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {data.prediction}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800 dark:text-green-200">Confidence</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {(data.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-800 dark:text-purple-200">Average GPA</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {data.averageGPA?.toFixed(2) || 'N/A'}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Grade Probabilities</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.gradeProbabilities?.map((grade, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{grade.grade}</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {grade.probability.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Analysis</h4>
          <p className="text-gray-700 dark:text-gray-300">{data.reasoning}</p>
        </div>
      </div>
    );
  };

  const renderCourseRecommendationsResults = () => {
    if (!results?.data?.recommendations) return null;
    const recommendations = results.data.recommendations;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Course Recommendations
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Found {recommendations.length} courses matching your criteria
          </p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recommendations.map((course, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {course.subject} {course.nbr} - {course.course_name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Professor: {course.prof}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    course.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    course.difficulty === 'Challenging' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {course.difficulty}
                  </span>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm font-medium">{course.score.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Avg GPA:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{course.avg_gpa}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">A Grades:</span>
                  <span className="ml-2 font-medium text-green-600">{course.a_percentage}%</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Offerings:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{course.offerings}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Enrollment:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{course.total_enrollment}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300">{course.recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProfessorMatchingResults = () => {
    if (!results?.data?.matches) return null;
    const matches = results.data.matches;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Professor Matches
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {results.data.reasoning}
          </p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {matches.map((professor, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {professor.prof}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {professor.course_count} course offerings, {professor.total_students} total students
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-blue-500">
                    <Zap className="h-4 w-4" />
                    <span className="ml-1 text-sm font-medium">{professor.score.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Avg GPA:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{professor.avg_gpa}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">A Grades:</span>
                  <span className="ml-2 font-medium text-green-600">{professor.a_percentage}%</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">B Grades:</span>
                  <span className="ml-2 font-medium text-blue-600">{professor.b_percentage}%</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">C Grades:</span>
                  <span className="ml-2 font-medium text-yellow-600">{professor.c_percentage}%</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300">{professor.matchReasoning}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI-Powered Predictions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get intelligent insights and recommendations based on historical grade data
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {[
            { id: 'grade', label: 'Grade Prediction', icon: Target },
            { id: 'courses', label: 'Course Recommendations', icon: BookOpen },
            { id: 'professors', label: 'Professor Matching', icon: User }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Forms */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        {activeTab === 'grade' && renderGradePredictionForm()}
        {activeTab === 'courses' && renderCourseRecommendationsForm()}
        {activeTab === 'professors' && renderProfessorMatchingForm()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          {results.type === 'grade' && renderGradePredictionResults()}
          {results.type === 'courses' && renderCourseRecommendationsResults()}
          {results.type === 'professors' && renderProfessorMatchingResults()}
        </>
      )}
    </div>
  );
};

export default AIPredictions;
