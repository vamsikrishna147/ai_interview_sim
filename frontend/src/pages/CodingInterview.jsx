import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { evaluateCode } from '../api';
import { Play, Code2, AlertTriangle, Lightbulb, ArrowRight, ArrowLeft, Settings } from 'lucide-react';

const LANGUAGE_DEFAULTS = {
    python: 'def solution():\n    # Write your code here\n    pass',
    javascript: 'function solution() {\n    // Write your code here\n}',
    java: 'class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}',
    cpp: '#include <iostream>\nusing namespace std;\n\nvoid solve() {\n    // Write your code here\n}',
};

export default function CodingInterview() {
    const { sessionId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const questions = location.state?.questions || [];

    const [currentIdx, setCurrentIdx] = useState(location.state?.startIdx || 0);
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(LANGUAGE_DEFAULTS['python']);
    const [feedback, setFeedback] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (!questions || questions.length === 0) {
        return <div className="text-center mt-20 text-xl">No active interview session found.</div>;
    }

    const currentQ = questions[currentIdx];

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        // Only override code if it's currently a default or empty
        if (!code || Object.values(LANGUAGE_DEFAULTS).includes(code.trim())) {
            setCode(LANGUAGE_DEFAULTS[newLang]);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const result = await evaluateCode(sessionId, currentQ.id, code, language);
            setFeedback(result);
        } catch (err) {
            console.error(err);
            alert('Failed to evaluate code.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        setCode(LANGUAGE_DEFAULTS[language]);
        setFeedback(null);
        if (currentIdx < questions.length - 1) {
            const nextIdx = currentIdx + 1;
            const nextQ = questions[nextIdx];
            if (nextQ.type === 'Code') {
                setCurrentIdx(nextIdx);
            } else {
                navigate(`/live/${sessionId}`, { state: { questions, startIdx: nextIdx } });
            }
        } else {
            navigate(`/video/${sessionId}`);
        }
    };

    const handlePrev = () => {
        setCode(LANGUAGE_DEFAULTS[language]);
        setFeedback(null);
        if (currentIdx > 0) {
            const prevIdx = currentIdx - 1;
            const prevQ = questions[prevIdx];
            if (prevQ.type === 'Code') {
                setCurrentIdx(prevIdx);
            } else {
                navigate(`/live/${sessionId}`, { state: { questions, startIdx: prevIdx } });
            }
        }
    };

    return (
        <div className="flex flex-col h-[85vh] gap-6 animate-fade-in">
            <div className="flex items-center justify-between shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Code2 className="text-emerald-400 w-6 h-6" /> Coding Simulator
                </h1>
                <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 rounded-full bg-slate-800 text-sm font-medium text-slate-300">
                        Question {currentIdx + 1} of {questions.length}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrev}
                            disabled={submitting || currentIdx === 0}
                            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-bold flex items-center gap-2 border border-slate-700 hover:border-slate-500 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" /> Prev
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={submitting}
                            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg px-6 py-2 font-bold flex items-center gap-2 border border-slate-700 hover:border-slate-500 transition-all"
                        >
                            {feedback ? 'Next' : 'Skip'} <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-6 py-2 font-bold flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 transition-all"
                        >
                            <Play className="w-4 h-4" /> {submitting ? 'Running...' : 'Run & Evaluate'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 h-full overflow-hidden">
                {/* Left pane: Question & Editor */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="glass-panel rounded-2xl p-6 shadow-inner shrink-0 max-h-48 overflow-y-auto">
                        <h2 className="text-xl font-medium mb-2 pr-4">{currentQ.text || currentQ.question}</h2>
                    </div>

                    <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700 shadow-xl relative flex flex-col">
                        <div className="absolute top-0 left-0 right-0 h-12 bg-[#1e1e1e] border-b border-slate-700/50 flex items-center justify-between px-4 z-10">
                            <span className="text-xs text-slate-400 font-mono">Editor</span>
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-slate-400" />
                                <select
                                    value={language}
                                    onChange={handleLanguageChange}
                                    className="bg-transparent text-sm text-slate-300 font-medium focus:outline-none border border-slate-700 rounded-md px-2 py-1"
                                >
                                    <option value="python">Python</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex-1 mt-12 relative min-h-0">
                            <Editor
                                height="100%"
                                language={language}
                                theme="vs-dark"
                                value={code}
                                onChange={(val) => setCode(val)}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 16,
                                    padding: { top: 16, bottom: 16 },
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                                }}
                            />
                        </div>

                        {/* Execution Output Console */}
                        {feedback && (
                            <div className="h-48 bg-black border-t border-slate-700 flex flex-col shrink-0">
                                <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs font-mono text-slate-400 shadow-sm">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Console Output</span>
                                </div>
                                <div className="p-4 font-mono text-sm text-slate-300 overflow-y-auto whitespace-pre-wrap flex-1 bg-[#1e1e1e]/50">
                                    {feedback.execution_output || 'Process output is empty. Check your code logic or test cases.'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right pane: Feedback */}
                {feedback && (
                    <div className="w-[400px] glass-panel rounded-2xl p-6 overflow-y-auto space-y-6 animate-slide-up border-l-4 border-emerald-500 flex flex-col">
                        <div className="flex items-center gap-2 font-semibold text-xl text-emerald-400 pb-2 border-b border-white/5 shrink-0">
                            <BotIcon /> Analysis Results
                        </div>

                        <div className="grid grid-cols-2 gap-3 shrink-0">
                            <ScoreBox label="Correctness" val={feedback.correctness_score} />
                            <ScoreBox label="Readability" val={feedback.readability_score} />
                        </div>

                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-inner shrink-0">
                            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Time Complexity</span>
                            <div className="text-2xl font-mono text-purple-400 mt-1">{typeof feedback.time_complexity === 'string' ? feedback.time_complexity : JSON.stringify(feedback.time_complexity || 'O(N)')}</div>
                        </div>

                        <div className="space-y-4 pt-2 flex-1">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                <h4 className="flex items-center gap-2 font-medium text-blue-300 mb-2 text-sm uppercase"><AlertTriangle className="w-4 h-4" /> Feedback</h4>
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{typeof feedback.feedback_text === 'string' ? feedback.feedback_text : JSON.stringify(feedback.feedback_text)}</p>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                                <h4 className="flex items-center gap-2 font-medium text-amber-300 mb-2 text-sm uppercase"><Lightbulb className="w-4 h-4" /> Suggestion</h4>
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{typeof feedback.improvement_suggestion === 'string' ? feedback.improvement_suggestion : JSON.stringify(feedback.improvement_suggestion)}</p>
                            </div>
                        </div>


                    </div>
                )}
            </div>
        </div>
    );
}

function ScoreBox({ label, val }) {
    const num = Number(val);
    const displayVal = !isNaN(num) ? num.toFixed(1) : '-';
    return (
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 shadow-inner text-center">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">{label}</div>
            <div className="text-xl font-bold">{displayVal} <span className="text-sm font-normal text-slate-500">/10</span></div>
        </div>
    )
}

function BotIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M15 9h.01" /><path d="M9 9h.01" /><path d="M9 13v.01" /><path d="M15 13v.01" /><path d="M12 13v.01" /><path d="M12 17v.01" /></svg>
    )
}
