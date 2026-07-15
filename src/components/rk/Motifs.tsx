"use client";

import { motion } from "framer-motion";

/**
 * RK Residency brand monogram — a stylized peacock + lotus emblem
 * rendered as inline SVG so it scales crisply and inherits currentColor.
 */
export function Logo({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-label="RK Residency"
    >
      {/* Outer jharokha arch */}
      <path
        d="M32 4 C20 4 12 12 12 24 L12 60 L52 60 L52 24 C52 12 44 4 32 4 Z"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        opacity="0.45"
      />
      {/* Peacock feather eye */}
      <ellipse cx="32" cy="26" rx="9" ry="12" fill="currentColor" opacity="0.18" />
      <ellipse cx="32" cy="26" rx="5.2" ry="7" fill="currentColor" opacity="0.5" />
      <circle cx="32" cy="26" r="2.4" fill="currentColor" />
      {/* Lotus base */}
      <path
        d="M16 48 C20 44 24 44 26 48 C28 44 30 44 32 48 C34 44 36 44 38 48 C40 44 44 44 48 48 L48 56 L16 56 Z"
        fill="currentColor"
        opacity="0.6"
      />
      {/* RK wordmark hint */}
      <text
        x="32"
        y="58"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="6"
        fontWeight="700"
        letterSpacing="0.8"
        fill="currentColor"
        opacity="0.9"
      >
        RK
      </text>
    </svg>
  );
}

/** Animated diya (oil lamp) — for hero accents & booking confirmation. */
export function Diya({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 48"
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
    >
      {/* Flame */}
      <motion.g
        style={{ originX: "20px", originY: "22px" }}
        animate={{ scale: [1, 0.97, 1.04, 0.98, 1], rotate: [0, -1.5, 1, -0.8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M20 4 C23 10 24 14 24 18 C24 22 22 24 20 24 C18 24 16 22 16 18 C16 14 17 10 20 4 Z"
          fill="url(#flameGrad)"
        />
      </motion.g>
      {/* Diya bowl */}
      <path
        d="M4 30 C4 36 12 42 20 42 C28 42 36 36 36 30 L34 30 C34 33 28 36 20 36 C12 36 6 33 6 30 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <ellipse cx="20" cy="30" rx="16" ry="3.4" fill="currentColor" opacity="0.45" />
      <defs>
        <linearGradient id="flameGrad" x1="20" y1="4" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBF6EC" />
          <stop offset="0.4" stopColor="#C7A250" />
          <stop offset="1" stopColor="#a8843a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Lotus line-art motif — used as section ornament. */
export function Lotus({ className = "", size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 4 C28 14 28 24 32 34 C36 24 36 14 32 4 Z" fill="currentColor" fillOpacity="0.15" />
        <path d="M32 10 C22 14 14 22 12 32 C22 32 30 30 32 26" fill="currentColor" fillOpacity="0.1" />
        <path d="M32 10 C42 14 50 22 52 32 C42 32 34 30 32 26" fill="currentColor" fillOpacity="0.1" />
        <path d="M32 18 C20 22 12 28 10 36 C22 36 30 34 32 30" />
        <path d="M32 18 C44 22 52 28 54 36 C42 36 34 34 32 30" />
      </g>
    </svg>
  );
}

/** Peacock feather — single decorative quill. */
export function PeacockFeather({ className = "", size = 60 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.8}
      viewBox="0 0 60 108"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M30 4 L30 100" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <ellipse cx="30" cy="22" rx="14" ry="18" fill="currentColor" opacity="0.12" />
      <ellipse cx="30" cy="22" rx="9" ry="12" fill="currentColor" opacity="0.35" />
      <ellipse cx="30" cy="22" rx="4.5" ry="6.5" fill="currentColor" opacity="0.75" />
      <circle cx="30" cy="22" r="1.8" fill="#0E4C4F" />
      {Array.from({ length: 18 }).map((_, i) => {
        const y = 40 + i * 3;
        const len = 14 - i * 0.6;
        return (
          <g key={i}>
            <path
              d={`M30 ${y} Q${22 - len * 0.4} ${y + 2} ${18 - len * 0.2} ${y + 4}`}
              stroke="currentColor"
              strokeWidth="0.6"
              opacity="0.4"
            />
            <path
              d={`M30 ${y} Q${38 + len * 0.4} ${y + 2} ${42 + len * 0.2} ${y + 4}`}
              stroke="currentColor"
              strokeWidth="0.6"
              opacity="0.4"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Marigold-garland section divider — a row of small flowers. */
export function SectionDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`}
      role="separator"
      aria-orientation="horizontal"
    >
      <span className="h-px w-12 bg-gradient-to-r from-transparent via-gold/60 to-gold/60" />
      <Lotus className="text-gold" size={22} />
      <span className="h-px w-3 bg-gold/40" />
      <Lotus className="text-gold" size={16} />
      <span className="h-px w-3 bg-gold/40" />
      <Lotus className="text-gold" size={22} />
      <span className="h-px w-12 bg-gradient-to-l from-transparent via-gold/60 to-gold/60" />
    </div>
  );
}

/** Small scroll-reveal wrapper using framer-motion. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px 0px -40px 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}

/** Animated counter that runs when scrolled into view. */
export function CountUp({
  end,
  suffix = "",
  prefix = "",
  duration = 1.8,
  className = "",
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        onViewportEnter={(entry) => {
          if (!entry) return;
          const node = entry.target as HTMLElement;
          const span = node.querySelector<HTMLElement>("[data-count]");
          if (!span || span.dataset.done === "1") return;
          span.dataset.done = "1";
          const start = performance.now();
          const animate = (now: number) => {
            const p = Math.min(1, (now - start) / (duration * 1000));
            const eased = 1 - Math.pow(1 - p, 3);
            const val = Math.round(end * eased);
            span.textContent = `${prefix}${val.toLocaleString("en-IN")}${suffix}`;
            if (p < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }}
      >
        <span data-count>{prefix}0{suffix}</span>
      </motion.span>
    </motion.span>
  );
}
