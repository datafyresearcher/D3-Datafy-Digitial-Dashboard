"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { heroFeatures, stats } from "@/lib/data";
import Counter from "./ui/Counter";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-ink-900 text-white pt-20 pb-32"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30"
        >
          <source src="/clip-for-header.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-transparent to-ink-900/90" />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-brand-400/60 z-10"
          style={{
            top: `${15 + i * 13}%`,
            left: `${10 + i * 14}%`,
          }}
          animate={{ y: [0, -30, 0], opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      <div className="relative mx-auto max-w-7xl px-6 z-10">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-white/10 text-sm text-brand-300 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Welcome to Datafy Associate
          </motion.div>

          {/* Headline */}
          <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
            {["Stay", "on", "top", "of"].map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.15 + i * 0.1,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="inline-block mr-4"
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.55,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="inline-block gradient-text"
            >
              your site
            </motion.span>
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mb-8"
          >
            Empowering Performance With Precise Aerial Insights
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="flex flex-wrap items-center gap-4"
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-500 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-[1.03] transition-all"
            >
              Book a Free Consultation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl glass-dark border border-white/15 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Explore Services
            </a>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden glass-dark border border-white/10"
        >
          {stats.map((s) => (
            <div key={s.label} className="p-6 text-center">
              <div className="font-display font-bold text-3xl md:text-4xl gradient-text">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <div className="text-xs md:text-sm text-white/60 mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Feature cards overlapping bottom */}
      <div className="relative mx-auto max-w-7xl px-6 mt-16">
        <div className="grid md:grid-cols-3 gap-5">
          {heroFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              whileHover={{ y: -8 }}
              className="group relative p-7 rounded-2xl bg-white text-ink-900 shadow-xl shadow-black/10 border border-black/5 overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-brand-100/60 blur-2xl group-hover:bg-brand-200/80 transition-colors" />
              <div className="relative">
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-white mb-5 shadow-lg shadow-brand-500/30">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-ink-800/70 leading-relaxed">
                  {f.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
