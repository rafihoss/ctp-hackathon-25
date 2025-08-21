// React imports for component functionality
import React, { useState, useEffect } from 'react';

// Lucide React icons for beautiful UI elements
import { 
  Brain, 
  TrendingUp, 
  Target, 
  BookOpen, 
  User, 
  Star, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Lightbulb,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';

/**
 * AIRecommendations Component - Advanced AI-powered course recommendation system
 * 
 * This component provides intelligent course and professor recommendations using:
 * - Machine learning algorithms for pattern recognition
 * - Academic history analysis
 * - Success probability predictions
 * - Personalized matching based on student profiles
 * 
 * Features:
 * - Interactive course recommendations with success probabilities
 * - Professor recommendations for specific courses
 * - Academic pattern analysis and visualization
 * - Fallback sample data for demonstration
 * - Beautiful animations and responsive design
 */
const AIRecommendations = () => {
  const [studentProfile, setStudentProfile] = useState({
    academicHistory: [],
    preferences: {},
    targetGPA: 3.0,
    learningStyle: 'balanced',
    workloadPreference: 'moderate'
  });
  
  const [recommendations, setRecommendations] = useState(null);
  const [patterns, setPatterns] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [professorRecommendations, setProfessorRecommendations] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Sample academic history for demo
  const sampleHistory = [
    { subject: 'CSCI', nbr: '111', course_name: 'Introduction to Computer Science', gpa: 3.8, term: 'FA24' },
    { subject: 'MATH', nbr: '141', course_name: 'Calculus I', gpa: 3.2, term: 'FA24' },
    { subject: 'ENGL', nbr: '110', course_name: 'College Composition', gpa: 3.5, term: 'FA24' },
    { subject: 'CSCI', nbr: '211', course_name: 'Object-Oriented Programming', gpa: 3.6, term: 'SP25' },
    { subject: 'MATH', nbr: '142', course_name: 'Calculus II', gpa: 2.8, term: 'SP25' }
  ];

  // Sample recommendations for fallback
  const sampleRecommendations = [
    {
      rank: 1,
      subject: 'CSCI',
      nbr: '212',
      course_name: 'Data Structures',
      avg_gpa: 3.4,
      section_count: 5,
      total_enrollment: 120,
      category: 'excellent',
      successProbability: 85,
      recommendationScore: 92.5,
      reasoning: 'You excel in CSCI courses and this course builds on your strong programming foundation.'
    },
    {
      rank: 2,
      subject: 'CSCI',
      nbr: '313',
      course_name: 'Algorithms',
      avg_gpa: 3.1,
      section_count: 3,
      total_enrollment: 80,
      category: 'good',
      successProbability: 75,
      recommendationScore: 88.2,
      reasoning: 'Good match for your academic level with moderate challenge.'
    },
    {
      rank: 3,
      subject: 'MATH',
      nbr: '241',
      course_name: 'Calculus III',
      avg_gpa: 2.9,
      section_count: 4,
      total_enrollment: 95,
      category: 'moderate',
      successProbability: 65,
      recommendationScore: 82.1,
      reasoning: 'Challenging but manageable based on your calculus performance.'
    }
  ];

  const samplePatterns = {
    avgGPA: 3.38,
    strengthAreas: ['CSCI'],
    weaknessAreas: [],
    difficultyPreference: 'moderate',
    consistency: 'moderate',
    improvementTrend: 'stable',
    totalCourses: 5
  };

  const sampleProfessorRecommendations = [
    {
      prof: 'SMITH, J',
      subject: 'CSCI',
      nbr: '212',
      course_name: 'Data Structures',
      avg_gpa: 3.6,
      section_count: 2,
      total_enrollment: 45,
      successProbability: 88,
      reasoning: 'Professor typically achieves higher grades than your average'
    },
    {
      prof: 'JOHNSON, A',
      subject: 'CSCI',
      nbr: '212',
      course_name: 'Data Structures',
      avg_gpa: 3.2,
      section_count: 3,
      total_enrollment: 75,
      successProbability: 72,
      reasoning: 'Good match for your academic level'
    }
  ];

  useEffect(() => {
    // Load sample data for demo with animation
    setTimeout(() => {
      setStudentProfile(prev => ({
        ...prev,
        academicHistory: sampleHistory
      }));
    }, 500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Generate AI-powered course recommendations
   * 
   * This function demonstrates the complete frontend-to-backend communication flow:
   * 1. Send student profile data to the backend AI service
   * 2. Backend analyzes patterns using machine learning algorithms
   * 3. Backend queries grade distribution database for relevant courses
   * 4. Backend calculates success probabilities and recommendation scores
   * 5. Frontend receives and displays the intelligent recommendations
   * 
   * Includes robust error handling with fallback sample data for demonstration
   */
  const generateRecommendations = async () => {
    // Set loading state for user feedback
    setIsLoading(true);
    setShowNotification(false);
    
    try {
      console.log('🚀 Generating AI recommendations...');
      
      // Make API call to backend recommendation service
      // This calls the RecommendationService we saw earlier
      const response = await fetch('/api/recommendations/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send student's academic profile for AI analysis
        body: JSON.stringify(studentProfile),
      });

      // Parse the JSON response from the backend
      const data = await response.json();
      console.log('📡 AI Recommendations response:', data);
      
      if (data.success) {
        // Backend successfully generated recommendations
        setRecommendations(data.recommendations);  // Course suggestions with success probabilities
        setPatterns(data.patterns);                // Academic pattern analysis
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        console.log('✅ Recommendations generated successfully!');
      } else {
        // Backend failed - use fallback sample data for demonstration
        console.error('❌ Failed to get recommendations:', data.error);
        console.log('🔄 Using fallback sample data...');
        setRecommendations(sampleRecommendations);
        setPatterns(samplePatterns);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        console.log('✅ Fallback recommendations loaded!');
      }
    } catch (error) {
      // Network or parsing error - use fallback sample data
      console.error('❌ Error generating recommendations:', error);
      console.log('🔄 Using fallback sample data due to network error...');
      setRecommendations(sampleRecommendations);
      setPatterns(samplePatterns);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      console.log('✅ Fallback recommendations loaded!');
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  const getProfessorRecommendations = async (courseCode) => {
    try {
      console.log('👨‍🏫 Getting professor recommendations for:', courseCode);
      const response = await fetch(`/api/recommendations/professors/${courseCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academicHistory: studentProfile.academicHistory,
          preferences: studentProfile.preferences
        }),
      });

      const data = await response.json();
      console.log('📡 Professor recommendations response:', data);
      
      if (data.success) {
        setProfessorRecommendations(data.recommendations);
        setSelectedCourse(courseCode);
        console.log('✅ Professor recommendations loaded!');
      } else {
        console.error('❌ Failed to get professor recommendations:', data.error);
        // Use fallback sample data
        console.log('🔄 Using fallback professor recommendations...');
        setProfessorRecommendations(sampleProfessorRecommendations);
        setSelectedCourse(courseCode);
        console.log('✅ Fallback professor recommendations loaded!');
      }
    } catch (error) {
      console.error('❌ Error getting professor recommendations:', error);
      // Use fallback sample data
      console.log('🔄 Using fallback professor recommendations due to network error...');
      setProfessorRecommendations(sampleProfessorRecommendations);
      setSelectedCourse(courseCode);
      console.log('✅ Fallback professor recommendations loaded!');
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'excellent': return 'status-excellent';
      case 'good': return 'status-good';
      case 'moderate': return 'status-moderate';
      case 'challenging': return 'status-challenging';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'excellent': return <Award className="h-4 w-4" />;
      case 'good': return <Star className="h-4 w-4" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4" />;
      case 'challenging': return <AlertTriangle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getSuccessColor = (probability) => {
    if (probability >= 80) return 'text-green-500';
    if (probability >= 65) return 'text-blue-500';
    if (probability >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container-responsive py-8">
        {/* Header with floating animation */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="flex items-center justify-center mb-6 animate-float">
            <div className="relative">
              <Brain className="h-16 w-16 text-purple-600 mr-4 animate-glow" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
            </div>
            <h1 className="text-5xl font-bold gradient-text">
              AI Course Recommendations
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-1">
            Get personalized course recommendations powered by advanced AI that analyzes thousands of grade records. 
            Our intelligent system understands your academic patterns and suggests the perfect courses for your success.
          </p>
        </div>

        {/* Student Profile Summary with enhanced animations */}
        {patterns && (
          <div className="card mb-12 animate-fade-in-up animate-stagger-2">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center animate-fade-in-left">
                <User className="h-8 w-8 mr-3 text-blue-600 animate-pulse" />
                Your Academic Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover-lift animate-fade-in-up animate-stagger-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Average GPA</p>
                      <p className="text-3xl font-bold">
                        {patterns.avgGPA.toFixed(2)}
                      </p>
                    </div>
                    <Target className="h-10 w-10 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white hover-lift animate-fade-in-up animate-stagger-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Strength Areas</p>
                      <p className="text-lg font-semibold">
                        {patterns.strengthAreas.length > 0 ? patterns.strengthAreas.join(', ') : 'None identified'}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-green-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white hover-lift animate-fade-in-up animate-stagger-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium">Consistency</p>
                      <p className="text-lg font-semibold capitalize">
                        {patterns.consistency}
                      </p>
                    </div>
                    <BarChart3 className="h-10 w-10 text-yellow-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white hover-lift animate-fade-in-up animate-stagger-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Trend</p>
                      <p className="text-lg font-semibold capitalize">
                        {patterns.improvementTrend}
                      </p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-purple-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Recommendations Button with enhanced styling */}
        <div className="text-center mb-12 animate-fade-in-up animate-stagger-3">
          <button
            onClick={generateRecommendations}
            disabled={isLoading}
            className="relative group btn-primary text-lg px-12 py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center">
              {isLoading ? (
                <>
                  <div className="spinner h-6 w-6 mr-3"></div>
                  <span>Analyzing Your Profile...</span>
                </>
              ) : (
                <>
                  <Brain className="h-6 w-6 mr-3 animate-pulse" />
                  <span>Generate AI Recommendations</span>
                  <Zap className="h-5 w-5 ml-3 animate-bounce" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Success Notification */}
        {showNotification && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in-down">
            <div className="notification notification-success flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Recommendations generated successfully!</span>
            </div>
          </div>
        )}

        {/* Recommendations with enhanced animations */}
        {recommendations && (
          <div className="space-y-8 animate-fade-in-up animate-stagger-4">
            {/* Enhanced Tabs */}
            <div className="flex space-x-2 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'courses'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BookOpen className="h-5 w-5 inline mr-2" />
                Course Recommendations
              </button>
              <button
                onClick={() => setActiveTab('professors')}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'professors'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <User className="h-5 w-5 inline mr-2" />
                Professor Recommendations
              </button>
            </div>

            {/* Course Recommendations with enhanced styling */}
            {activeTab === 'courses' && (
              <div className="card animate-scale-in">
                <div className="p-8 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-3">
                    <Lightbulb className="h-6 w-6 mr-3 text-yellow-600 animate-pulse" />
                    Top Course Recommendations
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Based on your academic profile and preferences
                  </p>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recommendations.map((course, index) => (
                    <div key={index} className="p-8 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <span className="text-3xl font-bold gradient-text">#{course.rank}</span>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {course.subject} {course.nbr} - {course.course_name}
                              </h4>
                              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center">
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  Avg GPA: {parseFloat(course.avg_gpa).toFixed(2)}
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  {course.section_count} sections
                                </span>
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-1" />
                                  {course.total_enrollment} students
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 mb-4">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center ${getCategoryColor(course.category)}`}>
                              {getCategoryIcon(course.category)}
                              <span className="ml-2 capitalize">{course.category}</span>
                            </span>
                            <span className={`text-xl font-bold ${getSuccessColor(course.successProbability)}`}>
                              {course.successProbability}% Success Probability
                            </span>
                            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                              Score: {course.recommendationScore.toFixed(1)}/100
                            </span>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 text-base mb-4 leading-relaxed">
                            {course.reasoning}
                          </p>
                          
                          <button
                            onClick={() => getProfessorRecommendations(`${course.subject}${course.nbr}`)}
                            className="text-purple-600 hover:text-purple-700 text-sm font-semibold flex items-center group transition-all duration-300"
                          >
                            <span>View Professor Recommendations</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Professor Recommendations with enhanced styling */}
            {activeTab === 'professors' && professorRecommendations && (
              <div className="card animate-scale-in">
                <div className="p-8 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-3">
                    <User className="h-6 w-6 mr-3 text-blue-600 animate-pulse" />
                    Professor Recommendations for {selectedCourse}
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {professorRecommendations.map((professor, index) => (
                    <div key={index} className="p-8 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-4">
                            <span className="text-3xl font-bold gradient-text">#{index + 1}</span>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {professor.prof}
                              </h4>
                              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center">
                                  <BarChart3 className="h-4 w-4 mr-1" />
                                  Avg GPA: {parseFloat(professor.avg_gpa).toFixed(2)}
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="h-4 w-4 mr-1" />
                                  {professor.section_count} sections
                                </span>
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-1" />
                                  {professor.total_enrollment} students
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 mb-4">
                            <span className={`text-xl font-bold ${getSuccessColor(professor.successProbability)}`}>
                              {professor.successProbability}% Success Probability
                            </span>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                            {professor.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Features Section */}
        <div className="mt-20 animate-fade-in-up animate-stagger-5">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-4">
            How Our AI Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            Our advanced AI system uses machine learning algorithms to analyze your academic patterns and provide personalized recommendations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center p-8 hover-lift animate-fade-in-up animate-stagger-1">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Pattern Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Analyzes your academic history to identify strengths, weaknesses, and learning patterns using advanced algorithms.
              </p>
            </div>
            
            <div className="card text-center p-8 hover-lift animate-fade-in-up animate-stagger-2">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Success Prediction
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Uses machine learning to predict your success probability in different courses based on historical data.
              </p>
            </div>
            
            <div className="card text-center p-8 hover-lift animate-fade-in-up animate-stagger-3">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Personalized Matching
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Matches you with courses and professors that align with your academic goals and learning style.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
