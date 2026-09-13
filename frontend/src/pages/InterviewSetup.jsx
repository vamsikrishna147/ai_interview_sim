import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupInterview } from '../api';
import { Briefcase, Settings2, BarChart3, BookOpen, Loader2 } from 'lucide-react';

export default function InterviewSetup() {
    const [role, setRole] = useState('');
    const [type, setType] = useState('Technical');
    const [difficulty, setDifficulty] = useState('Medium');
    const [topic, setTopic] = useState('');
    const [company, setCompany] = useState('Generic');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSetup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await setupInterview(role, type, difficulty, topic, company);
            const sessionId = response.session_id;
            const firstType = response.questions[0]?.type || 'Speech';
            if (firstType === 'Code') {
                navigate(`/coding/${sessionId}`, { state: { questions: response.questions, startIdx: 0 } });
            } else {
                navigate(`/live/${sessionId}`, { state: { questions: response.questions, startIdx: 0 } });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in relative z-10 py-10 px-4">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 md:p-12 rounded-3xl shadow-2xl">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Configure Interview</h2>
                    <p className="text-slate-400 mt-2 font-medium">Customize your technical simulation</p>
                </div>

                <form onSubmit={handleSetup} className="space-y-8">

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                            <Briefcase className="w-4 h-4 text-red-500" /> Target Role
                        </label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-slate-500 font-medium"
                            placeholder="e.g. Frontend Developer"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                            <BookOpen className="w-4 h-4 text-red-500" /> Topic Focus
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-slate-500 font-medium"
                            placeholder="e.g. React, System Design, Algorithms"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                            <Briefcase className="w-4 h-4 text-red-500" /> Target Company
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {['Generic', 'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Infosys', 'HCL', 'TCS', 'OpenAI', 'Anthropic'].map(c => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setCompany(c)}
                                    className={`py-3 px-4 rounded-none border-2 text-xs font-black uppercase tracking-widest transition-all ${company === c
                                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                                        : 'bg-black border-red-900 text-red-700 hover:border-yellow-500 hover:text-yellow-500'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                            <Settings2 className="w-4 h-4 text-red-500" /> Evaluation Mode
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Technical', 'Behavioral', 'System Design', 'HR Round'].map(t => (
                                <button
                                    type="button"
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${type === t
                                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/25'
                                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-slate-200'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                            <BarChart3 className="w-4 h-4 text-red-500" /> Difficulty Level
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                    type="button"
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${difficulty === d
                                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/25'
                                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-slate-200'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-8 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl py-4 font-bold text-lg transition-all shadow-lg shadow-red-600/25 hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? <span><Loader2 className="w-5 h-5 animate-spin text-white inline-block mr-2" /> Initializing...</span> : 'Start Interview'}
                    </button>
                </form>
            </div>
        </div>
    );
}
