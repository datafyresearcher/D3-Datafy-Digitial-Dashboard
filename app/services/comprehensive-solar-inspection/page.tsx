import { Metadata } from "next";
import { ArrowLeft, ScanEye, Shield, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comprehensive Solar Inspection | Datafy Associate",
  description: "AI-powered drone inspections and GIS technology for accurate, fast, and efficient assessment of your solar infrastructure.",
};

const services = [
  {
    icon: ScanEye,
    title: "Drone Thermography",
    text: "High-resolution thermal imaging to detect hotspots, cell defects, and string-level anomalies.",
  },
  {
    icon: Shield,
    title: "GIS Integration",
    text: "Spatial data integration for precise asset localization and detailed site mapping.",
  },
  {
    icon: CheckCircle,
    title: "AI Diagnostics",
    text: "Automated anomaly detection using advanced machine learning algorithms.",
  },
  {
    icon: ScanEye,
    title: "Structural Assessment",
    text: "Visual inspections of mounting structures, panels, and electrical connections.",
  },
  {
    icon: Shield,
    title: "Compliance Audit",
    text: "Ensuring your installation meets all safety and performance regulatory standards.",
  },
  {
    icon: CheckCircle,
    title: "Data-Driven Reporting",
    text: "Comprehensive digital reports with GPS-enabled anomaly pinpointing.",
  },
];

const stats = [
  { value: "100%", label: "AI Accuracy" },
  { value: "2x", label: "Faster Detection" },
  { value: "0", label: "Manual Error" },
  { value: "Real-time", label: "Data Access" },
];

export default function InspectionPage() {
  return (
    <main className="min-h-screen">
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
              Comprehensive Solar Inspection
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Leverage AI-powered drone inspections and GIS technology for accurate, fast, and efficient assessment of your solar infrastructure.
            </p>
          </div>
        </div>
      </section>

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

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-4">Our Inspection Capability</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-ink-900">Cutting-Edge Assessment</h2>
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

      <section className="py-24 bg-ink-900 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">Precision at Every Level</h2>
              <p className="text-white/70 text-lg mb-8">Our inspections combine high-precision thermal imagery with advanced GIS data to provide a complete health assessment of your solar farm.</p>
              <ul className="space-y-4">
                {["Hotspot detection", "Bypass diode failure identification", "String current analysis", "Physical damage assessment"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-3xl overflow-hidden aspect-video">
               <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80" alt="Drone inspection" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-8">Ready for a full site audit?</h2>
          <Link href="/#contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-500 transition-all">
            Schedule Inspection <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
