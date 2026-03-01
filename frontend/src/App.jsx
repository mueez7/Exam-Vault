import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Archive from './components/Archive';
import Architects from './components/Architects';
import Admin from './components/Admin';
import Saved from './components/Saved';

function App() {
  const location = useLocation();

  return (
    <div className="bg-[#030303] text-white min-h-screen selection:bg-white/20 font-grotesk overflow-x-hidden relative flex flex-col">
      <Navbar />

      {/* Subtle radial gradient as shown in images */}
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center items-center">
        <div className="w-[80vw] h-[80vh] bg-accentBlue/5 rounded-full blur-[150px] opacity-20"></div>
      </div>

      <main className={`relative z-10 flex-1 flex flex-col min-h-screen ${location.pathname !== '/' ? 'pt-24' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/architects" element={<Architects />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
