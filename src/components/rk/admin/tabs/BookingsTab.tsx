"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, ArrowDownToLine, ArrowUpFromLine, IndianRupee, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "./_shared";
import { ActionBtn } from "./_shared";

export function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi.get("bookings", { status: statusFilter, search }).then((data) => {
      if (cancelled || !data) { if (!cancelled) setLoading(false); return; }
      setBookings(data.bookings || []); setLoading(false);
    });
    return () => { cancelled = true; };
  }, [statusFilter, search]);

  const reload = useCallback(() => {
    adminApi.get("bookings", { status: statusFilter, search }).then((data) => { if (data) setBookings(data.bookings || []); setLoading(false); });
  }, [statusFilter, search]);

  const action = async (id: string, a: string) => {
    const res = await adminApi.patch("booking_status", { id, bookingAction: a });
    if (res) reload();
  };

  const STATUS_COLORS: Record<string, string> = { CONFIRMED: "bg-teal/10 text-teal", CHECKED_IN: "bg-gold/15 text-gold-deep", CHECKED_OUT: "bg-charcoal/10 text-charcoal-soft", CANCELLED: "bg-marsala/10 text-marsala" };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft" /><Input placeholder="Search by reference, name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white pl-10" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full bg-white sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="CONFIRMED">Confirmed</SelectItem><SelectItem value="CHECKED_IN">Checked in</SelectItem><SelectItem value="CHECKED_OUT">Checked out</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></SelectContent></Select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
        <div className="scrollbar-thin overflow-x-auto"><table className="w-full text-left">
          <thead className="border-b border-charcoal/10 bg-ivory-deep font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pay</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-charcoal/8 font-display text-xs">
            {loading ? <tr><td colSpan={8} className="px-4 py-10 text-center text-charcoal-soft">Loading…</td></tr> :
             bookings.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-charcoal-soft">No bookings found.</td></tr> :
             bookings.map((b) => (
              <tr key={b.id} className="hover:bg-ivory-deep/30">
                <td className="px-4 py-3 font-mono text-[11px] font-semibold text-teal">{b.referenceCode}</td>
                <td className="px-4 py-3"><div className="font-semibold text-charcoal">{b.guestName}</div><div className="text-[10px] text-charcoal-soft">{b.guestEmail}</div><div className="text-[10px] text-charcoal-soft">{b.guestPhone}</div></td>
                <td className="px-4 py-3 text-charcoal-soft">{b.room?.name || "—"}</td>
                <td className="px-4 py-3 text-charcoal-soft"><div>{new Date(b.checkIn).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} → {new Date(b.checkOut).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div><div className="text-[10px]">{b.nights}n · {b.adults}a{b.children>0?` · ${b.children}c`:""}</div></td>
                <td className="px-4 py-3 text-right font-serif text-sm font-bold text-teal">₹{b.totalAmount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[b.status]||"bg-charcoal/10"}`}>{b.status.replace("_"," ")}</span></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.paymentStatus==="PAID"?"bg-teal/10 text-teal":b.paymentStatus==="REFUNDED"?"bg-marsala/10 text-marsala":"bg-gold/15 text-gold-deep"}`}>{b.paymentStatus}</span></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">
                  {b.status==="CONFIRMED"&&<ActionBtn label="Check-in" icon={ArrowDownToLine} onClick={()=>action(b.id,"CHECK_IN")} />}
                  {b.status==="CHECKED_IN"&&<ActionBtn label="Check-out" icon={ArrowUpFromLine} onClick={()=>action(b.id,"CHECK_OUT")} />}
                  {b.paymentStatus==="PENDING"&&<ActionBtn label="Mark paid" icon={IndianRupee} onClick={()=>action(b.id,"MARK_PAID")} />}
                  {b.status!=="CANCELLED"&&b.status!=="CHECKED_OUT"&&<ActionBtn label="Cancel" icon={X} onClick={()=>action(b.id,"CANCEL")} color="marsala" />}
                  {b.paymentStatus==="PAID"&&<ActionBtn label="Refund" icon={IndianRupee} onClick={()=>action(b.id,"REFUND")} color="marsala" />}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
