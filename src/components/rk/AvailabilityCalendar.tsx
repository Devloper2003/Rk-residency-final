"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Check, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Motifs";
import { toast } from "sonner";

type BookedDate = {
  date: string; // YYYY-MM-DD
  roomsLeft: number;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date): boolean {
  return formatDate(a) === formatDate(b);
}

function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const d = formatDate(date);
  return d >= formatDate(start) && d <= formatDate(end);
}

/**
 * AvailabilityCalendar — shows a 2-month calendar for a room with booked dates
 * marked. Fetches booking data from /api/bookings/check for each date.
 * Actually, we fetch all bookings for the room for the next 90 days in a single
 * request to keep it efficient.
 */
export function AvailabilityCalendar({
  roomId,
  totalCount,
  onBookClick,
}: {
  roomId: string;
  totalCount: number;
  onBookClick: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [nextMonth, setNextMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  });
  const [bookedDates, setBookedDates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Fetch all bookings for this room for the next 90 days
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

    fetch(`/api/rooms/availability?roomId=${roomId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.availability) {
          setBookedDates(data.availability);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [roomId]);

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    // Don't go before current month
    const now = new Date();
    if (d < new Date(now.getFullYear(), now.getMonth(), 1)) return;
    setCurrentMonth(d);
    setNextMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const nextMonthFn = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
    setNextMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const renderMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Array<Date | null> = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }

    return (
      <div className="flex-1">
        <div className="mb-3 text-center font-serif text-lg font-semibold text-charcoal">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAY_NAMES.map((w) => (
            <div key={w} className="text-center font-display text-[10px] font-semibold uppercase tracking-wider text-charcoal-soft">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, i) => {
            if (!date) return <div key={i} />;
            const dateStr = formatDate(date);
            const isPast = date < today;
            const bookedCount = bookedDates[dateStr] || 0;
            const roomsLeft = Math.max(0, totalCount - bookedCount);
            const isSoldOut = roomsLeft === 0 && !isPast;
            const isLow = roomsLeft > 0 && roomsLeft <= 1 && !isPast;
            const isToday = isSameDay(date, today);

            return (
              <div
                key={i}
                className={`relative grid aspect-square place-items-center rounded-lg text-xs font-medium transition-all ${
                  isPast
                    ? "bg-ivory-deep/30 text-charcoal/30"
                    : isSoldOut
                    ? "bg-marsala/10 text-marsala line-through"
                    : isLow
                    ? "bg-gold/15 text-gold-deep hover:bg-gold/25"
                    : "bg-teal/8 text-teal hover:bg-teal hover:text-ivory"
                } ${isToday ? "ring-2 ring-gold ring-offset-1 ring-offset-ivory" : ""}`}
                title={
                  isPast
                    ? "Past date"
                    : isSoldOut
                    ? "Sold out"
                    : `${roomsLeft} room${roomsLeft === 1 ? "" : "s"} left`
                }
              >
                {date.getDate()}
                {isLow && !isPast && (
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-gold" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Reveal>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal" />
            <h3 className="font-serif text-lg font-semibold text-charcoal">
              Availability — next 90 days
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft transition-colors hover:bg-teal hover:text-ivory focus-ring"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonthFn}
              className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft transition-colors hover:bg-teal hover:text-ivory focus-ring"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-teal" />
          </div>
        ) : error ? (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-marsala" />
            <p className="font-display text-sm text-charcoal-soft">
              Unable to load availability. Please call us at +91 565 234 5678.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-8 sm:flex-row">
              {renderMonth(currentMonth)}
              {renderMonth(nextMonth)}
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 border-t border-charcoal/10 pt-4 font-display text-[11px] text-charcoal-soft">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-teal/15" />
                Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-gold/20" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" /> Low (1-2 left)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-marsala/15" />
                Sold out
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-4 w-4 rounded ring-2 ring-gold" />
                Today
              </span>
            </div>

            {/* CTA */}
            <Button
              onClick={onBookClick}
              className="cta-glow mt-5 w-full rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold py-3 font-serif text-base font-semibold text-charcoal hover:from-gold-deep hover:to-gold"
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              Check availability &amp; book
            </Button>
          </>
        )}
      </div>
    </Reveal>
  );
}
