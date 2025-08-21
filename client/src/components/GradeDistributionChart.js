import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const GradeDistributionChart = ({ data, chartType = 'bar' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 animate-fade-in-up">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No grade data available</p>
        </div>
      </div>
    );
  }

  // Process data for charts
  const processData = () => {
    const gradeLabels = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'W'];
    const gradeKeys = ['a_plus', 'a', 'a_minus', 'b_plus', 'b', 'b_minus', 'c_plus', 'c', 'c_minus', 'd', 'f', 'w'];
    
    const totalGrades = data.reduce((acc, course) => {
      gradeKeys.forEach(key => {
        acc[key] = (acc[key] || 0) + (parseInt(course[key]) || 0);
      });
      return acc;
    }, {});

    const gradeValues = gradeKeys.map(key => totalGrades[key] || 0);
    const totalStudents = gradeValues.reduce((sum, val) => sum + val, 0);
    const percentages = gradeValues.map(val => ((val / totalStudents) * 100).toFixed(1));

    return {
      labels: gradeLabels,
      values: gradeValues,
      percentages: percentages,
      totalStudents
    };
  };

  const chartData = processData();

  const barChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Number of Students',
        data: chartData.values,
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // A+ - Green
          'rgba(34, 197, 94, 0.6)',   // A - Green
          'rgba(34, 197, 94, 0.4)',   // A- - Green
          'rgba(59, 130, 246, 0.8)',  // B+ - Blue
          'rgba(59, 130, 246, 0.6)',  // B - Blue
          'rgba(59, 130, 246, 0.4)',  // B- - Blue
          'rgba(245, 158, 11, 0.8)',  // C+ - Yellow
          'rgba(245, 158, 11, 0.6)',  // C - Yellow
          'rgba(245, 158, 11, 0.4)',  // C- - Yellow
          'rgba(239, 68, 68, 0.8)',   // D - Red
          'rgba(239, 68, 68, 0.6)',   // F - Red
          'rgba(156, 163, 175, 0.8)', // W - Gray
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const pieChartData = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.percentages,
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(34, 197, 94, 0.4)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(59, 130, 246, 0.4)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(245, 158, 11, 0.4)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          font: {
            size: 12,
            weight: 'bold'
          },
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: `Grade Distribution - ${data.length} course${data.length > 1 ? 's' : ''} (${chartData.totalStudents.toLocaleString()} students)`,
        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        bodyColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed.y || context.parsed;
            const percentage = chartData.percentages[context.dataIndex];
            return `${label}: ${value.toLocaleString()} students (${percentage}%)`;
          }
        }
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.3)',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          font: {
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.3)',
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          font: {
            weight: 'bold'
          }
        }
      }
    } : undefined,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart',
      onProgress: function(animation) {
        const chart = animation.chart;
        const ctx = chart.ctx;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);

        meta.data.forEach((bar, index) => {
          const data = dataset.data[index];
          const model = bar.getCenterPoint();
          
          ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          if (chartType === 'bar') {
            ctx.fillText(data.toLocaleString(), model.x, model.y - 10);
          }
        });
      }
    }
  };

  return (
    <div className="w-full h-full animate-fade-in-up">
      <div className="h-80">
        {chartType === 'bar' ? (
          <Bar data={barChartData} options={options} />
        ) : (
          <Pie data={pieChartData} options={options} />
        )}
      </div>
      
      {/* Enhanced Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up animate-stagger-1">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white text-center">
          <div className="text-2xl font-bold">
            {chartData.values.slice(0, 3).reduce((sum, val) => sum + val, 0).toLocaleString()}
          </div>
          <div className="text-sm opacity-90">A Grades</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center">
          <div className="text-2xl font-bold">
            {chartData.values.slice(3, 6).reduce((sum, val) => sum + val, 0).toLocaleString()}
          </div>
          <div className="text-sm opacity-90">B Grades</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-4 text-white text-center">
          <div className="text-2xl font-bold">
            {chartData.values.slice(6, 9).reduce((sum, val) => sum + val, 0).toLocaleString()}
          </div>
          <div className="text-sm opacity-90">C Grades</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white text-center">
          <div className="text-2xl font-bold">
            {(chartData.values[9] + chartData.values[10] + chartData.values[11]).toLocaleString()}
          </div>
          <div className="text-sm opacity-90">D/F/W</div>
        </div>
      </div>
    </div>
  );
};

export default GradeDistributionChart;
