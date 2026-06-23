"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { solarServices } from "@/lib/data";
import AnimatedSection from "./ui/AnimatedSection";
import AnimatedText from "./ui/AnimatedText";

export default function SolarServices() {
  return (
    <section id="services" className="relative py-24 md:py-32 bg-brand-50/30 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <AnimatedSection>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-4">
              {solarServices.eyebrow}
            </span>
          </AnimatedSection>
          <AnimatedText
            text={solarServices.title}
            as="h2"
            className="font-display font-bold text-3xl md:text-5xl leading-tight text-ink-900 mb-4 text-balance"
          />
          <div className="flex flex-col items-center gap-2">
             <motion.span 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               className="font-display font-bold text-xl text-brand-600 tracking-widest uppercase"
             >
               {solarServices.tagline}
             </motion.span>
             <motion.p
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               className="text-ink-800/60 max-w-lg"
             >
               {solarServices.subtagline}
             </motion.p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {solarServices.items.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative flex flex-col rounded-3xl bg-white shadow-xl shadow-black/5 border border-black/5 overflow-hidden card-hover"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4 grid place-items-center w-12 h-12 rounded-xl bg-brand-500 text-white shadow-lg">
                  <service.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <h3 className="font-display font-bold text-xl text-ink-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-sm text-ink-800/70 leading-relaxed mb-6 flex-1">
                  {service.text}
                </p>
                <a
                  href={service.href}
                  className="inline-flex items-center gap-2 text-brand-600 font-semibold text-sm hover:gap-3 transition-all"
                >
                  Learn more <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
