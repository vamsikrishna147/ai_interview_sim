import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InterviewSetup from './pages/InterviewSetup';
import LiveInterview from './pages/LiveInterview';
import CodingInterview from './pages/CodingInterview';
import Dashboard from './pages/Dashboard';
import ResumeAnalysis from './pages/ResumeAnalysis';
import VideoInterview from './pages/VideoInterview';

function App() {
  const [isLogged, setIsLogged] = React.useState(!!localStorage.getItem('auth_token'));

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      setIsLogged(true);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-neutral-950 text-slate-100 font-sans selection:bg-red-500/30">
        <nav className="border-b border-red-500/10 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-red-500 bg-clip-text text-transparent group flex items-center gap-2">
                <span className="text-2xl group-hover:scale-110 transition-transform">⚡</span> Simulator
              </Link>
              <div className="flex items-center gap-6">
                <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Home</Link>
                {isLogged && <Link to="/setup" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Practice</Link>}
                {isLogged && <Link to="/resume" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Resume AI</Link>}
                
                {isLogged ? (
                    <Link to="/dashboard" className="ml-4 px-5 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center gap-2">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        Profile
                    </Link>
                ) : (
                    <a href="http://localhost:8000/auth/google/login" className="ml-4 px-5 py-2 bg-white text-neutral-900 text-sm font-bold rounded-full hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5">
                        <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
                        Login
                    </a>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/setup" element={<InterviewSetup />} />
            <Route path="/live/:sessionId" element={<LiveInterview />} />
            <Route path="/coding/:sessionId" element={<CodingInterview />} />
            <Route path="/resume" element={<ResumeAnalysis />} />
            <Route path="/video/:sessionId" element={<VideoInterview />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
