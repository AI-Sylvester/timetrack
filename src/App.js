import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TicketStatus from './Components/TicketStatus';

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Redirect / to /ticket */}
        <Route path="/" element={<Navigate to="/ticket" replace />} />
        {/* ✅ Show search screen */}
        <Route path="/ticket" element={<TicketStatus />} />
        {/* ✅ Optional ID param */}
        <Route path="/ticket/:ticketId" element={<TicketStatus />} />
        {/* Optional: fallback for unknown routes */}
        <Route path="*" element={<div style={{ textAlign: 'center' }}>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
