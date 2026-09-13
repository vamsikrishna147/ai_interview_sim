import React, { useState } from 'react';
import { getTrends } from '../api';
import { Loader2, TrendingUp, Briefcase, MessageSquare } from 'lucide-react';

const TrendsDashboard = () => {
    const [role, setRole] = useState('Frontend Developer');
    const [loading, setLoading] = useState(false);
    const [trendsData, setTrendsData] = useState(null);
    const [error, setError] = useState(null);

    const handleFetchTrends = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTrends(role);
            setTrendsData(data);
        } catch (err) {
            setError('Failed to fetch trends. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center bg-gray-900 p-6 border-l-4 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="text-red-500" size={32} />
                        Market Trends Analyzer
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm font-mono">Query real-time industry insights & interview questions.</p>
                </div>
            </div>

            <div className="flex gap-4">
                <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex-1 bg-gray-800 border-2 border-gray-700 p-4 text-white focus:border-red-500 focus:outline-none transition-colors font-mono"
                    placeholder="Enter Job Role (e.g., Data Scientist)"
                />
                <button
                    onClick={handleFetchTrends}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 font-black uppercase tracking-widest border-2 border-transparent hover:border-yellow-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <TrendingUp />}
                    {loading ? 'Analyzing...' : 'Fetch Trends'}
                </button>
            </div>

            {error && (
                <div className="bg-red-900/50 border-l-4 border-red-500 p-4 text-red-200">
                    {error}
                </div>
            )}

            {trendsData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Trends */}
                    <div className="bg-gray-900 border border-gray-800 p-6 space-y-4 hover:border-red-500/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-600/20 transition-all"></div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                            <TrendingUp className="text-yellow-500" /> Key Trends
                        </h2>
                        <ul className="space-y-3 relative z-10">
                            {trendsData.trends.map((item, i) => (
                                <li key={i} className="flex gap-3 text-gray-300">
                                    <span className="text-red-500 font-bold">0{i + 1}</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Opportunities */}
                    <div className="bg-gray-900 border border-gray-800 p-6 space-y-4 hover:border-red-500/50 transition-colors group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all"></div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                            <Briefcase className="text-yellow-500" /> Opportunities
                        </h2>
                        <ul className="space-y-3 relative z-10">
                            {trendsData.opportunities.map((item, i) => (
                                <li key={i} className="flex gap-3 text-gray-300">
                                    <span className="text-red-500 font-bold">0{i + 1}</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Latest Questions */}
                    <div className="bg-gray-900 border border-gray-800 p-6 space-y-4 hover:border-red-500/50 transition-colors group relative overflow-hidden md:col-span-3 lg:col-span-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
                            <MessageSquare className="text-yellow-500" /> Recent Interview Questions
                        </h2>
                        <ul className="space-y-4 relative z-10">
                            {trendsData.latest_questions.map((item, i) => (
                                <li key={i} className="bg-gray-800/50 p-3 border-l-2 border-red-500 text-sm text-gray-300">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrendsDashboard;
