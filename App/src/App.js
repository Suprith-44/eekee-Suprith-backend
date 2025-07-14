import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MCQPage from './WelcomePage';
import AdminPage from './Admin';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MCQPage />} />
        <Route path="/admin" element={<AdminPage />} />
        </Routes>
    </Router>
  );
};

export default App;
