"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import AnimatedSection from "./ui/AnimatedSection";

export default function Certifications() {
  return (
    <section className="py-16 md:py-24 bg-white border-y border-black/5 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-10">
          <div className="flex items-center gap-3 text-brand-600">
            <Award className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Certifications & Standards
            </span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-8"
          >
            {[
              "ISO 9001:2015",
              "ISO 14001:2015",
              "ISO 45001:2018",
              "IEC 62443",
              "PCAA Approved",
              "NASTP Certified",
            ].map((cert) => (
              <motion.div
                key={cert}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-brand-200 bg-brand-50/50 font-medium text-ink-800 hover:border-brand-400 hover:bg-brand-100 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                {cert}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
