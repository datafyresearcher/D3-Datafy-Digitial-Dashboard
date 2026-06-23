"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { company } from "@/lib/data";
import AnimatedSection from "./ui/AnimatedSection";
import AnimatedText from "./ui/AnimatedText";

export default function CTA() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <section id="contact" className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/15 blur-[150px]" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <AnimatedText
            text="Thank You! Your message has been sent."
            as="h2"
            className="font-display font-bold text-3xl md:text-5xl leading-tight text-white mb-6"
          />
          <p className="text-white/70 text-lg mb-10">
            We have received your inquiry and will get back to you shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ fullName: "", email: "", subject: "", message: "" });
            }}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all"
          >
            Send Another Message
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/15 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <AnimatedSection>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 mb-4">
                Get In Touch
              </span>
            </AnimatedSection>
            <AnimatedText
              text="Reach Out to Us - We are Here to Help"
              as="h2"
              className="font-display font-bold text-3xl md:text-5xl leading-tight text-white mb-6 text-balance"
            />
            <AnimatedSection delay={0.2}>
              <p className="text-white/70 leading-relaxed mb-10 text-lg">
                Interested in a deep dive into your site insights? Reach out to us or schedule a call to talk to our experts.
              </p>
            </AnimatedSection>

            <div className="space-y-6">
              {[
                { icon: Mail, text: company.email, href: `mailto:${company.email}` },
                { icon: Phone, text: company.phone, href: `tel:${company.phone}` },
                { icon: MapPin, text: company.address, href: "#" },
              ].map((item) => (
                <motion.a
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  href={item.href}
                  className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-500/30 transition-all"
                >
                  <div className="grid place-items-center w-11 h-11 rounded-xl bg-brand-500/20 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-white/80">{item.text}</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Right: Form/Visual */}
          <AnimatedSection direction="right">
            <form 
              onSubmit={handleSubmit}
              className="relative rounded-3xl bg-white/5 border border-white/10 p-8"
            >
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <input
                  required
                  name="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-brand-500 focus:outline-none transition-colors"
                />
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
              <input
                name="subject"
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-brand-500 focus:outline-none transition-colors mb-4"
              />
              <textarea
                required
                name="message"
                placeholder="Message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-brand-500 focus:outline-none transition-colors resize-none mb-4"
              />
              {error && (
                <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
              )}
              <button 
                type="submit"
                disabled={sending}
                className="w-full group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Message"} 
                {!sending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
