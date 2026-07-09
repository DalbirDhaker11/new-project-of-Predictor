import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Activity, ShieldCheck, PieChart, Users, TrendingUp } from "lucide-react";

interface LandingPageProps {
  onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative overflow-hidden w-full">
      {/* Background Decorative Elements */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--c16)]/20 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none"
      />

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl w-full px-6 py-12 flex flex-col items-center text-center space-y-12">
        
        {/* Header / Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="h-24 w-24 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-lg border border-slate-100 p-2">
            <img src="/logo.png" alt="ERRP Logo" className="h-full w-full object-contain scale-[1.3]" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--c2)] border border-[var(--c5)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--c13)]">System Operational</span>
          </div>
        </motion.div>

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="space-y-6 max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[var(--c18)] leading-tight">
            Predict turnover. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--c16)] to-emerald-500">
              Retain your best talent.
            </span>
          </h1>
          <p className="text-sm md:text-base text-[var(--c13)] font-medium max-w-xl mx-auto leading-relaxed">
            The intelligent HR platform that uses advanced analytics to forecast employee resignation risk, identify friction points, and provide actionable AI-driven retention strategies.
          </p>
        </motion.div>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <button
            onClick={onLaunch}
            className="group relative inline-flex items-center justify-center gap-3 bg-[var(--c18)] text-[var(--c1)] px-8 py-4 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-[var(--c18)]/20 cursor-pointer"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Feature Bento Grid */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.4 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8"
        >
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60 } }
            }}
            whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 20px 40px rgba(0,0,0,0.1)" }}
            className="bg-[var(--c1)]/60 backdrop-blur-xl border border-[var(--c5)] p-6 rounded-3xl text-left space-y-4 hover:border-[var(--c8)] transition-colors cursor-default"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--c18)] mb-1">Predictive Risk Scoring</h3>
              <p className="text-xs text-[var(--c13)] leading-relaxed">Instantly calculate the flight risk of every employee using heuristic modeling based on workload, commute, and compensation.</p>
            </div>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60 } }
            }}
            whileHover={{ scale: 1.05, y: -20, boxShadow: "0px 20px 40px rgba(0,0,0,0.1)" }}
            className="bg-[var(--c1)]/60 backdrop-blur-xl border border-[var(--c5)] p-6 rounded-3xl text-left space-y-4 hover:border-[var(--c8)] transition-colors md:-translate-y-4 cursor-default"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--c18)] mb-1">Smart Auto-Compare</h3>
              <p className="text-xs text-[var(--c13)] leading-relaxed">Evaluate employees side-by-side with AI summaries to prioritize high-value retention efforts effortlessly.</p>
            </div>
          </motion.div>

          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60 } }
            }}
            whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 20px 40px rgba(0,0,0,0.1)" }}
            className="bg-[var(--c1)]/60 backdrop-blur-xl border border-[var(--c5)] p-6 rounded-3xl text-left space-y-4 hover:border-[var(--c8)] transition-colors cursor-default"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--c18)] mb-1">AI Action Plans</h3>
              <p className="text-xs text-[var(--c13)] leading-relaxed">Automatically generate manager talking points and structured retention emails using advanced LLM integration.</p>
            </div>
          </motion.div>
        </motion.div>
        
      </div>
    </div>
  );
}
