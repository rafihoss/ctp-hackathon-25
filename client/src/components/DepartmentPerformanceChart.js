import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DepartmentPerformanceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No department performance data available
      </div>
    );
  }

  const chartData = {
    labels: data.map(dept => dept.department),
    datasets: [
      {
        label: 'Average GPA',
        data: data.map(dept => parseFloat(dept.avg_gpa)),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        label: 'A Grade %',
        data: data.map(dept => parseFloat(dept.avg_a_percentage)),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        yAxisID: 'y1'
      },
      {
        label: 'D/F Grade %',
        data: data.map(dept => parseFloat(dept.avg_df_percentage)),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        yAxisID: 'y1'
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
        text: 'Department Performance Comparison',
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
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Department',
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          maxRotation: 45
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Average GPA',
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          min: 0,
          max: 4
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Grade Percentage',
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div style={{ height: '400px' }}>
          <Bar data={chartData} options={options} />
        </div>
      </div>

      {/* Department Details Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Department Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avg GPA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">A%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">B%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">C%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">D/F%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Professors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Courses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Enrollment</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((dept, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {dept.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {parseFloat(dept.avg_gpa).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {parseFloat(dept.avg_a_percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {parseFloat(dept.avg_b_percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                    {parseFloat(dept.avg_c_percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    {parseFloat(dept.avg_df_percentage).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {dept.professor_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {dept.course_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {dept.total_enrollment.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Performing Department */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">🏆 Top Performing</h4>
          <div className="text-lg font-bold text-green-900 dark:text-green-100">
            {data[0]?.department}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            GPA: {data[0]?.avg_gpa}
          </div>
        </div>

        {/* Most A Grades */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">📈 Most A Grades</h4>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {data.reduce((max, dept) => 
              parseFloat(dept.avg_a_percentage) > parseFloat(max.avg_a_percentage) ? dept : max
            )?.department}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {data.reduce((max, dept) => 
              parseFloat(dept.avg_a_percentage) > parseFloat(max.avg_a_percentage) ? dept : max
            )?.avg_a_percentage}% A grades
          </div>
        </div>

        {/* Largest Department */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">👥 Largest Department</h4>
          <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {data.reduce((max, dept) => 
              dept.total_enrollment > max.total_enrollment ? dept : max
            )?.department}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">
            {data.reduce((max, dept) => 
              dept.total_enrollment > max.total_enrollment ? dept : max
            )?.total_enrollment.toLocaleString()} students
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPerformanceChart;
