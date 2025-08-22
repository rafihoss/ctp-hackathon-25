import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProfessorComparisonChart = ({ professorsData, title = 'Professor Comparison' }) => {
  if (!professorsData || !Array.isArray(professorsData) || professorsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No comparison data available</p>
      </div>
    );
  }

  // Process data for comparison chart
  const processComparisonData = () => {
    const gradeLabels = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'W'];
    const gradeKeys = ['a_plus', 'a', 'a_minus', 'b_plus', 'b', 'b_minus', 'c_plus', 'c', 'c_minus', 'd', 'f', 'w'];
    
    // Calculate average grades for each professor
    const datasets = professorsData.map((professor, index) => {
      const courses = professor.grades || [];
      
      if (courses.length === 0) {
        return {
          label: professor.name,
          data: gradeLabels.map(() => 0),
          backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
          borderColor: `hsl(${index * 60}, 70%, 40%)`,
          borderWidth: 1,
        };
      }

      // Calculate average grades across all courses
      const averageGrades = gradeKeys.map(key => {
        const total = courses.reduce((sum, course) => sum + (course[key] || 0), 0);
        return Math.round(total / courses.length);
      });

      return {
        label: professor.name,
        data: averageGrades,
        backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.8)`,
        borderColor: `hsl(${index * 60}, 70%, 40%)`,
        borderWidth: 1,
      };
    });

    return {
      labels: gradeLabels,
      datasets
    };
  };

  const chartData = processComparisonData();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const professorName = context.dataset.label;
            const grade = context.label;
            const value = context.parsed.y;
            return `${professorName} - ${grade}: ${value} students (avg)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Number of Students'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Grades'
        }
      }
    }
  };

  return (
    <div className="w-full h-80 bg-white rounded-lg shadow-sm border p-4">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ProfessorComparisonChart;
