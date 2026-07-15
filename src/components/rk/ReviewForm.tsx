"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, Loader2, Check, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
import { toast } from "sonner";

export function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    guestName: "",
    guestLocation: "",
    rating: 5,
    title: "",
    body: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      toast.success("Thank you for your review!", {
        description: "It will appear publicly after our team approves it (usually within 24 hours).",
      });
      setSubmitted(true);
      setForm({ guestName: "", guestLocation: "", rating: 5, title: "", body: "" });
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again";
      toast.error("Submission failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative bg-ivory-deep py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <Quote className="h-4 w-4" />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Share Your Experience
              </span>
              <Quote className="h-4 w-4" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-2xl font-semibold leading-tight text-charcoal sm:text-3xl lg:text-4xl">
              Were you a guest at RK Residency?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-3 max-w-xl font-display text-sm leading-relaxed text-charcoal-soft">
              We would love to hear about your Braj yatra. Your review helps fellow
              devotees plan their pilgrimage and helps us serve better.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-8 text-center">
            {!open ? (
              <Button
                onClick={() => setOpen(true)}
                className="rounded-full bg-gradient-to-r from-teal to-teal-soft px-8 py-3 font-serif text-base font-semibold text-ivory transition-all hover:from-teal-deep hover:to-teal cta-glow"
              >
                <Star className="mr-2 h-5 w-5 fill-gold text-gold" />
                Write a review
              </Button>
            ) : (
              <p className="font-display text-xs text-charcoal-soft">
                Your review will be published after moderation (within 24 hours).
              </p>
            )}
          </div>
        </Reveal>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 rounded-3xl border border-teal/30 bg-white p-8 text-center shadow-lg"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-teal text-ivory"
                  >
                    <Check className="h-8 w-8" />
                  </motion.div>
                  <h3 className="font-serif text-xl font-semibold text-teal">
                    Dhanyavaad — thank you!
                  </h3>
                  <p className="mt-2 font-display text-sm text-charcoal-soft">
                    Your review has been received and will be published after moderation.
                  </p>
                </motion.div>
              ) : (
                <form
                  onSubmit={submit}
                  className="mt-8 rounded-3xl border border-charcoal/10 bg-white p-6 shadow-lg sm:p-8"
                >
                  {/* Rating */}
                  <div className="mb-5">
                    <Label className="mb-2 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                      Your rating
                    </Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, rating: star }))}
                          className="transition-transform hover:scale-110 focus-ring"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= form.rating
                                ? "fill-gold text-gold"
                                : "text-charcoal/20"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="rv-name" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        Your name *
                      </Label>
                      <Input
                        id="rv-name"
                        required
                        value={form.guestName}
                        onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                        placeholder="Anjali Mehta"
                        className="bg-ivory-deep/30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rv-loc" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        City / Country
                      </Label>
                      <Input
                        id="rv-loc"
                        value={form.guestLocation}
                        onChange={(e) => setForm((f) => ({ ...f, guestLocation: e.target.value }))}
                        placeholder="Mumbai, India"
                        className="bg-ivory-deep/30"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="rv-title" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                      Review title *
                    </Label>
                    <Input
                      id="rv-title"
                      required
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Felt like a pilgrimage and a five-star in one"
                      className="bg-ivory-deep/30"
                    />
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="rv-body" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                      Your review *
                    </Label>
                    <Textarea
                      id="rv-body"
                      required
                      rows={5}
                      minLength={20}
                      maxLength={2000}
                      value={form.body}
                      onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                      placeholder="Tell us about your stay — the room, the food, the temple visits, the staff…"
                      className="resize-none bg-ivory-deep/30"
                    />
                    <p className="mt-1 text-right font-display text-[10px] text-charcoal-soft">
                      {form.body.length} / 2000 characters
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-display text-[11px] text-charcoal-soft">
                      Reviews are moderated before publishing. We never share your email.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => setOpen(false)}
                        variant="outline"
                        className="rounded-full"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full bg-teal px-6 py-2.5 font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50"
                      >
                        {submitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" /> Submit review</>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <SectionDivider className="mt-16" />
      </div>
    </section>
  );
}
