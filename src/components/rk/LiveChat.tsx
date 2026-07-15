"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Headphones, Sparkles } from "lucide-react";
import { Reveal } from "./Motifs";

type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
  timestamp: number;
};

const QUICK_REPLIES = [
  { label: "Check availability", text: "I'd like to check room availability", action: "book" },
  { label: "Temple tour booking", text: "I want to book a temple tour", action: "tour" },
  { label: "Satvik dining?", text: "Tell me about the satvik dining", action: "dining" },
  { label: "Nearby temples", text: "Which temples are nearby?", action: "temples" },
  { label: "Call me back", text: "Please call me back", action: "contact" },
];

const BOT_RESPONSES: Record<string, string> = {
  book: "I'd be happy to help you check availability! Click the 'Check Availability' button at the top of the page, or call us at +91 565 234 5678. Our front desk is open 24 hours.",
  tour: "We offer four temple tours: Private Temple Circuit (₹2,500/day), Guided Walking Yatra (₹1,200), Yamuna Boat + Aarti (₹1,500), and Full-Day Braj Tour (₹4,500). Scroll down to the 'Book a Temple Tour' section to book online.",
  dining: "Our kitchen is strictly satvik — no onion, no garlic, no eggs. Daily breakfast is included with all rooms. The rooftop Yamuna Pavilion serves dinner under candlelight from 7-10 PM. Vegan and Jain options available on request.",
  temples: "Five sacred sites are within a 25-minute walk: Banke Bihari (0.6km), ISKCON (1.4km), Prem Mandir (2.1km), Nidhivan (0.9km), and Keshi Ghat for Yamuna Aarti (1.1km). Our concierge arranges reserved darshan passes.",
  contact: "Of course! Please share your phone number and a good time to call. Our concierge will reach out within 4 hours, 7 AM – 11 PM IST. You can also WhatsApp us at +91 98765 43210 for instant replies.",
  default: "Thank you for your message! Our concierge team will respond within 4 hours. For urgent matters, please call +91 565 234 5678 or WhatsApp +91 98765 43210.",
};

export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "bot",
      text: "Namaste 🙏 Welcome to RK Residency. I'm your virtual concierge. How can I help with your Braj yatra today?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [unreadHint, setUnreadHint] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnreadHint(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  const sendMessage = (text: string, action?: string) => {
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      text,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // Bot response after a short delay
    setTimeout(() => {
      const responseKey = action || "default";
      const botMsg: Message = {
        id: `b_${Date.now()}`,
        role: "bot",
        text: BOT_RESPONSES[responseKey] || BOT_RESPONSES.default,
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, botMsg]);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  return (
    <>
      {/* Floating chat button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-ivory shadow-lg shadow-teal/30 transition-all hover:bg-teal-deep"
        aria-label={open ? "Close chat" : "Open live chat"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {unreadHint && !open && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-gold/60" />
            <span className="relative h-3 w-3 rounded-full bg-gold" />
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-5 z-50 flex h-[480px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-charcoal/10 bg-ivory shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-charcoal/10 bg-teal px-5 py-4 text-ivory">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-ivory/10 text-gold">
                <Headphones className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="font-serif text-sm font-semibold">RK Residency Concierge</div>
                <div className="flex items-center gap-1.5 font-display text-[10px] text-ivory/70">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Online · replies in ~5 min
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-ivory/20 text-ivory/70 hover:bg-ivory/10"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-ivory-deep/20 p-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-teal text-ivory"
                        : "bg-white text-charcoal border border-charcoal/10"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="border-t border-charcoal/10 bg-ivory px-3 py-2">
                <div className="mb-1.5 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                  <Sparkles className="h-3 w-3 text-gold" />
                  Quick replies
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr.action}
                      onClick={() => sendMessage(qr.text, qr.action)}
                      className="rounded-full border border-teal/30 bg-white px-2.5 py-1 font-display text-[11px] font-medium text-teal transition-all hover:bg-teal hover:text-ivory"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-charcoal/10 bg-white p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 rounded-full border border-charcoal/15 bg-ivory-deep/30 px-4 py-2 font-display text-sm text-charcoal placeholder:text-charcoal/40 focus:border-teal focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal text-ivory transition-colors hover:bg-teal-deep disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
