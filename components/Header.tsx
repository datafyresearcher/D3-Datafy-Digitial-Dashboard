"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone, Mail, Sun, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { company, nav } from "@/lib/data";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:block bg-ink-900 text-white/80 text-sm">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between py-2">
          <div className="flex items-center gap-6">
            <a
              href={`mailto:${company.email}`}
              className="flex items-center gap-2 hover:text-brand-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" /> {company.email}
            </a>
            <a
              href={`tel:${company.phone}`}
              className="flex items-center gap-2 hover:text-brand-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> {company.phone}
            </a>
          </div>
           <div className="flex items-center gap-4">
             <a
               href={company.socials.facebook}
               className="hover:text-brand-400 transition-colors"
               aria-label="Facebook"
             >
               <Facebook className="w-4 h-4" />
             </a>
             <a
               href={company.socials.instagram}
               className="hover:text-brand-400 transition-colors"
               aria-label="Instagram"
             >
               <Instagram className="w-4 h-4" />
             </a>
             <a
               href={company.socials.linkedin}
               className="hover:text-brand-400 transition-colors"
               aria-label="LinkedIn"
             >
               <Linkedin className="w-4 h-4" />
             </a>
             <a
               href={company.socials.youtube}
               className="hover:text-brand-400 transition-colors"
               aria-label="YouTube"
             >
               <Youtube className="w-4 h-4" />
             </a>
           </div>
        </div>
      </div>

      {/* Main nav */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass shadow-lg shadow-black/5 py-2"
            : "bg-white py-4"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          {/* Logo */}
            <a href="#home" className="flex items-center gap-4 group">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <img 
                  src="/logo-transparent.png" 
                  alt="Datafy Associates Logo" 
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="leading-tight">
                <span className="font-display font-bold text-2xl text-ink-900 block">
                  Datafy
                </span>
                <span className="text-xs tracking-[0.25em] uppercase text-brand-600 font-bold">
                  Associate
                </span>
              </div>
           </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() =>
                  item.children && setServicesOpen(true)
                }
                onMouseLeave={() =>
                  item.children && setServicesOpen(false)
                }
              >
                <a
                  href={item.href.startsWith("#") ? item.href : item.href}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-ink-800 hover:text-brand-600 hover:bg-brand-50/60 transition-colors"
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        servicesOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </a>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.children && servicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 top-full pt-2 w-64 z-50"
                    >
                      <div className="glass rounded-2xl shadow-xl shadow-black/10 border border-white/40 p-2 overflow-hidden">
                        {item.children.map((child: any) => (
                          <div key={child.label} className="relative group/sub">
                            <a
                              href={child.href.startsWith("#") ? child.href : child.href}
                              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-ink-800 hover:bg-brand-500 hover:text-white transition-colors"
                            >
                              {child.label}
                            </a>
                            {child.grandchildren && (
                              <div className="ml-2 pl-3 border-l border-brand-100">
                                {child.grandchildren.map((gc: any) => (
                                  <a
                                    key={gc.label}
                                    href={gc.href.startsWith("#") ? gc.href : gc.href}
                                    className="block px-4 py-2 rounded-xl text-sm text-ink-700 hover:text-brand-600 transition-colors"
                                  >
                                    {gc.label}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-lg"
            >
              {company.portalName} Login
            </a>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-ink-900"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-[85%] max-w-sm bg-white shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <span className="font-display font-bold text-lg">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid place-items-center w-9 h-9 rounded-lg bg-gray-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 flex flex-col gap-1">
                {nav.map((item) => (
                  <div key={item.label}>
                    <a
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-ink-800 hover:bg-brand-50"
                    >
                      {item.label}
                    </a>
                    {item.children && (
                      <div className="ml-3 pl-3 border-l-2 border-brand-100 mb-1">
                        {item.children.map((child: any) => (
                          <div key={child.label}>
                            <a
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className="block px-4 py-2 rounded-lg text-sm font-medium text-ink-700 hover:bg-brand-50"
                            >
                              {child.label}
                            </a>
                            {child.grandchildren?.map((gc: any) => (
                              <a
                                key={gc.label}
                                href={gc.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-4 py-2 ml-3 rounded-lg text-sm text-ink-600 hover:text-brand-600"
                              >
                                {gc.label}
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <a
                  href="#contact"
                  onClick={() => setMobileOpen(false)}
                  className="mt-3 inline-flex justify-center px-5 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold"
                >
                  {company.portalName} Login
                </a>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
