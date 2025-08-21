import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProfessorComparison from '../components/ProfessorComparison';

const ProfessorComparisonPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Professor Comparison Tool
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Compare multiple professors side by side to make informed decisions about your course selection. 
              Analyze grade distributions, success rates, and teaching performance across different professors.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <ProfessorComparison />
        </div>

        {/* Features Overview */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            What You Can Compare
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Grade Distributions</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Visualize how different professors grade their students across A+ to F grades and withdrawals.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Success Rates</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Compare passing rates, average GPAs, and difficulty levels to understand teaching effectiveness.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Side-by-Side Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Get comprehensive comparisons with interactive charts and detailed statistics for each professor.
              </p>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">💡 Tips for Effective Comparison</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• <strong>Compare similar courses:</strong> Look at professors teaching the same subject for fair comparison</li>
              <li>• <strong>Consider class sizes:</strong> Larger classes may have different grading patterns</li>
              <li>• <strong>Check multiple terms:</strong> Look at data across different semesters for consistency</li>
              <li>• <strong>Focus on success rates:</strong> Higher passing rates often indicate better teaching</li>
              <li>• <strong>Balance grades with reviews:</strong> Combine grade data with Rate My Professor reviews</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorComparisonPage;
