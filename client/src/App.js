import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatBot from './pages/ChatBot';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<ChatBot />} />
      </Routes>
    </div>
  );
}

export default App;
