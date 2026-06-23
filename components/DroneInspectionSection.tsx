"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AnimatedSection from "./ui/AnimatedSection";

export default function DroneInspectionSection() {
  return (
    <section className="relative py-24 md:py-32 bg-ink-900 overflow-hidden">
      {/* Background Image with Parallax/Zoom effect */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=2070&auto=format&fit=crop"
          alt="Drone Inspection"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/80 via-ink-900/40 to-ink-900" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 z-10">
        <div className="flex flex-col items-center text-center">
          <AnimatedSection>
            {/* The Badge from the user's image */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-teal-500/30 text-xs font-bold uppercase tracking-widest text-teal-400 mb-8 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered
            </div>
          </AnimatedSection>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display font-bold text-4xl md:text-6xl text-white mb-6"
          >
            Drone Inspections
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/70 text-lg md:text-xl max-w-2xl mb-12 font-light"
          >
            Leveraging cutting-edge AI and autonomous drone technology to provide highly accurate, real-time inspections for solar assets and critical infrastructure.
          </motion.p>

          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5, delay: 0.4 }}
             className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 relative group"
          >
             {/* Visual representation of the "animated image" */}
             <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-teal-500/10 group-hover:from-brand-500/20 group-hover:to-teal-500/20 transition-colors duration-700" />
             
             <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500 via-transparent to-transparent animate-pulse" />
                </div>

                <div className="relative text-center p-12 z-10">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                            duration: 6, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        className="inline-block p-6 rounded-full bg-brand-500/10 mb-8 border border-brand-500/20"
                    >
                        <Sparkles className="w-16 h-16 text-brand-500" />
                    </motion.div>
                    <h3 className="text-white font-display font-bold text-2xl md:text-3xl mb-2">Autonomous Intelligence</h3>
                    <p className="text-white/40 font-mono text-sm tracking-widest">SCANNING ASSETS IN REAL-TIME</p>
                </div>

                {/* Decorative scan lines */}
                <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent z-20"
                />
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
