import React, { useState, useEffect } from 'react';
import { Target, Activity, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '../api';

export default function TrendingDSA() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState("");

    const fetchTrending = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/dsa/trending');
            setQuestions(response.data.questions || []);
            setSource(response.data.source || "Unknown");
        } catch (error) {
            console.error("Failed to fetch trending DSA:", error);
            setSource("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrending();
    }, []);

    return (
        <div className="max-w-6xl mx-auto py-10 px-6 animate-fade-in">
            <div className="flex justify-between items-end mb-8 border-b-2 border-red-600 pb-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(220,38,38,0.8)] flex items-center gap-4">
                        <Activity className="w-10 h-10 text-red-500" />
                        Trending DSA
                    </h1>
                    <p className="text-red-500 font-bold uppercase tracking-wider mt-2">
                        Live Data Source: <span className="text-yellow-500">{source}</span>
                    </p>
                </div>
                <button
                    onClick={fetchTrending}
                    disabled={loading}
                    className="flex items-center gap-2 bg-black border-2 border-red-600 text-red-500 px-4 py-2 uppercase font-black tracking-widest hover:bg-red-600 hover:text-black transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64 flex-col gap-4">
                    <Loader2 className="w-16 h-16 animate-spin text-red-600" />
                    <p className="text-yellow-500 font-black tracking-widest uppercase animate-pulse">Scraping Live Web Data...</p>
                </div>
            ) : questions.length === 0 ? (
                <div className="bg-black border-2 border-red-900 p-10 text-center text-red-500 font-bold uppercase tracking-widest">
                    No trending questions found at this time.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {questions.map((q, idx) => (
                        <a
                            key={idx}
                            href={q.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-black border-2 border-red-900 p-6 hover:border-yellow-500 transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-black text-white group-hover:text-yellow-500 transition-colors">
                                        {q.title}
                                    </h3>
                                    <ExternalLink className="w-5 h-5 text-red-600 group-hover:text-yellow-500" />
                                </div>
                                {q.snippet && (
                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                        {q.snippet}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-red-900/30">
                                <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-950/50 px-2 py-1">
                                    {q.difficulty || "Challenge"}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-widest text-yellow-500 flex items-center gap-1">
                                    <Target className="w-3 h-3" /> {q.frequency || "Trending"}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
