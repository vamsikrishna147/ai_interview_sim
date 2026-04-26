import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupInterview } from '../api';
import { Briefcase, Settings2, BarChart3, Loader2, BookOpen } from 'lucide-react';

export default function InterviewSetup() {
    const [role, setRole] = useState('Software Engineer');
    const [type, setType] = useState('Technical');
    const [difficulty, setDifficulty] = useState('Medium');
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSetup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await setupInterview(role, type, difficulty, topic);
            const sessionId = response.session_id;
            // Pass the generated questions via state
            const firstType = response.questions[0]?.type || 'Speech';
            if (firstType === 'Code') {
                navigate(`/coding/${sessionId}`, { state: { questions: response.questions, startIdx: 0 } });
            } else {
                navigate(`/live/${sessionId}`, { state: { questions: response.questions, startIdx: 0 } });
            }
        } catch (err) {
            console.error(err);
            // Alert removed: API interceptor will handle 401/403 automatically by redirecting to login.
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in relative z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

            <div className="bg-neutral-900/50 backdrop-blur-xl border border-red-500/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">Configure Your Interview</h2>
                    <p className="text-slate-400 mt-2">Customize the parameters to match your target role</p>
                </div>

                <form onSubmit={handleSetup} className="space-y-6">

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Briefcase className="w-4 h-4 text-red-500" /> Target Role
                        </label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-black/40 border border-neutral-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                            placeholder="e.g. Frontend Developer"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <BookOpen className="w-4 h-4 text-rose-500" /> Topic (Optional)
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-black/40 border border-neutral-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-shadow"
                            placeholder="e.g. React Hooks, System Design, Python Decorators"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Settings2 className="w-4 h-4 text-amber-500" /> Interview Type
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Technical', 'Behavioral', 'System Design'].map(t => (
                                <button
                                    type="button"
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${type === t
                                        ? 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                        : 'bg-black/40 border-neutral-700/50 text-slate-400 hover:border-red-500/50 hover:bg-neutral-800'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            <BarChart3 className="w-4 h-4 text-yellow-500" /> Difficulty Level
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                    type="button"
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${difficulty === d
                                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                        : 'bg-black/40 border-neutral-700/50 text-slate-400 hover:border-amber-500/50 hover:bg-neutral-800'
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
                        className="w-full mt-8 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl py-4 font-bold text-lg transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Generating...</> : 'Start Interview Session'}
                    </button>
                </form>
            </div>
        </div>
    );
}
