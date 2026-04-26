import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { submitAnswer } from '../api';
import { Mic, MicOff, Send, Volume2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function LiveInterview() {
    const { sessionId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const questions = location.state?.questions || [];

    const [currentIdx, setCurrentIdx] = useState(location.state?.startIdx || 0);
    const [answer, setAnswer] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Web Speech API Ref
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setAnswer(currentTranscript);
            };
        }
    }, []);

    if (!questions || questions.length === 0) {
        return <div className="text-center mt-20 text-xl">No active interview session found.</div>;
    }

    const currentQ = questions[currentIdx];

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert("Speech Recognition not supported in this browser.");
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setAnswer(''); // Clear previous when starting new
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (e) {
                console.error(e);
                setIsRecording(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!answer.trim()) return;
        setSubmitting(true);
        try {
            if (isRecording) toggleRecording();
            const result = await submitAnswer(sessionId, currentQ.id, answer);
            setFeedback(result);
        } catch (err) {
            console.error(err);
            alert('Failed to submit answer.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        setAnswer('');
        setFeedback(null);
        if (currentIdx < questions.length - 1) {
            const nextIdx = currentIdx + 1;
            const nextQ = questions[nextIdx];
            if (nextQ.type === 'Code') {
                navigate(`/coding/${sessionId}`, { state: { questions, startIdx: nextIdx } });
            } else {
                setCurrentIdx(nextIdx);
            }
        } else {
            navigate(`/video/${sessionId}`);
        }
    };

    const handlePrev = () => {
        setAnswer('');
        setFeedback(null);
        if (currentIdx > 0) {
            const prevIdx = currentIdx - 1;
            const prevQ = questions[prevIdx];
            if (prevQ.type === 'Code') {
                navigate(`/coding/${sessionId}`, { state: { questions, startIdx: prevIdx } });
            } else {
                setCurrentIdx(prevIdx);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
            {/* Background glow */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] -z-10"></div>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Volume2 className="text-blue-400 w-6 h-6" /> Live Session
                </h1>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wide border border-indigo-500/30">
                        {currentQ.type || 'Speech'}
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm font-medium text-slate-300 shadow-inner">
                        Question {currentIdx + 1} of {questions.length}
                    </span>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-8 lg:p-12 mb-8 shadow-2xl border-t border-white/10 relative overflow-hidden">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <h2 className="text-2xl lg:text-3xl font-medium leading-relaxed relative z-10">{currentQ.text || currentQ.question}</h2>
            </div>

            {!feedback ? (
                <div className="space-y-6">
                    {currentQ.type === 'MCQ' ? (
                        <div className="space-y-4">
                            {currentQ.options?.map((opt, i) => (
                                <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${answer === opt ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}>
                                    <input
                                        type="radio"
                                        name="mcq-option"
                                        value={opt}
                                        checked={answer === opt}
                                        onChange={() => setAnswer(opt)}
                                        className="w-5 h-5 text-indigo-500 bg-slate-900 border-slate-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-lg text-slate-200">{opt}</span>
                                </label>
                            ))}
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentIdx === 0}
                                    className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 hover:border-slate-500 rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-all text-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" /> Prev
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-all text-lg"
                                >
                                    Skip <ArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !answer}
                                    className="flex-[2] bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/25 transition-all text-lg"
                                >
                                    <Send className="w-5 h-5" />
                                    {submitting ? 'Analyzing...' : 'Submit Answer'}
                                </button>
                            </div>
                        </div>
                    ) : currentQ.type === 'Text' ? (
                        <div className="space-y-6">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="w-full h-48 bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500 resize-none shadow-inner"
                                placeholder="Type your answer here..."
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentIdx === 0}
                                    className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 hover:border-slate-500 rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-all text-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" /> Prev
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-all text-lg"
                                >
                                    Skip <ArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !answer.trim()}
                                    className="flex-[2] bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/25 transition-all text-lg"
                                >
                                    <Send className="w-5 h-5" />
                                    {submitting ? 'Analyzing...' : 'Submit Answer'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative">
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="w-full h-48 bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-500 resize-none shadow-inner"
                                    placeholder="Type your answer here, or click the microphone to speak..."
                                />
                                {isRecording && (
                                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/50 animate-pulse text-sm font-medium">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div> Recording
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentIdx === 0}
                                    className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 hover:border-slate-500 rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-all text-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" /> Prev
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl py-4 font-bold flex items-center justify-center gap-2 transition-all text-lg"
                                >
                                    Skip <ArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={toggleRecording}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all shadow-lg text-lg ${isRecording
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    {isRecording ? <><MicOff className="w-5 h-5" /> Stop Dictation</> : <><Mic className="w-5 h-5" /> Voice Answer</>}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !answer.trim()}
                                    className="flex-[2] bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-indigo-500/25 transition-all text-lg"
                                >
                                    <Send className="w-5 h-5" />
                                    {submitting ? 'Analyzing...' : 'Submit Answer'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-slide-up">
                    <div className="glass-panel p-8 rounded-3xl space-y-8 bg-slate-800/80 border-t border-white/10 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                            <BotIcon />
                            <h3 className="text-xl font-bold text-white">AI Analysis complete</h3>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard title="Accuracy" score={feedback.accuracy_score} color="emerald" />
                            <MetricCard title="Clarity" score={feedback.clarity_score} color="blue" />
                        </div>

                        <div className="space-y-4">
                            <FeedbackSection icon={<AlertCircle className="text-amber-400" />} title="Feedback" content={feedback.feedback_text} />
                            <FeedbackSection icon={<ArrowRight className="text-indigo-400" />} title="Improvement Suggestion" content={feedback.improvement_suggestion} />
                            <FeedbackSection icon={<CheckCircle2 className="text-emerald-400" />} title="Sample Better Answer" content={feedback.sample_better_answer} isSample />
                        </div>

                        <div className="flex gap-3 shrink-0 mt-4">
                            <button
                                onClick={handlePrev}
                                disabled={currentIdx === 0}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl py-3 font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Prev
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-[2] bg-slate-100 hover:bg-white text-slate-900 rounded-xl py-4 font-bold transition-all shadow-lg text-lg flex items-center justify-center gap-2"
                            >
                                {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Session'} <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BotIcon() {
    return (
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M15 9h.01" /><path d="M9 9h.01" /><path d="M9 13v.01" /><path d="M15 13v.01" /><path d="M12 13v.01" /><path d="M12 17v.01" /></svg>
        </div>
    )
}

function MetricCard({ title, score, color }) {
    const colorMap = {
        emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    }

    const num = Number(score);
    const displayVal = !isNaN(num) ? num.toFixed(1) : '-';

    return (
        <div className={`p-4 rounded-2xl border ${colorMap[color]} flex flex-col items-center justify-center gap-2 shadow-inner`}>
            <span className="text-sm font-medium uppercase tracking-wider opacity-80">{title}</span>
            <span className="text-3xl font-bold">{displayVal} <span className="text-lg opacity-50">/ 10</span></span>
        </div>
    )
}

function FeedbackSection({ icon, title, content, isSample }) {
    if (!content) return null;
    const displayContent = typeof content === 'string' ? content : JSON.stringify(content);
    return (
        <div className={`p-5 rounded-2xl ${isSample ? 'bg-indigo-900/20 border border-indigo-500/20' : 'bg-slate-900/50'}`}>
            <h4 className="flex items-center gap-2 font-semibold mb-3 text-white">
                {icon} {title}
            </h4>
            <p className="text-slate-300 leading-relaxed text-[15px] pl-7 whitespace-pre-wrap">{displayContent}</p>
        </div>
    )
}
