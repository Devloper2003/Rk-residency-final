"use client";

import { LegalPage, Bullets, Callout, PolicyTable } from "./LegalPage";

export function CancellationPage() {
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      subtitle="The terms applicable to reservations made through our website, phone, email, WhatsApp, or authorized booking partners. By confirming a reservation, you agree to the terms stated below."
      accent="marsala"
      effectiveDate="July 2026"
      intro={
        <p>
          At <strong className="text-marsala">RK Residency</strong>, we strive to provide a seamless
          booking experience for all our guests. This Cancellation & Refund Policy outlines the
          terms applicable to reservations made through our website, phone, email, WhatsApp, or
          authorized booking partners. By confirming a reservation, you agree to the terms stated
          below.
        </p>
      }
      sections={[
        {
          id: "reservation-confirmation",
          number: "1",
          title: "Reservation Confirmation",
          body: (
            <>
              <p>A booking is considered confirmed only after:</p>
              <Bullets items={[
                "Successful payment (full or partial, if applicable).",
                "Receipt of a booking confirmation via Email, SMS, or WhatsApp.",
                "Issuance of a valid Booking ID or Reservation Number.",
              ]} />
            </>
          ),
        },
        {
          id: "free-cancellation",
          number: "2",
          title: "Free Cancellation",
          body: (
            <p>
              Guests may cancel their reservation{" "}
              <strong>up to 48 hours before the scheduled check-in time</strong> without any
              cancellation charges, unless otherwise specified during the booking process.
            </p>
          ),
        },
        {
          id: "cancellation-charges",
          number: "3",
          title: "Cancellation Charges",
          body: (
            <>
              <p>The following cancellation charges may apply:</p>
              <PolicyTable rows={[
                { time: "More than 48 hours before check-in", charge: "No Cancellation Fee" },
                { time: "Within 48 hours before check-in", charge: "One Night's Room Charge" },
                { time: "On the Check-in Date", charge: "100% Booking Amount" },
                { time: "No-Show (Guest Does Not Arrive)", charge: "100% Booking Amount" },
              ]} />
              <Callout>
                <strong>Note:</strong> Promotional offers, discounted rates, festive packages, and
                non-refundable bookings may have different cancellation terms, which will be
                communicated at the time of booking.
              </Callout>
            </>
          ),
        },
        {
          id: "refund-policy",
          number: "4",
          title: "Refund Policy",
          body: (
            <>
              <p>If a booking qualifies for a refund:</p>
              <Bullets items={[
                "Refunds will be processed to the original payment method.",
                <>Refunds are generally completed within <strong>7–10 business days</strong>, depending on your bank or payment provider.</>,
                "Any payment gateway or bank processing charges (if applicable) may be deducted from the refund amount.",
              ]} />
            </>
          ),
        },
        {
          id: "non-refundable-bookings",
          number: "5",
          title: "Non-Refundable Bookings",
          body: (
            <>
              <p>Certain bookings are non-refundable, including:</p>
              <Bullets items={[
                "Special Promotional Offers",
                "Festival Packages",
                "Event Bookings",
                "Group Reservations (unless otherwise agreed)",
                "Advance Purchase Discounts",
                "Non-Refundable Rate Plans",
              ]} />
              <p>Please review your booking details carefully before confirming your reservation.</p>
            </>
          ),
        },
        {
          id: "booking-modifications",
          number: "6",
          title: "Booking Modifications",
          body: (
            <>
              <p>Guests may request changes to:</p>
              <Bullets items={[
                "Check-in Date",
                "Check-out Date",
                "Room Type",
                "Guest Details",
              ]} />
              <p>All modification requests are subject to:</p>
              <Bullets items={[
                "Room availability",
                "Applicable rate differences",
                "Hotel approval",
              ]} />
              <p>Additional charges may apply depending on the requested changes.</p>
            </>
          ),
        },
        {
          id: "early-check-out",
          number: "7",
          title: "Early Check-Out",
          body: (
            <>
              <p>If a guest chooses to check out before the confirmed departure date:</p>
              <Bullets items={[
                <>Refunds for unused nights are <strong>not guaranteed</strong>.</>,
                "Any refund or adjustment will be at the sole discretion of RK Residency management.",
              ]} />
            </>
          ),
        },
        {
          id: "no-show-policy",
          number: "8",
          title: "No-Show Policy",
          body: (
            <>
              <p>If a guest does not arrive on the scheduled check-in date without prior notice:</p>
              <Bullets items={[
                "The reservation may be cancelled automatically.",
                "The entire booking amount may be forfeited.",
                "The room may be released for other guests.",
              ]} />
            </>
          ),
        },
        {
          id: "hotel-initiated-cancellation",
          number: "9",
          title: "Hotel-Initiated Cancellation",
          body: (
            <>
              <p>
                In rare situations where RK Residency is unable to honor a confirmed reservation
                due to circumstances beyond our control, such as:
              </p>
              <Bullets items={[
                "Technical issues",
                "Operational constraints",
                "Natural disasters",
                "Government restrictions",
                "Force Majeure events",
              ]} />
              <p>We will:</p>
              <Bullets items={[
                "Offer an alternative accommodation (subject to availability), or",
                "Provide a full refund of the amount paid.",
              ]} />
            </>
          ),
        },
        {
          id: "third-party-bookings",
          number: "10",
          title: "Third-Party Bookings",
          body: (
            <>
              <p>If your reservation was made through:</p>
              <Bullets items={[
                "Online Travel Agencies (OTAs)",
                "Travel Agents",
                "Corporate Partners",
                "Third-Party Booking Platforms",
              ]} />
              <p>
                The cancellation and refund process will be governed by the respective platform's
                policies in addition to RK Residency's terms.
              </p>
            </>
          ),
        },
        {
          id: "force-majeure",
          number: "11",
          title: "Force Majeure",
          body: (
            <>
              <p>
                RK Residency shall not be held liable for cancellations or service interruptions
                caused by events beyond reasonable control, including but not limited to:
              </p>
              <Bullets items={[
                "Natural disasters",
                "Floods",
                "Earthquakes",
                "Fire",
                "Pandemic or Epidemic",
                "Government Orders",
                "War or Civil Disturbance",
                "Power Failure",
                "Internet Outages",
              ]} />
            </>
          ),
        },
      ]}
      closing={
        <p>
          By making a reservation with RK Residency through our website or any authorized booking
          channel, you acknowledge that you have read, understood, and agreed to this Cancellation
          & Refund Policy. RK Residency reserves the right to modify or update this policy at any
          time — any changes will be published on this page with the revised effective date.
        </p>
      }
    />
  );
}
