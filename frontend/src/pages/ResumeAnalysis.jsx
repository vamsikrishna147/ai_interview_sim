import React, { useState } from 'react';
import { analyzeResume } from '../api';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

export default function ResumeAnalysis() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setError('');
        } else {
            setError('Please upload a valid PDF file.');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        try {
            const data = await analyzeResume(file);
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to analyze resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative px-4">
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] -z-10"></div>

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                    <FileText className="text-purple-400 w-8 h-8" /> Resume ATS Analyzer
                </h1>
                <p className="text-slate-400 mt-3 max-w-2xl mx-auto">Upload your resume to get instant feedback on your ATS score, key insights, and actionable improvements.</p>
            </div>

            {!result && (
                <div className="glass-panel border-dashed border-2 border-slate-600 rounded-3xl p-12 text-center transition-all hover:border-purple-500/50 hover:bg-slate-800/80 group">
                    <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-4">
                        <div className="p-6 bg-slate-900 rounded-full group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors shadow-inner">
                            <UploadCloud className="w-12 h-12" />
                        </div>
                        <div>
                            <span className="text-lg font-bold text-white block">Click to upload PDF</span>
                            <span className="text-slate-500 mt-1 block">Maximum file size: 5MB</span>
                        </div>
                    </label>

                    {file && (
                        <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between text-left">
                            <div className="flex items-center gap-3">
                                <FileText className="text-purple-400 w-6 h-6" />
                                <div>
                                    <div className="text-white font-medium">{file.name}</div>
                                    <div className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                </div>
                            </div>
                            <button
                                onClick={handleUpload}
                                disabled={loading}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : 'Analyze Now'}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 text-red-400 text-sm font-medium bg-red-500/10 py-2 rounded-lg">{error}</div>
                    )}
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-slide-up">
                    <div className="glass-panel rounded-3xl p-8 lg:p-10 shadow-2xl overflow-hidden relative border-t-4 border-purple-500">
                        {/* Score Section */}
                        <div className="flex flex-col md:flex-row items-center gap-10 mb-10 pb-10 border-b border-slate-700/50">
                            <div className="relative w-40 h-40 shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
                                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-purple-500 transition-all duration-1000 ease-out" strokeDasharray={`${result.ats_score * 2.51} 251`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-white">{result.ats_score}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-2">ATS Compatibility</h3>
                                <p className="text-slate-300 leading-relaxed text-lg">
                                    {result.ats_score >= 80 ? 'Excellent! Your resume is highly optimized for Applicant Tracking Systems.' :
                                        result.ats_score >= 60 ? 'Good start, but there is room for optimization to improve visibility.' :
                                            'Your resume might be getting filtered out. Please review the suggestions below.'}
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 font-bold text-xl text-emerald-400 mb-4">
                                    <CheckCircle2 className="w-6 h-6" /> Key Insights
                                </h4>
                                {result.insights?.map((insight, idx) => (
                                    <div key={idx} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-inner flex gap-3">
                                        <div className="mt-1 shrink-0"><CheckCircle2 className="w-5 h-5 text-emerald-500/50" /></div>
                                        <span className="text-slate-300">{insight}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 font-bold text-xl text-amber-400 mb-4">
                                    <Lightbulb className="w-6 h-6" /> Recommended Improvements
                                </h4>
                                {result.improvements?.map((imp, idx) => (
                                    <div key={idx} className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 shadow-inner flex gap-3">
                                        <div className="mt-1 shrink-0"><AlertTriangle className="w-5 h-5 text-amber-500/50" /></div>
                                        <span className="text-slate-300">{imp}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 text-center">
                            <button
                                onClick={() => { setResult(null); setFile(null); }}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg"
                            >
                                Analyze Another Resume
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
