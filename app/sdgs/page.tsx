import { Metadata } from "next";
import { CheckCircle, Globe, Leaf, Zap, Shield, Sun, ArrowRight } from "lucide-react";
import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedText from "@/components/ui/AnimatedText";

export const metadata: Metadata = {
  title: "SDGs | Datafy Associate",
  description: "Our commitment to sustainable development goals through clean energy and innovative technology.",
};

const sdgs = [
  {
    id: "7",
    title: "Affordable and Clean Energy",
    desc: "Supporting the global transition to renewable energy sources through optimized solar asset management.",
    icon: Sun,
  },
  {
    id: "9",
    title: "Industry, Innovation and Infrastructure",
    desc: "Driving technological advancement in the energy sector through AI and drone integration.",
    icon: Zap,
  },
  {
    id: "12",
    title: "Responsible Consumption and Production",
    desc: "Promoting efficient energy use and sustainable asset lifecycles through precise monitoring.",
    icon: Leaf,
  },
  {
    id: "13",
    title: "Climate Action",
    desc: "Directly contributing to the reduction of carbon emissions by maximizing clean energy output.",
    icon: Globe,
  },
];

export default function SDGsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative py-24 md:py-32 bg-brand-600 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <AnimatedSection>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-100 mb-4">Sustainability</span>
          </AnimatedSection>
          <AnimatedText
            text="Our Commitment to SDGs"
            as="h1"
            className="font-display font-bold text-4xl md:text-6xl mb-6"
          />
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            At Datafy Associate, we align our mission and operations with the United Nations Sustainable Development Goals to build a better future.
          </p>
        </div>
      </section>

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {sdgs.map((sdg) => (
              <AnimatedSection key={sdg.id} delay={0.1}>
                <div className="group p-10 rounded-[2.5rem] border border-black/5 bg-brand-50/30 hover:bg-white hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500">
                  <div className="flex items-start gap-6">
                    <div className="shrink-0 grid place-items-center w-16 h-16 rounded-2xl bg-white shadow-lg text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-500">
                      <sdg.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-brand-600 font-display font-bold text-sm uppercase tracking-widest mb-2">
                        Goal {sdg.id}
                      </div>
                      <h3 className="font-display font-bold text-2xl text-ink-900 mb-4">{sdg.title}</h3>
                      <p className="text-ink-800/70 leading-relaxed text-lg">{sdg.desc}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-900 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <AnimatedSection>
            <h2 className="font-display font-bold text-3xl md:text-5xl mb-8">Driving the Transition</h2>
            <p className="text-white/70 text-xl leading-relaxed mb-12">
              By maximizing the efficiency of existing solar infrastructure, we help accelerate the decarbonization of the global power grid and support the planet's most critical environmental goals.
            </p>
            <Link href="/#contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-400 transition-all">
              Partner with Us <ArrowRight className="w-5 h-5" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
