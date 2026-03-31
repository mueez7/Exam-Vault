import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Archive from './components/Archive';
import Architects from './components/Architects';
import Admin from './components/Admin';
import Saved from './components/Saved';
import Auth from './components/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <AuthProvider>
      <div className="bg-[#030303] text-white min-h-screen selection:bg-white/20 font-grotesk overflow-x-hidden relative flex flex-col">
        {location.pathname !== '/login' && <Navbar />}

        {/* Subtle radial gradient as shown in images */}
        <div className="fixed inset-0 pointer-events-none z-0 flex justify-center items-center">
          <div className="w-[80vw] h-[80vh] bg-accentBlue/5 rounded-full blur-[150px] opacity-20"></div>
        </div>

        <main className={`relative z-40 flex-1 flex flex-col min-h-screen ${location.pathname !== '/' && location.pathname !== '/login' ? 'pt-24' : ''}`}>
          <style>{`
            @keyframes pageEnter {
              from { opacity: 0; transform: translateY(15px); filter: blur(4px); }
              to { opacity: 1; transform: translateY(0); filter: blur(0px); }
            }
            .page-transition {
              animation: pageEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div key={location.pathname} className="page-transition flex-1 flex flex-col">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Auth />} />

            {/* Protected Routes (Must be logged in) */}
            <Route path="/archive" element={
              <ProtectedRoute>
                <Archive />
              </ProtectedRoute>
            } />
            <Route path="/saved" element={
              <ProtectedRoute>
                <Saved />
              </ProtectedRoute>
            } />
            <Route path="/architects" element={
              <ProtectedRoute>
                <Architects />
              </ProtectedRoute>
            } />

            {/* Admin Route (Must be logged in AND be admin email) */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            } />
          </Routes>
          </div>
        </main>

        {location.pathname !== '/login' && <Footer />}
      </div>
    </AuthProvider>
  );
}

export default App;
