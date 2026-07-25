"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, Footprints, Ship, Calendar, Users, Send, Loader2, Check,
  Sparkles, Clock, MapPin, IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Reveal, Lotus, SectionDivider, Diya } from "./Motifs";
import { toast } from "sonner";

type TourType = "TEMPLE_CIRCUIT" | "WALKING_YATRA" | "YAMUNA_BOAT" | "GUIDED_FULL_DAY";

const TOURS: Array<{
  id: TourType; name: string; price: string; duration: string; icon: React.ComponentType<{ className?: string }>;
  description: string; highlights: string[];
}> = [
  {
    id: "TEMPLE_CIRCUIT",
    name: "Private Temple Circuit",
    price: "₹2,500",
    duration: "Full day",
    icon: Car,
    description: "Air-conditioned car with driver. Covers Banke Bihari, ISKCON, Prem Mandir, Nidhivan and Keshi Ghat.",
    highlights: ["AC car with driver", "All major temples", "Flexible timing", "English/Hindi driver"],
  },
  {
    id: "WALKING_YATRA",
    name: "Guided Walking Yatra",
    price: "₹1,200",
    duration: "2-3 hours",
    icon: Footprints,
    description: "Walk with a resident Vrindavan scholar who has lived here for 18+ years. Deep, intimate, devotional.",
    highlights: ["Resident scholar guide", "Hidden temple spots", "Stories & history", "Small groups (max 6)"],
  },
  {
    id: "YAMUNA_BOAT",
    name: "Yamuna Boat + Aarti",
    price: "₹1,500",
    duration: "1.5 hours",
    icon: Ship,
    description: "Private rowboat on the Yamuna during sunset aarti. Float your own diya offering on the river.",
    highlights: ["Private rowboat", "Sunset aarti from water", "Diya offering included", "Best photo opportunity"],
  },
  {
    id: "GUIDED_FULL_DAY",
    name: "Full-Day Guided Braj Tour",
    price: "₹4,500",
    duration: "8-10 hours",
    icon: Sparkles,
    description: "The complete Braj experience — Vrindavan, Mathura (Krishna Janmabhoomi), Barsana, Nandgaon, Goverdhan.",
    highlights: ["AC car + scholar guide", "Vrindavan + Mathura + Barsana", "Goverdhan parikrama", "Lunch included"],
  },
];

