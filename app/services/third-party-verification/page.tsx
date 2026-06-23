import { Metadata } from "next";
import { ArrowLeft, Shield, Award, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Third Party Verification | Datafy Associate",
  description: "Get unbiased, professional evaluation of your solar systems to ensure quality, safety, and compliance with industry standards.",
};

const verifications = [
  {
    icon: Shield,
    title: "System Compliance",
    text: "Ensure your installation meets all local and international electrical and structural safety codes.",
  },
  {
    icon: Award,
    title: "Quality Assurance",
    text: "Verify component quality and installation integrity against manufacturer specifications.",
  },
  {
    icon: CheckCircle,
    title: "Performance Audit",
    text: "Independent assessment of actual vs. expected energy yield and system performance.",
  },
  {
    icon: Shield,
    title: "Safety Audits",
    text: "Comprehensive safety assessments to mitigate operational and environmental risks.",
  },
];

const stats = [
  { value: "100%", label: "Unbiased Reports" },
  { value: "Certified", label: "Standards Compliant" },
  { value: "Zero", label: "Conflict of Interest" },
  { value: "Fast", label: "Audit Turnaround" },
];

export default function VerificationPage() {
  return (
    <main className="min-h-screen">
      <section className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-7xl px-6">
          <Link href="/#services" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 mb-4">Solar Services</span>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-tight mb-6">
              Third Party Verification Services
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              Get unbiased, professional evaluation of your solar systems to ensure quality, safety, and compliance with industry standards.
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
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-4">Our Audit Scope</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-ink-900">Ensuring Integrity & Compliance</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {verifications.map((v) => (
              <div key={v.title} className="group p-8 rounded-2xl border border-black/5 bg-white hover:shadow-xl hover:shadow-brand-500/10 transition-all">
                <div className="grid place-items-center w-14 h-14 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all mb-6">
                  <v.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{v.title}</h3>
                <p className="text-ink-800/70">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-900 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
               <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
                  <img src="https://images.unsplash.com/photo-1558444479-c86e4304709a?auto=format&fit=crop&w=1200&q=80" alt="Verification" className="w-full h-full object-cover" />
               </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">Unbiased Expertise You Can Trust</h2>
              <p className="text-white/70 text-lg mb-8">Our verification services provide an independent layer of security for investors, asset owners, and lenders, ensuring that all systems are built and operating exactly as promised.</p>
              <ul className="space-y-4">
                {["Compliance documentation", "Performance benchmarking", "Financial risk mitigation", "Lifecycle analysis"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-8">Request a Compliance Audit</h2>
          <Link href="/#contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-500 transition-all">
            Contact Our Experts <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
