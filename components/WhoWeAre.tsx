"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { whoWeAre } from "@/lib/data";
import AnimatedSection from "./ui/AnimatedSection";
import AnimatedText from "./ui/AnimatedText";

export default function WhoWeAre() {
  return (
    <section id="about" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-brand-100/50 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left: Image with floating accents */}
          <AnimatedSection direction="right">
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="aspect-[4/5] w-full object-cover"
                >
                  <source src="/drone-inspection.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 to-transparent" />
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 glass rounded-2xl shadow-xl p-5 border border-white/40 hidden sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-11 h-11 rounded-xl bg-brand-500 text-white">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-lg text-ink-900">
                      500+ MW
                    </div>
                    <div className="text-xs text-ink-800/60">
                      Solar Assets Inspected
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating top badge */}
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -top-5 -right-5 glass rounded-2xl shadow-xl px-4 py-3 border border-white/40 hidden sm:block"
              >
                <div className="text-xs text-brand-600 font-semibold uppercase tracking-wider">
                  AI-Powered
                </div>
                <div className="font-display font-bold text-ink-900">
                  Drone Inspections
                </div>
              </motion.div>
            </div>
          </AnimatedSection>

          {/* Right: Content */}
          <div>
            <AnimatedSection>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-4">
                {whoWeAre.eyebrow}
              </span>
            </AnimatedSection>
            <AnimatedText
              text={whoWeAre.title}
              as="h2"
              className="font-display font-bold text-3xl md:text-5xl leading-tight text-ink-900 mb-6 text-balance"
            />
            <AnimatedSection delay={0.2}>
              <p className="text-ink-800/70 leading-relaxed mb-8 max-w-xl">
                {whoWeAre.text}
              </p>
            </AnimatedSection>

            <div className="space-y-4">
              {whoWeAre.cards.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  whileHover={{ x: 6 }}
                  className="group flex gap-5 p-6 rounded-2xl border border-black/5 bg-white shadow-sm hover:shadow-xl hover:shadow-brand-500/10 transition-shadow"
                >
                  <div className="shrink-0 grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-600 group-hover:from-brand-500 group-hover:to-teal-600 group-hover:text-white transition-all duration-300">
                    <card.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-ink-900 mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-ink-800/60 leading-relaxed">
                      {card.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <AnimatedSection delay={0.3}>
              <a
                href="#services"
                className="group inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-ink-900 text-white font-semibold hover:bg-brand-600 transition-colors"
              >
                Learn More
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
