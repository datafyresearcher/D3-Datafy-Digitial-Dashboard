"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { testimonials } from "@/lib/data";
import AnimatedSection from "./ui/AnimatedSection";
import AnimatedText from "./ui/AnimatedText";

export default function Testimonials() {
  return (
    <section className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-10" />
      
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 mb-4">
              {testimonials.eyebrow}
            </span>
          </AnimatedSection>
          <AnimatedText
            text="Client Success Stories"
            as="h2"
            className="font-display font-bold text-3xl md:text-5xl leading-tight text-white mb-4 text-balance"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="relative p-8 rounded-3xl glass-dark border border-white/10"
            >
              <div className="flex gap-1 text-brand-400 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-current" />
                ))}
              </div>
               <p className="text-lg text-white/80 leading-relaxed italic mb-8">
                 {item.text}
               </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-teal-500" />
                <div>
                  <div className="font-display font-bold text-white">{item.name}</div>
                  <div className="text-xs text-white/50">{item.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