export function TempleTour() {
  const [selectedTour, setSelectedTour] = useState<TourType>("TEMPLE_CIRCUIT");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", date: "", guests: 2,
    language: "ENGLISH" as "ENGLISH" | "HINDI", specialRequests: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tour-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: new Date(form.date).toISOString(),
          tourType: selectedTour,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      toast.success("Tour booking received!", {
        description: "Our concierge will confirm within 4 hours via email or WhatsApp.",
      });
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", date: "", guests: 2, language: "ENGLISH", specialRequests: "" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again";
      toast.error("Booking failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="temple-tour" className="relative bg-ivory-deep py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <MapPin className="h-4 w-4" />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Book a Temple Tour
              </span>
              <MapPin className="h-4 w-4" />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-4xl lg:text-5xl">
              Let our concierge guide your Braj yatra
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl font-display text-sm leading-relaxed text-charcoal-soft sm:text-base">
              From a private AC temple circuit to a full-day Braj tour with a resident
              scholar — we arrange it all. Book below and our concierge confirms within
              4 hours.
            </p>
          </Reveal>
        </div>

        {/* Tour options */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOURS.map((tour, i) => {
            const sel = selectedTour === tour.id;
            return (
              <Reveal key={tour.id} delay={i * 0.06}>
                <button
                  onClick={() => setSelectedTour(tour.id)}
                  className={`group flex h-full w-full flex-col rounded-3xl border p-5 text-left transition-all focus-ring ${
                    sel
                      ? "border-gold bg-white shadow-lg"
                      : "border-charcoal/10 bg-white/60 hover:border-teal/30 hover:bg-white"
                  }`}
                  aria-pressed={sel}
                >
                  <div className={`mb-3 grid h-12 w-12 place-items-center rounded-full transition-colors ${
                    sel ? "bg-teal text-ivory" : "bg-teal/8 text-teal group-hover:bg-teal group-hover:text-ivory"
                  }`}>
                    <tour.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-base font-semibold text-charcoal">{tour.name}</h3>
                  <div className="mt-1 flex items-center gap-2 font-display text-xs text-charcoal-soft">
                    <IndianRupee className="h-3 w-3" />
                    <span className="font-serif text-lg font-bold text-teal">{tour.price}</span>
                    <span>·</span>
                    <Clock className="h-3 w-3" />
                    {tour.duration}
                  </div>
                  <p className="mt-2 font-display text-xs leading-relaxed text-charcoal-soft">{tour.description}</p>
                  <ul className="mt-3 space-y-1">
                    {tour.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-1.5 font-display text-[11px] text-charcoal-soft">
                        <Check className={`mt-0.5 h-3 w-3 shrink-0 ${sel ? "text-teal" : "text-gold-deep"}`} />
                        {h}
                      </li>
                    ))}
                  </ul>
                  {sel && (
                    <motion.div
                      layoutId="tour-selected"
                      className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-gold/15 px-2.5 py-0.5 font-display text-[10px] font-semibold text-gold-deep"
                    >
                      <Check className="h-3 w-3" /> Selected
                    </motion.div>
                  )}
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* Booking form */}
        <Reveal delay={0.1}>
          <div className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-lg sm:p-8">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <Diya size={64} className="mb-4 text-gold" />
                  <h3 className="font-serif text-xl font-semibold text-teal">Tour booking received</h3>
                  <p className="mt-2 max-w-md font-display text-sm text-charcoal-soft">
                    Our concierge will confirm your tour within 4 hours via email or WhatsApp.
                    We look forward to guiding your Braj yatra.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="mt-5 rounded-full"
                  >
                    Book another tour
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={submit}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="tb-name" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        Full name *
                      </Label>
                      <Input id="tb-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Anjali Mehta" className="bg-ivory-deep/30" />
                    </div>
                    <div>
                      <Label htmlFor="tb-email" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        Email *
                      </Label>
                      <Input id="tb-email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="anjali@example.com" className="bg-ivory-deep/30" />
                    </div>
                    <div>
                      <Label htmlFor="tb-phone" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        Phone / WhatsApp *
                      </Label>
                      <Input id="tb-phone" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className="bg-ivory-deep/30" />
                    </div>
                    <div>
                      <Label htmlFor="tb-date" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        Preferred date *
                      </Label>
                      <Input id="tb-date" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="bg-ivory-deep/30" />
                    </div>
                    <div>
                      <Label htmlFor="tb-guests" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        Number of guests
                      </Label>
                      <Input id="tb-guests" type="number" min={1} max={20} value={form.guests} onChange={(e) => setForm((f) => ({ ...f, guests: parseInt(e.target.value) || 1 }))} className="bg-ivory-deep/30" />
                    </div>
                    <div>
                      <Label htmlFor="tb-lang" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        Guide language
                      </Label>
                      <Select value={form.language} onValueChange={(v) => setForm((f) => ({ ...f, language: v as "ENGLISH" | "HINDI" }))}>
                        <SelectTrigger id="tb-lang" className="bg-ivory-deep/30"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ENGLISH">English</SelectItem>
                          <SelectItem value="HINDI">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tb-req" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                      Special requests (optional)
                    </Label>
                    <Textarea id="tb-req" rows={3} value={form.specialRequests} onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))} placeholder="Elderly guests, specific temples, wheelchair access…" className="resize-none bg-ivory-deep/30" />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-display text-[11px] text-charcoal-soft">
                      No payment required now. Pay your guide directly after the tour.
                    </p>
                    <Button type="submit" disabled={submitting} className="cta-glow rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold px-8 py-3 font-serif text-base font-semibold text-charcoal hover:from-gold-deep hover:to-gold disabled:opacity-50">
                      {submitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" /> Book this tour</>
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <SectionDivider className="mt-16" />
      </div>
    </section>
  );
}
