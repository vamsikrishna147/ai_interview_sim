import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Mic, Code, Power } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center min-h-[90vh] pb-24 text-center px-4 pt-10">

            {/* Massive Skeuomorphic Chassis */}
            <div className="w-full max-w-6xl bg-gradient-to-b from-[#1c212d] to-[#12151c] rounded-3xl p-4 md:p-8 shadow-[0_25px_50px_rgba(0,0,0,0.8),inset_0_2px_2px_rgba(255,255,255,0.05),inset_0_-2px_10px_rgba(0,0,0,0.5)] border-t border-white/10 border-b-4 border-black relative overflow-hidden">
                
                {/* Decorative Chassis Details */}
                <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)]"></div>
                <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)]"></div>
                <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)]"></div>
                <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)]"></div>

                <div className="flex flex-col items-center justify-center text-center p-8 md:p-16 relative z-10 min-h-[400px]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse"></span>
                            <span className="w-3 h-3 rounded-full bg-red-950 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></span>
                            <span className="w-3 h-3 rounded-full bg-red-950 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"></span>
                        </div>
                        <span className="text-red-500 font-mono text-xs md:text-sm tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">Sys.Online // Ready</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-200 uppercase leading-[1.05] drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] mb-12">
                        TECHNICAL <br />
                        <span className="text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]">INTERVIEW</span> <br />
                        <span className="text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">SIMULATION</span>
                    </h1>

                    <div className="w-full max-w-sm mx-auto">
                        <Link
                            to="/setup"
                            className="w-full relative group flex flex-col items-center justify-center gap-2 p-6 bg-gradient-to-b from-red-600 to-red-800 border-t-2 border-red-400 border-b-8 border-red-950 rounded-2xl font-black text-xl md:text-2xl uppercase tracking-widest transition-all shadow-[0_20px_40px_rgba(0,0,0,0.8),0_5px_15px_rgba(0,0,0,0.9)] active:translate-y-2 active:border-b-0 active:border-t-0 active:shadow-[0_5px_10px_rgba(0,0,0,0.9)]"
                        >
                            <Power className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Start System</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Feature Cards below the main chassis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-24 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <FeatureCard
                    icon={<Mic className="w-8 h-8 text-red-500" />}
                    title="Voice Interviews"
                    desc="Practice speaking naturally with conversational AI feedback to build confidence."
                />
                <FeatureCard
                    icon={<Code className="w-8 h-8 text-amber-500" />}
                    title="Code Evaluation"
                    desc="Write and execute code with real-time complexity and correctness analysis."
                />
                <FeatureCard
                    icon={<Bot className="w-8 h-8 text-rose-400" />}
                    title="AI Feedback"
                    desc="Get detailed, actionable insights from our advanced evaluation models."
                />
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="bg-gradient-to-b from-[#1a1f2e] to-[#12151f] border-t border-l border-white/10 border-b-black/50 border-r-black/50 p-8 rounded-2xl flex flex-col items-start text-left space-y-5 hover:-translate-y-1 transition-transform duration-300 shadow-[0_15px_30px_rgba(0,0,0,0.6),0_5px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <div className="p-4 bg-[#0d1017] rounded-2xl shadow-[inset_0_3px_6px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.05)] border border-black/80">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white drop-shadow-md">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}
