"use client";

import { motion } from "framer-motion";
import { whyChooseUs } from "@/lib/data";
import AnimatedSection from "./ui/AnimatedSection";
import AnimatedText from "./ui/AnimatedText";

export default function WhyChooseUs() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-4">
              {whyChooseUs.eyebrow}
            </span>
          </AnimatedSection>
          <AnimatedText
            text={whyChooseUs.title}
            as="h2"
            className="font-display font-bold text-3xl md:text-5xl leading-tight text-ink-900 mb-4 text-balance"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {whyChooseUs.items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative p-8 rounded-3xl border border-black/5 bg-brand-50/50 hover:bg-white hover:shadow-2xl hover:shadow-brand-500/10 transition-all group"
            >
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-brand-600 shadow-sm group-hover:bg-brand-600 group-hover:text-white transition-all duration-300">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink-900 mb-3">
                {item.title}
              </h3>
              <p className="text-sm text-ink-800/70 leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
