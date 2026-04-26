import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Video, Mic, MicOff, CheckCircle, Clock } from 'lucide-react';
import { sendVideoChatMessage } from '../api';

export default function VideoInterview() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState([]);

    // Setup Refs
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const recognitionRef = useRef(null);
    const interimTranscriptRef = useRef('');

    // UI states
    const [currentStatus, setCurrentStatus] = useState("Initializing connection...");
    const [isThinking, setIsThinking] = useState(false);
    const [finalEvaluation, setFinalEvaluation] = useState(null);

    // 1. Initialize Webcam & Timer on Mount
    useEffect(() => {
        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                streamRef.current = stream;
                setCurrentStatus("Connected. Setting up AI...");

                // Trigger initial greeting from AI safely after a tiny delay
                setTimeout(() => {
                    handleAiTurn([{ role: 'user', content: 'Hi, I am ready to begin the interview.' }]);
                }, 1000);
            } catch (err) {
                console.error("Camera access denied:", err);
                setCurrentStatus("Camera access denied or unavailable.");
            }
        };

        initCamera();

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    endInterview();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    // 2. Formatting Timer
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // 3. AI Turn (Call backend API -> Text-To-Speech)
    const handleAiTurn = async (currentHistory) => {
        setIsThinking(true);
        setCurrentStatus("AI is thinking...");
        try {
            const data = await sendVideoChatMessage(sessionId, currentHistory);

            const newHistory = [
                ...currentHistory,
                { role: 'assistant', content: data.ai_response }
            ];
            setMessages(newHistory);

            // Speak the response
            speakText(data.ai_response);

        } catch (err) {
            console.error(err);
            setCurrentStatus("Connection error with AI...");
            setIsThinking(false);
        }
    };

    // 4. Text to Speech
    const speakText = (text) => {
        if (!window.speechSynthesis) {
            setCurrentStatus("Speech Synthesis not supported in this browser.");
            setIsThinking(false);
            return;
        }

        window.speechSynthesis.cancel(); // clear queue
        const utterance = new SpeechSynthesisUtterance(text);

        // Find a good english voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            setCurrentStatus("AI is speaking...");
            setIsThinking(false);
        };

        utterance.onend = () => {
            setCurrentStatus("Your turn to speak...");
            startDictation();
        };

        window.speechSynthesis.speak(utterance);
    };

    const [isManualStop, setIsManualStop] = useState(false);
    const [transcriptFeed, setTranscriptFeed] = useState('');
    const accumulatedTranscriptRef = useRef('');

    // 5. User Dictation (Web Speech API)
    const startDictation = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setCurrentStatus("Speech recognition not supported.");
            return;
        }

        setIsManualStop(false);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let sessionFinalTranscript = '';
        interimTranscriptRef.current = accumulatedTranscriptRef.current;

        recognition.onstart = () => {
            setIsRecording(true);
            setCurrentStatus("Listening...");
        };

        recognition.onresult = (event) => {
            let interim = '';
            let currentSessionFinal = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    currentSessionFinal += event.results[i][0].transcript + ' ';
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            sessionFinalTranscript = currentSessionFinal;
            const liveText = accumulatedTranscriptRef.current + sessionFinalTranscript + interim;
            interimTranscriptRef.current = liveText;
            setTranscriptFeed(liveText);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event);
            if (event.error === 'not-allowed') {
                setCurrentStatus("Microphone access denied.");
                setIsManualStop(true);
            }
        };

        recognition.onend = () => {
            accumulatedTranscriptRef.current += sessionFinalTranscript;
            // Auto-restart if we didn't manually stop it (silent drop-outs prevention)
            if (!isManualStop && !isThinking) {
                try {
                    recognition.start();
                    return;
                } catch (e) {
                    console.error("Failed to auto-restart recognition", e);
                }
            }
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const toggleDictation = () => {
        if (isRecording) {
            setIsManualStop(true);
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsRecording(false);
            setCurrentStatus("Microphone paused.");
        } else {
            startDictation();
        }
    }

    const stopDictationAndSubmit = () => {
        setIsManualStop(true);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);

        const finalAnswer = interimTranscriptRef.current.trim();
        if (!finalAnswer) {
            setCurrentStatus("Please say something before submitting.");
            return;
        }

        const newHistory = [...messages, { role: 'user', content: finalAnswer }];
        setMessages(newHistory);
        interimTranscriptRef.current = '';
        accumulatedTranscriptRef.current = '';
        setTranscriptFeed('');

        handleAiTurn(newHistory);
    };

    // 6. Finishing the Interview
    const endInterview = async () => {
        // Stop all active recordings/streams
        if (recognitionRef.current) recognitionRef.current.stop();
        window.speechSynthesis.cancel();
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

        setCurrentStatus("Finalizing evaluation...");

        try {
            // Ask AI for a final summary evaluation
            const summaryReq = [...messages, { role: 'user', content: 'The interview is over. Please provide a final 2 sentence concluding evaluation of my performance.' }];
            const data = await sendVideoChatMessage(sessionId, summaryReq);
            setFinalEvaluation(data.evaluation || data.ai_response);
        } catch (err) {
            console.error(err);
            setFinalEvaluation("Great job completing the interactive video interview!");
        }
    };

    if (finalEvaluation) {
        return (
            <div className="max-w-3xl mx-auto mt-20 text-center animate-fade-in space-y-8 bg-neutral-900/50 backdrop-blur-xl border border-amber-500/20 p-12 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <CheckCircle className="w-24 h-24 text-yellow-400 mx-auto" strokeWidth={1.5} />
                <h2 className="text-4xl font-bold text-white tracking-tight">Interview Complete</h2>
                <div className="bg-black/50 p-8 rounded-2xl border border-amber-500/20 shadow-xl inline-block text-left w-full mt-8">
                    <p className="text-amber-50 leading-relaxed text-lg">{finalEvaluation}</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-8 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white rounded-xl px-12 py-4 font-bold text-lg shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Active Chat Message View
    const latestAiMessage = messages.slice().reverse().find(m => m.role === 'assistant');

    return (
        <div className="max-w-6xl mx-auto h-[85vh] flex flex-col gap-6 animate-fade-in relative z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between shrink-0 bg-neutral-900/50 backdrop-blur-xl px-8 py-4 rounded-2xl border border-red-500/10 shadow-lg">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">Interactive Camera Mode</span>
                    <span className={`flex h-3 w-3 relative ml-2 ${isRecording ? '' : 'hidden'}`}>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </h1>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-300 font-medium bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                        <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                        <span className={`text-xl font-mono ${timeLeft < 60 ? 'text-red-400' : ''}`}>{formatTime(timeLeft)}</span>
                    </div>
                    <button
                        onClick={endInterview}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold px-6 py-2 rounded-full transition-all"
                    >
                        End Early
                    </button>
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex gap-6 h-full min-h-0">
                {/* Camera Feed */}
                <div className="flex-1 rounded-3xl overflow-hidden bg-neutral-900 backdrop-blur-xl border border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)] relative flex items-center justify-center group">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform -scale-x-100 transition-all duration-700 ${currentStatus === "AI is speaking..." ? 'opacity-40 blur-sm scale-105' : 'opacity-100'}`}
                    />

                    {/* Camera Overlay Elements */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

                    {/* Status Indicator */}
                    <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg">
                        <Video className="w-4 h-4 text-white" />
                        <span className="text-xs font-bold text-white tracking-wider uppercase">{currentStatus}</span>
                    </div>

                    {/* AI Avatar / Speaking Indicator (shows when AI is speaking) */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 pointer-events-none ${currentStatus === "AI is speaking..." ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-amber-500/30 overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)] bg-black flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M15 9h.01" /><path d="M9 9h.01" /><path d="M9 13v.01" /><path d="M15 13v.01" /><path d="M12 13v.01" /><path d="M12 17v.01" /></svg>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                                <span className="flex gap-0.5">
                                    <span className="w-1 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                                    <span className="w-1 h-3 bg-black rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                                    <span className="w-1 h-2 bg-black rounded-full animate-bounce"></span>
                                </span>
                                Speaking
                            </div>
                        </div>
                    </div>

                    {/* Captions / AI Speech Bubble overlaying the video feed */}
                    {latestAiMessage && (
                        <div className={`absolute bottom-8 left-8 right-8 z-10 transition-all duration-500 ${isThinking ? 'opacity-50 blur-sm scale-95' : 'opacity-100 scale-100'}`}>
                            <div className="bg-black/80 backdrop-blur-xl border border-amber-500/20 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                                <h4 className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${currentStatus === "AI is speaking..." ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'}`}></div>
                                    Interviewer
                                </h4>
                                <p className="text-amber-50 text-lg leading-relaxed text-balance font-medium">
                                    "{latestAiMessage.content}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side Controls & Live Transcript */}
                <div className="w-[400px] flex flex-col gap-6">
                    {/* AI Status / Wait panel */}
                    <div className="bg-neutral-900/50 backdrop-blur-xl p-6 rounded-3xl border border-red-500/10 flex flex-col justify-center shrink-0 shadow-xl overflow-hidden relative">
                        {isThinking ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-slate-400 font-medium">Processing your response...</span>
                            </div>
                        ) : currentStatus === "AI is speaking..." ? (
                            <div className="flex flex-col items-center justify-center py-8 opacity-50">
                                <Mic className="w-12 h-12 text-slate-500 mb-4" />
                                <span className="text-slate-400 font-medium text-center text-sm">Wait for the interviewer to finish speaking...<br />Your microphone will activate automatically.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Your Turn
                                    </span>
                                    {isRecording ? (
                                        <span className="text-xs font-bold bg-red-500/20 text-red-400 px-3 py-1 rounded-full animate-pulse border border-red-500/30 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-400"></div> Recording
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30">
                                            Paused
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-2">
                                    <button
                                        onClick={toggleDictation}
                                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${isRecording
                                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-yellow-500 border-amber-500/30'
                                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30'
                                            }`}
                                    >
                                        {isRecording ? <><MicOff className="w-4 h-4" /> Pause Mic</> : <><Mic className="w-4 h-4" /> Start Speaking</>}
                                    </button>
                                </div>

                                <button
                                    onClick={stopDictationAndSubmit}
                                    className="w-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white rounded-xl py-4 font-bold shadow-lg hover:shadow-red-500/25 transition-all mt-2"
                                >
                                    Finish Speaking & Send
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Live Transcript History Panel */}
                    <div className="flex-1 bg-neutral-900/50 backdrop-blur-xl rounded-3xl border border-red-500/10 p-6 flex flex-col shadow-xl min-h-0">
                        <div className="flex items-center justify-between mb-4 border-b border-red-500/10 pb-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Transcript</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 flex flex-col">
                            {messages.length === 0 ? (
                                <div className="text-sm text-slate-500 italic h-full flex items-center justify-center text-center">
                                    Your conversation transcript will appear here...
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-2 ${msg.role === 'user' ? 'text-amber-500' : 'text-red-400'}`}>
                                            {msg.role === 'user' ? 'You' : 'AI Interviewer'}
                                        </span>
                                        <div className={`p-4 rounded-2xl max-w-[90%] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-amber-500/20 border border-amber-500/30 text-amber-50 rounded-tr-none'
                                            : 'bg-neutral-800 border border-neutral-700 text-slate-200 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            {/* Optimistic UI for current user dictation */}
                            {transcriptFeed && (
                                <div className="flex flex-col items-end opacity-70">
                                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1 px-2 text-amber-500">You (Speaking...)</span>
                                    <div className="p-4 rounded-2xl max-w-[90%] text-sm leading-relaxed shadow-sm bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tr-none italic">
                                        {transcriptFeed}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
