"use client";

import { motion } from "framer-motion";
import { ArrowRight, Map as MapIcon } from "lucide-react";
import { topoMapping } from "@/lib/data";
import AnimatedSection from "./ui/AnimatedSection";
import AnimatedText from "./ui/AnimatedText";

export default function TopoMapping() {
  return (
    <section id="topo" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <AnimatedSection>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-4">
                {topoMapping.eyebrow}
              </span>
            </AnimatedSection>
            <AnimatedText
              text={topoMapping.title}
              as="h2"
              className="font-display font-bold text-3xl md:text-5xl leading-tight text-ink-900 mb-6 text-balance"
            />
            <AnimatedSection delay={0.2}>
              <p className="text-ink-800/70 leading-relaxed mb-10 text-lg">
                {topoMapping.text}
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-ink-900 text-white font-semibold hover:bg-brand-600 transition-all shadow-lg"
              >
                Discover more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </AnimatedSection>
          </div>

          {/* Right: Image Gallery */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden shadow-lg group aspect-[3/4]"
            >
              <img
                src={topoMapping.images[0]}
                alt="Mapping 1"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>
            <div className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative rounded-3xl overflow-hidden shadow-lg group aspect-square"
              >
                <img
                  src={topoMapping.images[1]}
                  alt="Mapping 2"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative rounded-3xl overflow-hidden shadow-lg group aspect-square"
              >
                <img
                  src={topoMapping.images[2]}
                  alt="Mapping 3"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
