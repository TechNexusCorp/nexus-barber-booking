import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <>
      {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
      {currentPage === 'booking' && <BookingPage onNavigate={setCurrentPage} />}
    </>
  );
}

export default App;
