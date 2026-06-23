import { Metadata } from "next";
import { ArrowLeft, Map as MapIcon, Navigation, Layers, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Topographical Mapping | Datafy Associate",
  description: "Precise drone survey and mapping services for efficient, reliable and affordable aerial insights.",
};

const mappingFeatures = [
  {
    icon: Navigation,
    title: "High-Resolution Orthomosaics",
    text: "Create highly accurate, large-scale aerial maps with centimeter-level precision for detailed site analysis.",
  },
  {
    icon: Layers,
    title: "Digital Elevation Models (DEM/DSM)",
    text: "Detailed terrain modeling to analyze landscape changes, water flow, and construction site preparedness.",
  },
  {
    icon: Zap,
    title: "Rapid Site Surveying",
    text: "Cover large areas in a fraction of the time required for traditional ground surveying, reducing costs and risks.",
  },
  {
    icon: MapIcon,
    title: "Asset Management Data",
    text: "Integrated geospatial data to support long-term asset management and operational decision-making.",
  },
];

const stats = [
  { value: "cm", label: "Accuracy Level" },
  { value: "10x", label: "Faster than Ground" },
  { value: "100%", label: "Data Coverage" },
  { value: "4K", label: "Image Resolution" },
];

export default function TopoMappingPage() {
  return (
    <main className="min-h-screen">
      <section className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-7xl px-6">
          <Link href="/#services" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 mb-4">Aerial Solutions</span>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-tight mb-6">
              Topographical Mapping
            </h1>
            <p className="text-xl text-white/70 leading-relaxed">
              We deliver precise aerial insights through efficient, affordable and reliable drone survey & mapping.
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
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-4">Mapping Capability</span>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-ink-900">Precise Aerial Intelligence</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mappingFeatures.map((f) => (
              <div key={f.title} className="group p-8 rounded-2xl border border-black/5 bg-white hover:shadow-xl hover:shadow-brand-500/10 transition-all">
                <div className="grid place-items-center w-14 h-14 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all mb-6">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 mb-3">{f.title}</h3>
                <p className="text-ink-800/70">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-900 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
               <div className="relative rounded-3xl overflow-hidden aspect-video">
                  <img src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80" alt="Mapping" className="w-full h-full object-cover" />
               </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">Optimized Site Planning</h2>
              <p className="text-white/70 text-lg mb-8">Our topographical mapping services provide the foundational data required for construction, erosion control, and large-scale asset management projects.</p>
              <ul className="space-y-4">
                {["3D Terrain Modeling", "Boundary Verification", "Volume Calculations", "Hydrological Analysis"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Navigation className="w-5 h-5 text-brand-400" />
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
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-8">Ready to map your terrain?</h2>
          <Link href="/#contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-500 transition-all">
            Get Aerial Insights <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
