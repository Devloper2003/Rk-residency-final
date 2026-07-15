"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Phone, Mail, MessageSquare, Send, Loader2,
  Clock, Navigation, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Reveal, Lotus, SectionDivider } from "./Motifs";
import { toast } from "sonner";

const CONTACT_INFO = [
  {
    icon: MapPin,
    label: "Address",
    lines: ["RK Residency, Parikrama Marg", "Vrindavan, Mathura", "Uttar Pradesh 281121, India"],
  },
  {
    icon: Phone,
    label: "Phone & WhatsApp",
    lines: ["+91 565 234 5678 (Front desk)", "+91 98765 43210 (Reservations)"],
  },
  {
    icon: Mail,
    label: "Email",
    lines: ["stay@rkresidency.in", "events@rkresidency.in (satsang & weddings)"],
  },
  {
    icon: Clock,
    label: "Reception",
    lines: ["Open 24 hours, 7 days", "Check-in 2:00 PM · Check-out 11:00 AM"],
  },
];

const NEARBY = [
  { name: "Banke Bihari Mandir", dist: "0.6 km" },
  { name: "ISKCON Sri Krishna Balaram", dist: "1.4 km" },
  { name: "Prem Mandir", dist: "2.1 km" },
  { name: "Nidhivan", dist: "0.9 km" },
  { name: "Keshi Ghat (Yamuna Aarti)", dist: "1.1 km" },
  { name: "Mathura Junction (railway)", dist: "12 km" },
  { name: "Agra Airport (Kheria)", dist: "65 km" },
  { name: "Indira Gandhi Intl. (DEL)", dist: "150 km" },
];

export function Contact() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "", topic: "GENERAL",
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      toast.success("Message sent", {
        description: "Our concierge will reply within 4 hours.",
      });
      setForm({ name: "", email: "", phone: "", subject: "", message: "", topic: "GENERAL" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again";
      toast.error("Send failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative bg-ivory py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-2 text-gold-deep">
              <Lotus size={18} />
              <span className="font-display text-xs uppercase tracking-[0.32em]">
                Contact &amp; Location
              </span>
              <Lotus size={18} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-charcoal sm:text-5xl lg:text-6xl">
              Begin your Braj journey
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl font-display text-base leading-relaxed text-charcoal-soft sm:text-lg">
              Whether you are planning a pilgrimage, a satsang retreat or a small
              wedding — write to us. Our concierge replies within four hours.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: contact info + map + nearby */}
          <Reveal>
            <div className="space-y-6">
              {/* Quick contact cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {CONTACT_INFO.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-2xl border border-charcoal/10 bg-white p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-teal/8 text-teal">
                        <c.icon className="h-4 w-4" />
                      </span>
                      <span className="font-serif text-sm font-semibold text-charcoal">
                        {c.label}
                      </span>
                    </div>
                    <div className="space-y-0.5 font-display text-xs leading-relaxed text-charcoal-soft">
                      {c.lines.map((l) => <div key={l}>{l}</div>)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Embedded map (OpenStreetMap iframe of Vrindavan) */}
              <div className="relative overflow-hidden rounded-2xl border border-charcoal/10 shadow-sm">
                <iframe
                  title="RK Residency location map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=77.6950%2C27.5650%2C77.7250%2C27.5850&layer=mapnik&marker=27.5756%2C77.7100"
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-charcoal/10 bg-white px-4 py-3">
                  <div className="font-display text-xs text-charcoal-soft">
                    Parikrama Marg · Vrindavan · 281121
                  </div>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Vrindavan%20Uttar%20Pradesh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 font-display text-xs font-semibold text-ivory transition-colors hover:bg-teal-deep"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Get directions
                  </a>
                </div>
              </div>

              {/* Nearby distances */}
              <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-marsala" />
                  <span className="font-serif text-sm font-semibold text-charcoal">
                    Distances from RK Residency
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {NEARBY.map((n) => (
                    <div
                      key={n.name}
                      className="flex items-center justify-between border-b border-charcoal/5 py-1.5 last:border-0"
                    >
                      <span className="font-display text-xs text-charcoal-soft">{n.name}</span>
                      <span className="font-serif text-xs font-semibold text-teal">{n.dist}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick WhatsApp + Call */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 font-serif text-sm font-semibold text-white transition-all hover:shadow-lg"
                >
                  <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Chat on WhatsApp
                </a>
                <a
                  href="tel:+915652345678"
                  className="group flex items-center justify-center gap-2 rounded-2xl bg-teal px-4 py-3 font-serif text-sm font-semibold text-ivory transition-all hover:bg-teal-deep hover:shadow-lg"
                >
                  <Phone className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Call front desk
                </a>
              </div>
            </div>
          </Reveal>

          {/* Right: contact form */}
          <Reveal delay={0.08}>
            <form
              onSubmit={onSubmit}
              className="rounded-3xl border border-charcoal/10 bg-white p-6 shadow-lg sm:p-8"
            >
              <h3 className="font-serif text-xl font-semibold text-charcoal">
                Send us a message
              </h3>
              <p className="mt-1 font-display text-xs text-charcoal-soft">
                Our concierge replies within 4 hours, 7 AM – 11 PM IST.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="c-name" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                    Full name *
                  </Label>
                  <Input id="c-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" className="bg-ivory-deep/30" />
                </div>
                <div>
                  <Label htmlFor="c-email" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                    Email *
                  </Label>
                  <Input id="c-email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="bg-ivory-deep/30" />
                </div>
                <div>
                  <Label htmlFor="c-phone" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                    Phone
                  </Label>
                  <Input id="c-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 …" className="bg-ivory-deep/30" />
                </div>
                <div>
                  <Label htmlFor="c-topic" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                    Topic
                  </Label>
                  <Select value={form.topic} onValueChange={(v) => setForm((f) => ({ ...f, topic: v }))}>
                    <SelectTrigger id="c-topic" className="bg-ivory-deep/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General enquiry</SelectItem>
                      <SelectItem value="BOOKING">Booking &amp; availability</SelectItem>
                      <SelectItem value="EVENTS">Satsang / wedding / events</SelectItem>
                      <SelectItem value="PRESS">Press &amp; partnerships</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="c-subject" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                  Subject *
                </Label>
                <Input id="c-subject" required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Janmashtami 2026 booking" className="bg-ivory-deep/30" />
              </div>

              <div className="mt-4">
                <Label htmlFor="c-message" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">
                  Message *
                </Label>
                <Textarea
                  id="c-message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Tell us about your travel plans, group size, festival preferences…"
                  className="resize-none bg-ivory-deep/30"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-teal to-teal-soft py-3 font-semibold text-ivory transition-all hover:from-teal-deep hover:to-teal disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send message
                  </>
                )}
              </Button>

              <p className="mt-3 text-center font-display text-[11px] text-charcoal-soft">
                <MessageSquare className="mr-1 inline h-3 w-3" />
                We respect your privacy — your details are never shared.
              </p>
            </form>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mt-16">
            <SectionDivider />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
