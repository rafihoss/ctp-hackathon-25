import React from 'react';
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle } from 'lucide-react';

const GradeStatistics = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-500 text-center">No statistics available</p>
      </div>
    );
  }

  const calculateStatistics = () => {
    const stats = {
      totalStudents: 0,
      totalCourses: data.length,
      averageGPA: 0,
      successRate: 0, // A, B, C grades
      failureRate: 0, // D, F grades
      withdrawalRate: 0,
      totalGPAs: 0,
      totalSuccessStudents: 0,
      totalFailureStudents: 0,
      totalWithdrawalStudents: 0,
    };

    data.forEach(course => {
      const courseStats = {
        total: (course.a_plus || 0) + (course.a || 0) + (course.a_minus || 0) + 
               (course.b_plus || 0) + (course.b || 0) + (course.b_minus || 0) + 
               (course.c_plus || 0) + (course.c || 0) + (course.c_minus || 0) + 
               (course.d || 0) + (course.f || 0) + (course.w || 0),
        success: (course.a_plus || 0) + (course.a || 0) + (course.a_minus || 0) + 
                (course.b_plus || 0) + (course.b || 0) + (course.b_minus || 0) + 
                (course.c_plus || 0) + (course.c || 0) + (course.c_minus || 0),
        failure: (course.d || 0) + (course.f || 0),
        withdrawal: course.w || 0,
      };

      stats.totalStudents += courseStats.total;
      stats.totalSuccessStudents += courseStats.success;
      stats.totalFailureStudents += courseStats.failure;
      stats.totalWithdrawalStudents += courseStats.withdrawal;

      if (course.avg_gpa && course.avg_gpa !== 'N/A') {
        stats.totalGPAs += parseFloat(course.avg_gpa);
      }
    });

    // Calculate percentages and averages
    if (stats.totalStudents > 0) {
      stats.successRate = ((stats.totalSuccessStudents / stats.totalStudents) * 100).toFixed(1);
      stats.failureRate = ((stats.totalFailureStudents / stats.totalStudents) * 100).toFixed(1);
      stats.withdrawalRate = ((stats.totalWithdrawalStudents / stats.totalStudents) * 100).toFixed(1);
    }

    if (stats.totalGPAs > 0) {
      stats.averageGPA = (stats.totalGPAs / data.length).toFixed(2);
    }

    return stats;
  };

  const stats = calculateStatistics();

  const getDifficultyLevel = (gpa) => {
    if (gpa >= 3.5) return { level: 'Easy', color: 'text-green-600', bg: 'bg-green-100' };
    if (gpa >= 3.0) return { level: 'Moderate', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (gpa >= 2.5) return { level: 'Challenging', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Difficult', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const difficulty = getDifficultyLevel(stats.averageGPA);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Statistics Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Students */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        {/* Average GPA */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Average GPA</p>
              <p className="text-2xl font-bold text-green-900">{stats.averageGPA}</p>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-emerald-600">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.successRate}%</p>
            </div>
          </div>
        </div>

        {/* Courses Taught */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Courses</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Level */}
      <div className={`${difficulty.bg} rounded-lg p-4 mb-4`}>
        <div className="flex items-center">
          <TrendingDown className={`h-6 w-6 ${difficulty.color}`} />
          <div className="ml-3">
            <p className={`text-sm font-medium ${difficulty.color}`}>Difficulty Level</p>
            <p className={`text-xl font-bold ${difficulty.color}`}>{difficulty.level}</p>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Passing Grades (A-C)</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.totalSuccessStudents}</p>
          <p className="text-sm text-gray-500">({stats.successRate}%)</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Failing Grades (D-F)</p>
          <p className="text-2xl font-bold text-red-600">{stats.totalFailureStudents}</p>
          <p className="text-sm text-gray-500">({stats.failureRate}%)</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Withdrawals (W)</p>
          <p className="text-2xl font-bold text-gray-600">{stats.totalWithdrawalStudents}</p>
          <p className="text-sm text-gray-500">({stats.withdrawalRate}%)</p>
        </div>
      </div>
    </div>
  );
};

export default GradeStatistics;
