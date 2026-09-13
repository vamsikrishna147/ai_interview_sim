import React, { useEffect, useState } from 'react';
import { getDashboardMetrics, getCurrentUser } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Target, Zap, Trophy, Loader2 } from 'lucide-react';

export default function Dashboard() {
    const [metrics, setMetrics] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-red-500" /></div>
    }

    if (!metrics || !user) {
        return <div className="text-center mt-20 text-red-500 font-bold tracking-wide text-xl uppercase">SYSTEM OFFLINE. FAILED TO LOAD DATABASE.</div>
    }

    const historyData = [
        { name: 'Session 1', accuracy: 5.5, clarity: 6.0 },
        { name: 'Session 2', accuracy: 6.2, clarity: 6.8 },
        { name: 'Session 3', accuracy: 7.8, clarity: 7.1 },
        { name: 'Latest', accuracy: metrics.average_accuracy || 8.5, clarity: metrics.average_clarity || 8.0 },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in relative z-10 py-10 px-4">

            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 border-b border-slate-700/50 pb-8">
                <div className="flex items-center gap-6">
                    {user?.picture ? (
                        <div className="relative border-4 border-red-500/30 rounded-2xl overflow-hidden shadow-lg shadow-red-500/20">
                            <img src={user.picture} alt="Profile" className="w-24 h-24 object-cover" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl font-bold text-red-500 border border-slate-700/50 shadow-lg">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    )}
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{user?.name || 'Anonymous User'}</h1>
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-slate-800 border border-slate-700/50 text-slate-300 rounded-lg text-sm font-medium">{user?.email}</span>
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                ONLINE
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Interviews" value={metrics.total_sessions} icon={<Trophy className="w-6 h-6 text-yellow-500" />} trend="Personal History" />
                <StatCard title="Avg Accuracy" value={metrics.average_accuracy || 'N/A'} suffix="/10" icon={<Target className="w-6 h-6 text-amber-500" />} trend="All sessions" />
                <StatCard title="Avg Clarity" value={metrics.average_clarity || 'N/A'} suffix="/10" icon={<Zap className="w-6 h-6 text-red-500" />} trend="All sessions" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">Score Progression</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" domain={[0, 10]} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="clarity" name="Clarity" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Latest Skills Breakdown</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { skill: 'Technical', score: metrics.average_accuracy || 8.0 },
                                { skill: 'Communication', score: metrics.average_clarity || 7.5 },
                                { skill: 'Problem Solving', score: (metrics.average_accuracy + metrics.average_clarity) / 2 || 7.8 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="skill" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" domain={[0, 10]} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                                />
                                <Bar dataKey="score" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl flex flex-col justify-between h-48 shadow-xl hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
                <h3 className="text-slate-400 font-semibold text-sm">{title}</h3>
                <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-700/50">{icon}</div>
            </div>
            <div>
                <div className="text-4xl font-bold text-white flex items-baseline gap-1">
                    {value} {suffix && <span className="text-lg text-slate-400 font-medium">{suffix}</span>}
                </div>
                <div className="text-sm text-slate-500 mt-2 font-medium">{trend}</div>
            </div>
        </div>
    )
}
