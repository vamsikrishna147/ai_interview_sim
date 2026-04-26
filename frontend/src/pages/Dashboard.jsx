import React, { useEffect, useState } from 'react';
import { getDashboardMetrics, getCurrentUser } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Target, Zap, Trophy, Loader2, LogIn } from 'lucide-react';

export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [metricsData, userData] = await Promise.all([
                    getDashboardMetrics(),
                    getCurrentUser()
                ]);
                setMetrics(metricsData);
                setUser(userData);
            } catch (err) {
                console.error(err);
                if (err?.response?.status === 401) {
                    setAuthError(true);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-red-500" /></div>
    }

    if (authError) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center text-center space-y-6 animate-fade-in">
                <div className="p-6 bg-slate-800/50 rounded-full border border-slate-700/50">
                    <LogIn className="w-16 h-16 text-slate-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-white">Profile Access Denied</h2>
                    <p className="text-slate-400 max-w-md mx-auto">You need to sign in to access your personalized interview dashboard and review past performance.</p>
                </div>
                <a
                    href="http://localhost:8000/auth/google/login"
                    className="mt-4 px-8 py-4 bg-white hover:bg-gray-100 text-slate-900 font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-3"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
                    Continue with Google
                </a>
            </div>
        )
    }

    if (!metrics || !user) {
        return <div className="text-center mt-20 text-slate-400">Failed to load profile.</div>
    }

    // Mock historical data for charts
    const historyData = [
        { name: 'Session 1', accuracy: 5.5, clarity: 6.0 },
        { name: 'Session 2', accuracy: 6.2, clarity: 6.8 },
        { name: 'Session 3', accuracy: 7.8, clarity: 7.1 },
        { name: 'Latest', accuracy: metrics.average_accuracy || 8.5, clarity: metrics.average_clarity || 8.0 },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 border-b border-red-500/10 pb-8">
                <div className="flex items-center gap-6">
                    {user?.picture ? (
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-red-600 to-amber-500 rounded-full blur-md opacity-50"></div>
                            <img src={user.picture} alt="Profile" className="relative w-24 h-24 rounded-full border-4 border-neutral-900 shadow-xl object-cover" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-slate-800 shadow-xl">
                            {user?.name?.charAt(0) || '?'}
                        </div>
                    )}
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{user?.name || 'Your Profile'}</h1>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-neutral-900/80 rounded-md text-amber-50 text-sm font-medium border border-rose-500/10">{user?.email}</span>
                            <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-sm font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Interviews" value={metrics.total_sessions} icon={<Trophy className="w-6 h-6 text-yellow-500" />} trend="Personal History" />
                <StatCard title="Avg Accuracy" value={metrics.average_accuracy || 'N/A'} suffix="/10" icon={<Target className="w-6 h-6 text-amber-500" />} trend="All sessions" />
                <StatCard title="Avg Clarity" value={metrics.average_clarity || 'N/A'} suffix="/10" icon={<Zap className="w-6 h-6 text-rose-500" />} trend="All sessions" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>

                <div className="bg-neutral-900/50 backdrop-blur-xl border border-red-500/10 p-6 rounded-3xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 text-slate-200">Score Progression</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" domain={[0, 10]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Line type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="clarity" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-neutral-900/50 backdrop-blur-xl border border-red-500/10 p-6 rounded-3xl shadow-xl">
                    <h3 className="text-lg font-semibold mb-6 text-slate-200">Latest Session Skills Breakdown</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { skill: 'Technical', score: metrics.average_accuracy || 8.0 },
                                { skill: 'Communication', score: metrics.average_clarity || 7.5 },
                                { skill: 'Problem Solving', score: (metrics.average_accuracy + metrics.average_clarity) / 2 || 7.8 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="skill" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" domain={[0, 10]} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                                />
                                <Bar dataKey="score" fill="#ef4444" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ title, value, icon, suffix, trend }) {
    return (
        <div className="bg-neutral-900/50 backdrop-blur-xl border-t border-red-500/20 p-6 rounded-3xl flex flex-col justify-between h-40 shadow-xl hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
                <h3 className="text-slate-400 font-medium">{title}</h3>
                <div className="p-2 bg-black/50 rounded-lg">{icon}</div>
            </div>
            <div>
                <div className="text-4xl font-bold flex items-baseline gap-1">
                    {value} {suffix && <span className="text-lg text-slate-500 font-normal">{suffix}</span>}
                </div>
                <div className="text-xs text-slate-500 mt-2 font-medium">{trend}</div>
            </div>
        </div>
    )
}
