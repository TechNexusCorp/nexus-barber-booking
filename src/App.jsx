import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AppointmentsPage from './pages/AppointmentsPage';
import { supabase } from './lib/supabase';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user && currentPage === 'login') {
        setCurrentPage('home');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} user={user} />}
      {currentPage === 'booking' && <BookingPage onNavigate={setCurrentPage} user={user} />}
      {currentPage === 'appointments' && <AppointmentsPage onNavigate={setCurrentPage} user={user} />}
      {currentPage === 'login' && <LoginPage onNavigate={setCurrentPage} />}
    </>
  );
}

export default App;
