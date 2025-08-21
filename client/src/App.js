import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatBot from './pages/ChatBot';
import ProfessorComparisonPage from './pages/ProfessorComparisonPage';
import CourseAnalysisPage from './pages/CourseAnalysisPage';
import SearchPage from './pages/SearchPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import DarkModeToggle from './components/DarkModeToggle';
import useDarkMode from './hooks/useDarkMode';

function App() {
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <DarkModeToggle isDark={isDark} onToggle={toggle} />
      <Routes>
        <Route path="/" element={<ChatBot />} />
        <Route path="/comparison" element={<ProfessorComparisonPage />} />
        <Route path="/courses" element={<CourseAnalysisPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/ai-recommendations" element={<AIRecommendationsPage />} />
      </Routes>
    </div>
  );
}

export default App;
