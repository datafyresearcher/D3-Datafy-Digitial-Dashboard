"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { digitalTwin } from "@/lib/data";
import AnimatedSection from "./ui/AnimatedSection";
import AnimatedText from "./ui/AnimatedText";

export default function DigitalTwin() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-500/10 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div className="order-2 lg:order-1">
            <AnimatedSection>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 mb-4">
                {digitalTwin.eyebrow}
              </span>
            </AnimatedSection>
            <AnimatedText
              text={digitalTwin.title}
              as="h2"
              className="font-display font-bold text-3xl md:text-5xl leading-tight mb-6 text-balance"
            />
            <AnimatedSection delay={0.2}>
              <p className="text-white/70 leading-relaxed mb-10 text-lg">
                {digitalTwin.text}
              </p>
            </AnimatedSection>

            <div className="grid sm:grid-cols-1 gap-4 mb-10">
              {digitalTwin.features.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand-500 text-white">
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white/80">{f.text}</span>
                </motion.div>
              ))}
            </div>

            <AnimatedSection delay={0.3}>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/30"
              >
                Discover more <ArrowRight className="w-4 h-4" />
              </a>
            </AnimatedSection>
          </div>

          {/* Right: Dashboard Carousel */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-8 border-white/10 bg-black">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeIdx}
                  src={digitalTwin.images[activeIdx]}
                  alt="Dashboard"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {digitalTwin.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeIdx === i ? "bg-white w-6" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Decor elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-teal-500/20 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
