"use client";

import Marquee from "./ui/Marquee";

const partnerImages = [
  { src: "/partners/ENERTECH.png", alt: "EnerTech" },
  { src: "/partners/Nestle-logo.png", alt: "Nestlé" },
  { src: "/partners/Quaid E Azam Solar Private Limited.jpg", alt: "Quaid-e-Azam Solar" },
  { src: "/partners/Carrefour.png", alt: "Carrefour" },
  { src: "/partners/Sapphire.png", alt: "Sapphire" },
  { src: "/partners/Pepsi.png", alt: "Pepsi" },
  { src: "/partners/Servis_logo.png", alt: "Servis" },
  { src: "/partners/ALHussain-logo.png", alt: "Al Hussain" },
  { src: "/partners/Fatima Group.jpg", alt: "Fatima Group" },
  { src: "/partners/insights.png", alt: "Insights" },
];

export default function Partners() {
  return (
    <section className="py-16 bg-white border-y border-black/5">
      <div className="mx-auto max-w-7xl px-6 text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Our Trusted Partners
        </span>
      </div>
      <div className="flex overflow-hidden">
        <Marquee speed={40} reverse>
          {partnerImages.map((p) => (
            <div
              key={p.alt}
              className="mx-8 flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default"
            >
              <img
                src={p.src}
                alt={p.alt}
                className="h-12 w-auto object-contain"
              />
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
