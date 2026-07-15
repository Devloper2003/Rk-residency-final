"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, ArrowLeft, Calendar, Tag } from "lucide-react";
import { PageShell } from "../PageShell";
import { Reveal, Lotus } from "../Motifs";
import { useRouter } from "@/lib/router";

type BlogPost = {
  id: string; slug: string; title: string; excerpt: string; body: string;
  category: string; tags: string; imageUrl: string | null;
  publishedAt: string | null; readingMins: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  TEMPLE_GUIDE: "Temple Guide",
  FESTIVAL: "Festival",
  LOCAL_TIP: "Local Tip",
  EXPERIENCE: "Experience",
};

const CATEGORY_COLOR: Record<string, string> = {
  TEMPLE_GUIDE: "bg-teal/10 text-teal",
  FESTIVAL: "bg-marsala/10 text-marsala",
  LOCAL_TIP: "bg-gold/15 text-gold-deep",
  EXPERIENCE: "bg-charcoal/8 text-charcoal",
};

export function BlogListPage() {
  const navigate = useRouter((s) => s.navigate);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      });
  }, []);

  const cats = ["ALL", ...Array.from(new Set(posts.map((p) => p.category)))];
  const visible = filter === "ALL" ? posts : posts.filter((p) => p.category === filter);

  return (
    <PageShell
      title="The Braj Journal"
      subtitle="Temple guides, festival calendars, local tips and stories from Vrindavan — our primary organic-traffic engine. Written by our resident scholars and concierge team."
      accent="gold"
    >
      {/* Filters */}
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all focus-ring ${
              filter === c
                ? "border-teal bg-teal text-ivory"
                : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40 hover:text-teal"
            }`}
          >
            {c === "ALL" ? "All Stories" : CATEGORY_LABEL[c] || c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[360px] animate-pulse rounded-3xl bg-charcoal/5" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-charcoal/10 bg-white p-10 text-center">
          <Lotus size={32} className="mx-auto mb-3 text-gold" />
          <p className="font-display text-sm text-charcoal-soft">
            No stories yet in this category. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => {
            const tags: string[] = JSON.parse(p.tags || "[]");
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                onClick={() => navigate("blog-detail", p.slug)}
                className="group flex flex-col overflow-hidden rounded-3xl border border-charcoal/10 bg-white text-left shadow-sm transition-all hover:shadow-xl focus-ring"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={p.imageUrl || "/images/marigold-garland.jpg"}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
                  <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold ${CATEGORY_COLOR[p.category] || "bg-charcoal/8 text-charcoal"}`}>
                    {CATEGORY_LABEL[p.category] || p.category}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center gap-3 font-display text-[11px] uppercase tracking-wider text-charcoal-soft">
                    {p.publishedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {p.readingMins} min read
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold leading-snug text-charcoal">
                    {p.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 font-display text-sm leading-relaxed text-charcoal-soft">
                    {p.excerpt}
                  </p>
                  <div className="mt-auto pt-4">
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {tags.slice(0, 3).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-charcoal-soft">
                          <Tag className="h-2.5 w-2.5" />
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-1 font-display text-sm font-semibold text-teal">
                      Read story
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

export function BlogDetailPage({ slug }: { slug: string }) {
  const navigate = useRouter((s) => s.navigate);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blog?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setPost(data.post || null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/30 border-t-gold" />
      </div>
    );
  }
  if (!post) {
    return (
      <PageShell title="Story not found">
        <button
          onClick={() => navigate("blog")}
          className="rounded-full bg-teal px-5 py-2 font-semibold text-ivory"
        >
          All stories
        </button>
      </PageShell>
    );
  }

  const tags: string[] = JSON.parse(post.tags || "[]");

  return (
    <PageShell title={post.title} subtitle={post.excerpt} accent="gold">
      {/* Hero */}
      <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-3xl border-4 border-gold/20 shadow-xl">
        <img
          src={post.imageUrl || "/images/marigold-garland.jpg"}
          alt={post.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
        <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLOR[post.category] || "bg-charcoal/8 text-charcoal"}`}>
          {CATEGORY_LABEL[post.category] || post.category}
        </div>
      </div>

      {/* Meta */}
      <div className="mb-8 flex flex-wrap items-center gap-4 font-display text-xs text-charcoal-soft">
        {post.publishedAt && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-gold-deep" />
            {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-gold-deep" />
          {post.readingMins} min read
        </span>
      </div>

      {/* Body */}
      <article className="mx-auto max-w-3xl">
        <div className="prose prose-lg max-w-none font-display text-base leading-[1.85] text-charcoal-soft [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-charcoal [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2 [&_strong]:text-charcoal [&_strong]:font-semibold">
          {post.body.split("\n\n").map((para, i) => {
            // Simple paragraph rendering
            if (para.startsWith("## ")) {
              return <h2 key={i}>{para.replace(/^##\s+/, "")}</h2>;
            }
            if (para.startsWith("- ")) {
              const items = para.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.replace(/^-\s+/, ""));
              return (
                <ul key={i}>
                  {items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              );
            }
            return <p key={i}>{para}</p>;
          })}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-charcoal/10 pt-6">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-ivory-deep px-3 py-1 text-xs font-medium text-charcoal-soft">
                <Tag className="h-3 w-3 text-gold-deep" />
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Author / CTA */}
        <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal text-ivory font-serif text-lg font-bold">
              RK
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-charcoal">
                RK Residency Concierge
              </div>
              <p className="mt-1 font-display text-sm text-charcoal-soft">
                Our concierge team writes the Braj Journal from first-hand experience —
                most have lived in Vrindavan for over a decade. Questions about this story?
                Write to stay@rkresidency.in.
              </p>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="mt-10">
          <button
            onClick={() => navigate("blog")}
            className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-white px-4 py-2 font-display text-sm font-semibold text-charcoal-soft transition-all hover:border-teal hover:bg-teal hover:text-ivory"
          >
            <ArrowLeft className="h-4 w-4" />
            All stories
          </button>
        </div>
      </article>
    </PageShell>
  );
}
