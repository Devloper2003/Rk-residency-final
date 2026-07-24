"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Search, ArrowDownToLine, ArrowUpFromLine, IndianRupee, X,
  RefreshCw, Inbox, Clock, Users, Filter, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, LoadingSpinner, ErrorState } from "./_shared";
import { refreshSiteContent } from "@/lib/site-content";
import { ActionBtn } from "./_shared";
import { BookingDetailModal } from "./BookingDetailModal";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-teal/10 text-teal border-teal/30",
  CHECKED_IN: "bg-gold/15 text-gold-deep border-gold/40",
  CHECKED_OUT: "bg-charcoal/10 text-charcoal-soft border-charcoal/20",
  CANCELLED: "bg-marsala/10 text-marsala border-marsala/30",
  NO_SHOW: "bg-marsala/10 text-marsala border-marsala/30",
};
const PAY_COLORS: Record<string, string> = {
  PAID: "bg-teal/10 text-teal border-teal/30",
  PENDING: "bg-gold/15 text-gold-deep border-gold/40",
  REFUNDED: "bg-marsala/10 text-marsala border-marsala/30",
};

export function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const reload = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError(false);
    const data = await adminApi.get("bookings", {
      status: statusFilter,
      search,
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    setRefreshing(false);
    setLoading(false);
    if (!data) { setError(true); return; }
    setBookings(data.bookings || []);
    setTotal(data.total || 0);
    setLastUpdated(new Date());
  }, [statusFilter, search, page]);

  // Initial load + refetch on filter/search/page change
  useEffect(() => { reload(); }, [reload]);

  // Auto-poll every 15s for fresh bookings (silent — no spinner)
  useEffect(() => {
    const t = setInterval(() => reload(true), 15000);
    return () => clearInterval(t);
  }, [reload]);

  // Debounced search input
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(0);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const action = async (id: string, a: string) => {
    const res = await adminApi.patch("booking_status", { id, bookingAction: a });
    if (res) {
      toast.success("Booking updated");
      reload(true);
    } else {
      toast.error("Update failed");
    }
  };

  const stats = {
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    checkedIn: bookings.filter((b) => b.status === "CHECKED_IN").length,
    pending: bookings.filter((b) => b.paymentStatus === "PENDING").length,
    revenue: bookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((s, b) => s + b.totalAmount, 0),
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState title="Could not load bookings" message="The server may still be compiling. Try again." onRetry={() => reload()} />;

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={Clock} label="Confirmed" value={stats.confirmed} accent="teal" />
        <StatChip icon={Users} label="Checked-in" value={stats.checkedIn} accent="gold" />
        <StatChip icon={IndianRupee} label="Pending pay" value={stats.pending} accent="marsala" />
        <StatChip icon={IndianRupee} label="Page revenue" value={`₹${stats.revenue.toLocaleString("en-IN")}`} accent="teal" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft" />
          <Input
            placeholder="Search by reference, name, email, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-white pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full bg-white sm:w-52">
            <Filter className="mr-2 h-3.5 w-3.5 text-charcoal-soft" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CHECKED_IN">Checked in</SelectItem>
            <SelectItem value="CHECKED_OUT">Checked out</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => reload()}
          disabled={refreshing}
          variant="outline"
          className="rounded-xl border-charcoal/20 bg-white text-charcoal-soft hover:border-teal/40 hover:text-teal"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
        <span>
          {total} booking{total === 1 ? "" : "s"} {statusFilter !== "ALL" && `· ${statusFilter.replace("_", " ")}`}
          {lastUpdated && <span className="ml-2 normal-case text-charcoal-soft/70">· updated {lastUpdated.toLocaleTimeString("en-IN")}</span>}
        </span>
        <span className="hidden sm:inline">Auto-refreshing every 15s</span>
      </div>

      {/* Bookings table */}
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-charcoal/10 bg-ivory-deep font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pay</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/8 font-display text-xs">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Inbox className="mx-auto h-10 w-10 text-charcoal-soft/40" />
                    <p className="mt-2 font-serif text-base font-semibold text-charcoal">No bookings found</p>
                    <p className="mt-0.5 text-charcoal-soft">New bookings from the website will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-ivory-deep/30">
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] font-semibold text-teal">{b.referenceCode}</div>
                      <div className="text-[10px] text-charcoal-soft">{new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-charcoal">{b.guestName}</div>
                      <div className="text-[10px] text-charcoal-soft">{b.guestEmail}</div>
                      <div className="text-[10px] text-charcoal-soft">{b.guestPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-soft">{b.room?.name || "—"}</td>
                    <td className="px-4 py-3 text-charcoal-soft">
                      <div>{new Date(b.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} → {new Date(b.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      <div className="text-[10px]">{b.nights}n · {b.adults}a{b.children > 0 ? ` · ${b.children}c` : ""}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-serif text-sm font-bold text-teal">₹{b.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[b.status] || "bg-charcoal/10 border-charcoal/20"}`}>
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PAY_COLORS[b.paymentStatus] || "bg-charcoal/10 border-charcoal/20"}`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <ActionBtn label="View" icon={Eye} onClick={() => setDetailId(b.id)} />
                        {b.status === "CONFIRMED" && <ActionBtn label="Check-in" icon={ArrowDownToLine} onClick={() => action(b.id, "CHECK_IN")} />}
                        {b.status === "CHECKED_IN" && <ActionBtn label="Check-out" icon={ArrowUpFromLine} onClick={() => action(b.id, "CHECK_OUT")} />}
                        {b.paymentStatus === "PENDING" && <ActionBtn label="Mark paid" icon={IndianRupee} onClick={() => action(b.id, "MARK_PAID")} />}
                        {b.status !== "CANCELLED" && b.status !== "CHECKED_OUT" && <ActionBtn label="Cancel" icon={X} onClick={() => action(b.id, "CANCEL")} color="marsala" />}
                        {b.paymentStatus === "PAID" && <ActionBtn label="Refund" icon={IndianRupee} onClick={() => action(b.id, "REFUND")} color="marsala" />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-display text-xs text-charcoal-soft">
            Page {page + 1} of {totalPages} · showing {bookings.length} of {total}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} variant="outline" size="sm" className="rounded-lg">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} variant="outline" size="sm" className="rounded-lg">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Booking detail modal — opens on "View" click */}
      <BookingDetailModal
        bookingId={detailId}
        onClose={() => setDetailId(null)}
        onStatusChange={() => reload(true)}
      />
    </div>
  );
}

function StatChip({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; accent: "teal" | "gold" | "marsala" }) {
  const colors = accent === "gold" ? "bg-gold/10 text-gold-deep" : accent === "marsala" ? "bg-marsala/10 text-marsala" : "bg-teal/10 text-teal";
  return (
    <div className="flex items-center gap-2 rounded-xl border border-charcoal/10 bg-white p-3">
      <span className={`grid h-9 w-9 place-items-center rounded-full ${colors}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="font-serif text-lg font-bold leading-none text-charcoal">{value}</div>
        <div className="mt-0.5 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</div>
      </div>
    </div>
  );
}
