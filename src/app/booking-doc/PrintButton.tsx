"use client";

/**
 * Print button — must be a Client Component because it uses window.print()
 * and onClick. The parent booking-doc page is a Server Component (it does
 * async DB calls), so this button is split out as a client island.
 */
export function PrintButton() {
  return (
    <button
      className="print-btn"
      onClick={() => window.print()}
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 100,
        background: "#0E4C4F",
        color: "#fff",
        border: "none",
        padding: "12px 24px",
        borderRadius: 30,
        fontSize: 14,
        fontWeight: "bold",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        fontFamily: "Arial, sans-serif",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "#0A3A3C")}
      onMouseOut={(e) => (e.currentTarget.style.background = "#0E4C4F")}
    >
      Print / Save as PDF
    </button>
  );
}
