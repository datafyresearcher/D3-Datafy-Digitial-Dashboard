import { Metadata } from "next";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import AnimatedText from "@/components/ui/AnimatedText";

export const metadata: Metadata = {
  title: "Blogs | Datafy Associate",
  description: "Insights, news, and expertise on solar energy, drone technology, and geospatial mapping.",
};

const posts = [
  {
    title: "The Future of Solar Asset Management: AI & Drones",
    excerpt: "How machine learning is revolutionizing the way we maintain large-scale solar installations.",
    date: "Jun 20, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80",
    author: "Expert Team",
  },
  {
    title: "Drone Thermography: Identifying the Invisible",
    excerpt: "A deep dive into how thermal imaging uncovers critical hotspots and electrical faults.",
    date: "Jun 15, 2026",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    author: "Engineering Dept",
  },
  {
    title: "Why Accurate Topographical Data Matters",
    excerpt: "Understanding the critical role of terrain modeling in large-scale construction and solar projects.",
    date: "Jun 10, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    author: "Geospatial Team",
  },
  {
    title: "Maximizing ROI through Predictive Maintenance",
    excerpt: "Shifting from reactive to proactive maintenance using real-time IoT and drone data.",
    date: "Jun 05, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    author: "Data Analyst",
  },
];

export default function BlogsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <AnimatedSection>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 mb-4">Insights & News</span>
          </AnimatedSection>
          <AnimatedText
            text="Datafy Insights"
            as="h1"
            className="font-display font-bold text-4xl md:text-6xl mb-6"
          />
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Stay updated with the latest trends in solar energy, drone technology, and geospatial intelligence.
          </p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-10">
            {posts.map((post, i) => (
              <AnimatedSection key={i} delay={i * 0.1} direction="up">
                <Link href="#" className="group block">
                  <div className="flex flex-col md:flex-row gap-8 p-6 rounded-3xl border border-black/5 hover:shadow-2xl hover:shadow-black/5 transition-all">
                    <div className="relative w-full md:w-1/3 aspect-[4/3] md:aspect-square overflow-hidden rounded-2xl">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col justify-center md:w-2/3">
                      <div className="flex items-center gap-4 text-xs text-ink-800/50 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {post.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {post.readTime}
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-xl md:text-2xl text-ink-900 mb-3 group-hover:text-brand-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-ink-800/70 mb-4 line-clamp-2 text-sm">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-brand-600 font-semibold text-sm">
                        Read Full Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-brand-50/30 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h3 className="font-display font-bold text-2xl text-ink-900 mb-4">Don't miss any updates</h3>
          <p className="text-ink-800/70 mb-8">Subscribe to our newsletter to receive the latest industry insights directly in your inbox.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:border-brand-500"
            />
            <button className="px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
