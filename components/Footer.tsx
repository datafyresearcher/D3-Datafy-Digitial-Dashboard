"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, Sun } from "lucide-react";
import { company, nav } from "@/lib/data";
import AnimatedSection from "./ui/AnimatedSection";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Services: [
      { label: "Solar O&M", href: "#services" },
      { label: "Comprehensive Solar Inspection", href: "#services" },
      { label: "Third Party Verification", href: "#services" },
      { label: "Topographical Mapping", href: "#topo" },
    ],
    "Quick Links": [
      { label: "Home", href: "#home" },
      { label: "About Us", href: "#about" },
      { label: "Contact Us", href: "#contact" },
      { label: "Privacy Policy", href: "#" },
    ],
    Company: [
      { label: company.address, href: "#" },
      { label: company.email, href: `mailto:${company.email}` },
      { label: company.phone, href: `tel:${company.phone}` },
    ],
  };

  return (
    <footer className="bg-ink-900 text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-10" />
      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-lg">
                <Sun className="w-6 h-6" />
              </div>
              <div className="leading-tight">
                <span className="font-display font-bold text-xl text-white block">Datafy</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-brand-400 font-semibold">Associate</span>
              </div>
            </div>
            <p className="text-white/50 mb-8 max-w-xs">
              Empowering clean energy transformation through AI-driven drone inspections, solar asset management, and precision geospatial mapping.
            </p>
            <div className="flex items-center gap-4">
              {[
                { label: "Facebook", icon: Facebook, href: company.socials.facebook },
                { label: "Instagram", icon: Instagram, href: company.socials.instagram },
                { label: "LinkedIn", icon: Linkedin, href: company.socials.linkedin },
                { label: "YouTube", icon: Youtube, href: company.socials.youtube },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="grid place-items-center w-10 h-10 rounded-lg bg-white/5 hover:bg-brand-500/20 transition-colors"
                >
                  <s.icon className="w-5 h-5 text-white/70" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Columns */}
          {Object.entries(footerLinks).map(([title, links], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h4 className="font-display font-bold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/60 hover:text-brand-400 transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-10" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/40 text-sm"
          >
            Copyright\u00a9 {currentYear} Datafy Associate, All Rights Reserved.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-6 text-xs text-white/40"
          >
            <span>Designed with precision for the energy future</span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
