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
import { useSettingValue, useContentValue } from "@/lib/site-content";
import { BUSINESS, businessAddress } from "@/lib/site.config";
import {
  googleMapsEmbedUrl,
  sanitizeWhatsapp,
  sanitizeContactText,
  sanitizeDirectionsUrl,
} from "@/lib/use-contact-info";

export function Contact() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "", topic: "GENERAL",
  });
  const [submitting, setSubmitting] = useState(false);

  // Live editable contact info — fallbacks from site.config BUSINESS (TODO
  // values; DB settings win when present, no dummy data invented in code).
  // Placeholder/dummy values are stripped so empty details HIDE instead of
  // rendering dead links.
  const phoneDisplay = sanitizeContactText(useSettingValue("phone_primary", BUSINESS.phonePrimary));
  const phoneTel = sanitizeContactText(useSettingValue("phone_primary_tel", BUSINESS.phonePrimaryTel));
  const phoneReservations = sanitizeContactText(useSettingValue("phone_reservations", BUSINESS.phoneReservations));
  const emailPrimary = sanitizeContactText(useSettingValue("email_primary", BUSINESS.emailPrimary));
  const emailEvents = sanitizeContactText(useSettingValue("email_events", ""));
  // Address from site.config BUSINESS.address — same as footer + JSON-LD.
  const addr = businessAddress();
  const addrLine1 = useSettingValue("address_line1", addr.line1);
  const addrLine2 = useSettingValue("address_line2", addr.line2);
  const addrLine3 = useSettingValue("address_line3", addr.line3);
  // Google Maps embed of the exact hotel location (was OpenStreetMap).
  const mapEmbedUrl = useSettingValue("map_embed_url", googleMapsEmbedUrl());
  const mapDirectionsUrl = sanitizeDirectionsUrl(useSettingValue("map_directions_url", ""));
  const gbpUrl = BUSINESS.maps.googleBusinessProfile || BUSINESS.reviews.google;
  const whatsappNumberRaw = useSettingValue("whatsapp_number", BUSINESS.whatsappNumber);
  const whatsappNumber = sanitizeWhatsapp(whatsappNumberRaw);
  const whatsappPrefill = useContentValue("contact.whatsapp_prefill_text", "I would like to enquire about availability at RK Residency");
  const checkinTime = useSettingValue("checkin_time", "2:00 PM");
  const checkoutTime = useSettingValue("checkout_time", "11:00 AM");
  const conciergeHours = useSettingValue("concierge_hours", "7 AM – 11 PM IST");
  // Distances come from site.config BUSINESS.distances — the SAME single
  // source as the homepage "Distances from RK Residency" section.
  const nearby = Object.values(BUSINESS.distances)
    .filter((d) => d && d.km && d.time)
    .map((d) => ({ name: d.label, distance: `${d.km} km`, time: d.time }));

  const CONTACT_INFO = [
    {
      icon: MapPin,
      label: "Address",
      lines: [addrLine1, addrLine2, addrLine3],
    },
    {
      icon: Phone,
      label: "Phone & WhatsApp",
      // Only real, filled-in numbers are shown — placeholders hide.
      lines: [
        phoneDisplay ? `${phoneDisplay} (Front desk)` : "",
        phoneReservations ? `${phoneReservations} (Reservations)` : "",
      ].filter(Boolean),
    },
    {
      icon: Mail,
      label: "Email",
      lines: [emailPrimary, emailEvents ? `${emailEvents} (satsang & weddings)` : ""].filter(Boolean),
    },
    {
      icon: Clock,
      label: "Reception",
      lines: ["Open 24 hours, 7 days", `Check-in ${checkinTime} · Check-out ${checkoutTime}`],
    },
  ].filter((c) => c.lines.length > 0);

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
        description: `Our concierge will reply within ${conciergeHours}.`,
      });
      setForm({ name: "", email: "", phone: "", subject: "", message: "", topic: "GENERAL" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again";
      toast.error("Send failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // WhatsApp URL with prefill text — empty when no real number is set
  // (the button below hides itself in that case rather than dead-linking).
  const waUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappPrefill)}`
    : "";

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

              {/* Embedded map */}
              <div className="relative overflow-hidden rounded-2xl border border-charcoal/10 shadow-sm">
                <iframe
                  title="RK Residency location map"
                  src={mapEmbedUrl}
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-charcoal/10 bg-white px-4 py-3">
                  <div className="font-display text-xs text-charcoal-soft">
                    {addrLine1} · {addrLine2} · {addrLine3}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {gbpUrl && (
                      <a
                        href={gbpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-white px-3 py-1.5 font-display text-xs font-semibold text-gold-deep transition-colors hover:bg-gold/10"
                      >
                        View on Google
                      </a>
                    )}
                    {mapDirectionsUrl && (
                      <a
                        href={mapDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 font-display text-xs font-semibold text-ivory transition-colors hover:bg-teal-deep"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Get directions
                      </a>
                    )}
                  </div>
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
                  {nearby.map((n) => (
                    <div
                      key={n.name}
                      className="flex items-center justify-between border-b border-charcoal/5 py-1.5 last:border-0"
                    >
                      <span className="font-display text-xs text-charcoal-soft">{n.name}</span>
                      <span className="font-serif text-xs font-semibold text-teal">{n.distance}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick WhatsApp + Call — each button hides when the real
                  detail is not set yet (no dead links on the site). */}
              {(waUrl || phoneTel) && (
                <div className="grid grid-cols-2 gap-3">
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 font-serif text-sm font-semibold text-white transition-all hover:shadow-lg"
                    >
                      <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                      Chat on WhatsApp
                    </a>
                  )}
                  {phoneTel && (
                    <a
                      href={`tel:${phoneTel}`}
                      className={`group flex items-center justify-center gap-2 rounded-2xl bg-teal px-4 py-3 font-serif text-sm font-semibold text-ivory transition-all hover:bg-teal-deep hover:shadow-lg ${waUrl ? "" : "col-span-2"}`}
                    >
                      <Phone className="h-4 w-4 transition-transform group-hover:scale-110" />
                      Call front desk
                    </a>
                  )}
                </div>
              )}
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
                Our concierge replies within 4 hours, {conciergeHours}.
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
