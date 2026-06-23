import { Metadata } from "next";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/data";
import AnimatedText from "@/components/ui/AnimatedText";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | Datafy Associate`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-white">
      <section className="relative py-24 md:py-32 bg-ink-900 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blogs
          </Link>
          <AnimatedText
            text={post.title}
            as="h1"
            className="font-display font-bold text-3xl md:text-5xl leading-tight mb-6"
          />
          <div className="flex items-center justify-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {post.date}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {post.readTime}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" /> {post.author}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <img
            src={post.image}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-3xl mb-12 shadow-lg"
          />
          <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-p:text-ink-800/80 prose-strong:text-ink-900">
            {post.content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return <h2 key={i} className="text-2xl font-bold mt-10 mb-4">{line.slice(3)}</h2>;
              }
              if (line.startsWith("### ")) {
                return <h3 key={i} className="text-xl font-bold mt-8 mb-3">{line.slice(4)}</h3>;
              }
              if (line.startsWith("- **")) {
                const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                if (match) {
                  return (
                    <p key={i} className="mb-2">
                      <strong>{match[1]}</strong>: {match[2]}
                    </p>
                  );
                }
              }
              if (line.startsWith("- ")) {
                return <li key={i} className="ml-6 mb-1 list-disc">{line.slice(2)}</li>;
              }
              if (line.trim() === "") return <div key={i} className="h-4" />;
              return <p key={i} className="mb-4 leading-relaxed">{line}</p>;
            })}
          </div>

          <div className="mt-16 pt-8 border-t border-black/5 text-center">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to all articles
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
