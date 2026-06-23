"use client";

import Marquee from "./ui/Marquee";
import { partners } from "@/lib/data";

export default function Partners() {
  return (
    <section className="py-16 bg-white border-y border-black/5">
      <div className="mx-auto max-w-7xl px-6 text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Our Trusted Partners
        </span>
      </div>
      <div className="flex overflow-hidden">
        <Marquee speed={40}>
          {partners.map((p) => (
            <div
              key={p}
              className="mx-8 flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default"
            >
              <span className="font-display font-bold text-2xl text-ink-900 whitespace-nowrap">
                {p}
              </span>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
