import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatBot from './pages/ChatBot';
import ProfessorComparisonPage from './pages/ProfessorComparisonPage';
import SearchPage from './pages/SearchPage';
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
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </div>
  );
}

export default App;
