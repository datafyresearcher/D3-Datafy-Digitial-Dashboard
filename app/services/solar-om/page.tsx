import { Metadata } from "next";
import { ArrowLeft, Sun, Zap, Shield, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Solar O&M Services | Datafy Associate",
  description: "Expert solar operations and maintenance services for peak performance and long-term reliability of your solar assets.",
};

const services = [
  {
    icon: Sun,
    title: "Preventive Maintenance",
    text: "Scheduled inspections, cleaning, and component testing to prevent failures before they occur.",
  },
  {
    icon: Zap,
    title: "Corrective Maintenance",
    text: "Rapid response repair services for inverters, trackers, and electrical systems.",
  },
  {
    icon: Shield,
    title: "Performance Monitoring",
    text: "24/7 NOC monitoring with real-time alerts and performance analytics.",
  },
  {
    icon: CheckCircle,
    title: "Vegetation Management",
    text: "Site clearing and vegetation control to prevent shading and fire hazards.",
  },
  {
    icon: Sun,
    title: "Module Cleaning",
    text: "Automated and manual cleaning solutions optimized for water efficiency.",
  },
  {
    icon: Zap,
    title: "Thermal Imaging",
    text: "Drone-based thermal inspections to detect hotspots and string failures.",
  },
];

const stats = [
  { value: "99.5%", label: "Uptime Guarantee" },
  { value: "< 4hr", label: "Response Time" },
  { value: "24/7", label: "NOC Monitoring" },
  { value: "500+ MW", label: "Under Management" },
];

export default function SolarOMPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-500/20 blur-[150px]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <Link href="/#services" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 mb-4">Solar Services</span>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-tight mb-6">
              Solar O & M Services
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Ensure peak performance and long-term reliability with our expert operations and maintenance services tailored for solar assets.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-brand-50/30 border-y border-black/5">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display font-bold text-3xl md:text-4xl gradient-text">{s.value}</div>
              <div className="text-sm text-ink-800/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-4">Our O&M Scope</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-ink-900">Comprehensive Maintenance Solutions</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((svc) => (
              <div key={svc.title} className="group p-8 rounded-2xl border border-black/5 bg-white hover:shadow-xl hover:shadow-brand-500/10 transition-all">
                <div className="grid place-items-center w-14 h-14 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all mb-6">
                  <svc.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{svc.title}</h3>
                <p className="text-ink-800/70">{svc.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-ink-900 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 mb-4">Our Process</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl">Streamlined O&M Workflow</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Assessment", text: "Comprehensive site audit and baseline performance analysis" },
              { step: "02", title: "Planning", text: "Customized maintenance schedule and resource allocation" },
              { step: "03", title: "Execution", text: "Scheduled preventive and predictive maintenance activities" },
              { step: "04", title: "Reporting", text: "Detailed performance reports with actionable insights" },
            ].map((item) => (
              <div key={item.title} className="relative p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="font-display font-bold text-4xl text-brand-500/50 mb-4">{item.step}</div>
                <h3 className="font-display font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-600 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">Ready to Optimize Your Solar Assets?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">Partner with Datafy Associate for industry-leading O&M services that maximize uptime and ROI.</p>
          <Link href="/#contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-600 font-bold hover:bg-brand-50 transition-colors">
            Get a Custom Quote <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
