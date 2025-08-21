import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GradeTrendChart = ({ data, professorName }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No trend data available
      </div>
    );
  }

  // Sort data by semester
  const sortedData = [...data].sort((a, b) => {
    const termA = a.term;
    const termB = b.term;
    return termA.localeCompare(termB);
  });

  const chartData = {
    labels: sortedData.map(item => item.term),
    datasets: [
      {
        label: 'Average GPA',
        data: sortedData.map(item => parseFloat(item.avg_gpa)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'A Grade Percentage',
        data: sortedData.map(item => parseFloat(item.a_percentage)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'B Grade Percentage',
        data: sortedData.map(item => parseFloat(item.b_percentage)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'C Grade Percentage',
        data: sortedData.map(item => parseFloat(item.c_percentage)),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(245, 158, 11)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'D/F Grade Percentage',
        data: sortedData.map(item => parseFloat(item.df_percentage)),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        }
      },
      title: {
        display: true,
        text: `${professorName} - Grade Trends Over Time`,
        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
        titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        bodyColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#6b7280' : '#d1d5db',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Semester',
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Percentage / GPA',
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Calculate trend statistics
  const calculateTrends = () => {
    if (sortedData.length < 2) return null;

    const firstSemester = sortedData[0];
    const lastSemester = sortedData[sortedData.length - 1];
    
    const gpaChange = (parseFloat(lastSemester.avg_gpa) - parseFloat(firstSemester.avg_gpa)).toFixed(2);
    const aChange = (parseFloat(lastSemester.a_percentage) - parseFloat(firstSemester.a_percentage)).toFixed(1);
    const dfChange = (parseFloat(lastSemester.df_percentage) - parseFloat(firstSemester.df_percentage)).toFixed(1);

    return {
      gpaChange: parseFloat(gpaChange),
      aChange: parseFloat(aChange),
      dfChange: parseFloat(dfChange),
      trend: gpaChange > 0 ? 'improving' : gpaChange < 0 ? 'declining' : 'stable'
    };
  };

  const trends = calculateTrends();

  return (
    <div className="space-y-4">
      {/* Trend Statistics */}
      {trends && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${
            trends.gpaChange > 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
              : trends.gpaChange < 0 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">GPA Trend</div>
            <div className={`text-2xl font-bold ${
              trends.gpaChange > 0 ? 'text-green-600' : trends.gpaChange < 0 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {trends.gpaChange > 0 ? '+' : ''}{trends.gpaChange}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {trends.trend} trend
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            trends.aChange > 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          }`}>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">A Grade Change</div>
            <div className={`text-2xl font-bold ${
              trends.aChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trends.aChange > 0 ? '+' : ''}{trends.aChange}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {trends.aChange > 0 ? 'More A grades' : 'Fewer A grades'}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            trends.dfChange < 0 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
          }`}>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">D/F Grade Change</div>
            <div className={`text-2xl font-bold ${
              trends.dfChange < 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trends.dfChange > 0 ? '+' : ''}{trends.dfChange}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {trends.dfChange < 0 ? 'Fewer D/F grades' : 'More D/F grades'}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={options} />
        </div>
      </div>

      {/* Semester Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Semester Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avg GPA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">A%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">B%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">C%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">D/F%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Enrollment</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.map((semester, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {semester.term}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {parseFloat(semester.avg_gpa).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {parseFloat(semester.a_percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {parseFloat(semester.b_percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                    {parseFloat(semester.c_percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    {parseFloat(semester.df_percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {semester.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GradeTrendChart;
