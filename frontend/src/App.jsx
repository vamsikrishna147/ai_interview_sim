import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InterviewSetup from './pages/InterviewSetup';
import LiveInterview from './pages/LiveInterview';
import CodingInterview from './pages/CodingInterview';
import Dashboard from './pages/Dashboard';
import ResumeAnalysis from './pages/ResumeAnalysis';
import VideoInterview from './pages/VideoInterview';
import TrendsDashboard from './pages/TrendsDashboard';
import TrendingDSA from './pages/TrendingDSA';
import { BrainCircuit } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-950 text-slate-100 font-sans relative overflow-hidden">
        
        {/* Tech Background Fluff */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 tech-grid opacity-60"></div>
          {/* Blurred glowing blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 rounded-full blur-[120px]"></div>
        </div>

        <nav className="border-b-2 border-black bg-gradient-to-b from-[#1a1f2e] to-[#12151f] sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="text-xl font-bold text-white flex items-center gap-2 group drop-shadow-md">
                <BrainCircuit className="w-6 h-6 text-red-500 group-hover:text-amber-500 transition-colors drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]" />
                <span className="tracking-tight">InterviewAI</span>
              </Link>
              <div className="flex items-center gap-6">
                <Link to="/" className="text-sm font-medium text-slate-300 hover:text-red-400 transition-colors drop-shadow-sm">Home</Link>
                <Link to="/setup" className="text-sm font-medium text-slate-300 hover:text-red-400 transition-colors drop-shadow-sm">Practice</Link>
                <Link to="/resume" className="text-sm font-medium text-slate-300 hover:text-red-400 transition-colors drop-shadow-sm">Resume AI</Link>
                <Link to="/dsa" className="text-sm font-medium text-slate-300 hover:text-red-400 transition-colors drop-shadow-sm">Trending DSA</Link>
                <Link to="/trends" className="text-sm font-medium text-slate-300 hover:text-red-400 transition-colors drop-shadow-sm">Trends</Link>
                <Link to="/dashboard" className="ml-2 px-6 py-2 bg-gradient-to-b from-[#2a1015] to-[#150508] text-red-400 text-sm font-semibold rounded-lg hover:text-red-300 transition-all border-t border-l border-red-500/30 border-b-black/80 border-r-black/80 shadow-[0_3px_5px_rgba(0,0,0,0.6)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] active:translate-y-[1px]">
                    Profile
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-8 relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/setup" element={<InterviewSetup />} />
            <Route path="/live/:sessionId" element={<LiveInterview />} />
            <Route path="/coding/:sessionId" element={<CodingInterview />} />
            <Route path="/resume" element={<ResumeAnalysis />} />
            <Route path="/video/:sessionId" element={<VideoInterview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trends" element={<TrendsDashboard />} />
            <Route path="/dsa" element={<TrendingDSA />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
