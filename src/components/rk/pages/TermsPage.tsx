"use client";

import { LegalPage, Bullets, Callout } from "./LegalPage";

export function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      subtitle="The terms that govern your use of our website and hotel services. By accessing our website, making a reservation, or staying at RK Residency, you agree to comply with these terms."
      accent="gold"
      effectiveDate="July 2026"
      intro={
        <p>
          Welcome to <strong className="text-gold-deep">RK Residency</strong>. These Terms &
          Conditions govern your use of our website and hotel services. By accessing our website,
          making a reservation, or staying at RK Residency, you agree to comply with these terms.
          If you do not agree with any part of these Terms & Conditions, please refrain from using
          our website or services.
        </p>
      }
      sections={[
        {
          id: "acceptance-of-terms",
          number: "1",
          title: "Acceptance of Terms",
          body: (
            <>
              <p>By using this website or booking accommodation with RK Residency, you confirm that:</p>
              <Bullets items={[
                "You are at least 18 years of age or are using the website under the supervision of a parent or legal guardian.",
                "All information provided by you is true, accurate, and complete.",
                "You agree to comply with all applicable laws and these Terms & Conditions.",
              ]} />
            </>
          ),
        },
        {
          id: "hotel-reservations",
          number: "2",
          title: "Hotel Reservations",
          body: (
            <>
              <p>Reservations can be made through:</p>
              <Bullets items={[
                "Official Website",
                "Phone",
                "Email",
                "WhatsApp",
                "Authorized Travel Partners",
                "Online Booking Platforms",
              ]} />
              <p>
                A reservation is confirmed only after successful payment (where applicable) and
                issuance of a confirmation with a Booking ID.
              </p>
            </>
          ),
        },
        {
          id: "room-rates-payment",
          number: "3",
          title: "Room Rates & Payment",
          body: (
            <Bullets items={[
              "Room rates are subject to availability and may change without prior notice.",
              "Applicable taxes and government charges will be added as per prevailing laws.",
              "Full or partial advance payment may be required to confirm a booking.",
              "Payments can be made using accepted payment methods available at the time of booking.",
            ]} />
          ),
        },
        {
          id: "check-in-check-out",
          number: "4",
          title: "Check-in & Check-out",
          body: (
            <>
              <p>Unless otherwise specified:</p>
              <Bullets items={[
                <><strong>Check-in Time:</strong> 2:00 PM</>,
                <><strong>Check-out Time:</strong> 11:00 AM</>,
              ]} />
              <p>
                Early check-in and late check-out are subject to room availability and may incur
                additional charges.
              </p>
            </>
          ),
        },
        {
          id: "guest-identification",
          number: "5",
          title: "Guest Identification",
          body: (
            <>
              <p>As required by Indian law:</p>
              <Bullets items={[
                "Every guest must present a valid government-issued photo ID at the time of check-in.",
                "Foreign nationals must provide a valid passport and visa.",
                "The hotel reserves the right to refuse accommodation if valid identification is not provided.",
              ]} />
            </>
          ),
        },
        {
          id: "occupancy-policy",
          number: "6",
          title: "Occupancy Policy",
          body: (
            <Bullets items={[
              "Only registered guests are permitted to stay in the booked room.",
              "Additional guests may be accommodated only after prior approval and applicable charges.",
              "Maximum occupancy limits must be observed for each room category.",
            ]} />
          ),
        },
        {
          id: "guest-responsibilities",
          number: "7",
          title: "Guest Responsibilities",
          body: (
            <>
              <p>Guests are expected to:</p>
              <Bullets items={[
                "Respect hotel staff and fellow guests.",
                "Maintain peaceful conduct within the hotel premises.",
                "Use hotel property responsibly.",
                "Follow all safety instructions and hotel policies.",
                "Comply with local laws and regulations.",
              ]} />
              <Callout variant="warning">
                Any illegal, abusive, or disruptive behavior may result in immediate cancellation
                of the stay without refund.
              </Callout>
            </>
          ),
        },
        {
          id: "hotel-property-damages",
          number: "8",
          title: "Hotel Property & Damages",
          body: (
            <>
              <p>
                Guests are responsible for any damage caused to hotel property due to negligence
                or intentional misconduct.
              </p>
              <p>
                RK Residency reserves the right to recover repair or replacement costs for damaged
                property, furnishings, equipment, or fixtures.
              </p>
            </>
          ),
        },
        {
          id: "smoking-alcohol",
          number: "9",
          title: "Smoking & Alcohol Policy",
          body: (
            <Bullets items={[
              "Smoking is permitted only in designated areas, if available.",
              "Smoking inside non-smoking rooms may result in cleaning or damage charges.",
              "Consumption of alcohol must comply with applicable local laws and hotel regulations.",
            ]} />
          ),
        },
        {
          id: "pets-policy",
          number: "10",
          title: "Pets Policy",
          body: (
            <>
              <p>
                Pets are permitted only if specifically approved by RK Residency in advance.
              </p>
              <p>Additional conditions and cleaning charges may apply.</p>
            </>
          ),
        },
        {
          id: "visitors-policy",
          number: "11",
          title: "Visitors Policy",
          body: (
            <>
              <p>
                Visitors may be allowed only after informing the hotel reception and subject to
                security verification.
              </p>
              <p>
                The hotel reserves the right to restrict visitor access in the interest of guest
                safety and security.
              </p>
            </>
          ),
        },
        {
          id: "cancellation-refund",
          number: "12",
          title: "Cancellation & Refund",
          body: (
            <>
              <p>
                Cancellation and refund requests will be governed by the separate{" "}
                <a href="/cancellation-policy" className="text-teal underline-offset-2 hover:underline">
                  Cancellation & Refund Policy
                </a>{" "}
                available on our website.
              </p>
              <p>Guests are encouraged to review the policy before confirming any reservation.</p>
            </>
          ),
        },
        {
          id: "website-usage",
          number: "13",
          title: "Website Usage",
          body: (
            <>
              <p>By using our website, you agree that you will not:</p>
              <Bullets items={[
                "Attempt unauthorized access to the website or its systems.",
                "Upload viruses, malware, or harmful software.",
                "Copy, reproduce, or distribute website content without written permission.",
                "Use the website for fraudulent or unlawful purposes.",
              ]} />
            </>
          ),
        },
        {
          id: "intellectual-property",
          number: "14",
          title: "Intellectual Property",
          body: (
            <>
              <p>
                All content available on this website, including but not limited to:
              </p>
              <Bullets items={[
                "Logo",
                "Images",
                "Videos",
                "Text",
                "Graphics",
                "Design",
                "Branding",
              ]} />
              <p>
                is the exclusive property of RK Residency or its licensors and is protected by
                applicable intellectual property laws. Unauthorized use is strictly prohibited.
              </p>
            </>
          ),
        },
        {
          id: "privacy",
          number: "15",
          title: "Privacy",
          body: (
            <p>
              Your use of this website is also governed by our{" "}
              <a href="/privacy-policy" className="text-teal underline-offset-2 hover:underline">
                Privacy Policy
              </a>
              , which explains how we collect, use, and protect your personal information.
            </p>
          ),
        },
        {
          id: "limitation-of-liability",
          number: "16",
          title: "Limitation of Liability",
          body: (
            <>
              <p>RK Residency shall not be liable for:</p>
              <Bullets items={[
                "Loss or theft of personal belongings.",
                "Delays caused by circumstances beyond our control.",
                "Technical interruptions affecting online bookings.",
                "Indirect, incidental, or consequential damages arising from the use of our website or services.",
              ]} />
              <p>Guests are advised to keep their valuables secure at all times.</p>
            </>
          ),
        },
        {
          id: "force-majeure",
          number: "17",
          title: "Force Majeure",
          body: (
            <>
              <p>
                RK Residency shall not be held responsible for failure or delay in providing
                services due to events beyond reasonable control, including but not limited to:
              </p>
              <Bullets items={[
                "Natural disasters",
                "Floods",
                "Earthquakes",
                "Fire",
                "Pandemic or epidemic",
                "Government restrictions",
                "War or civil unrest",
                "Power failures",
                "Internet outages",
              ]} />
            </>
          ),
        },
        {
          id: "changes-to-services",
          number: "18",
          title: "Changes to Services",
          body: (
            <>
              <p>RK Residency reserves the right to:</p>
              <Bullets items={[
                "Modify room rates",
                "Update hotel facilities",
                "Revise services",
                "Change these Terms & Conditions",
              ]} />
              <p>without prior notice, where permitted by law.</p>
            </>
          ),
        },
        {
          id: "governing-law",
          number: "19",
          title: "Governing Law",
          body: (
            <>
              <p>
                These Terms & Conditions shall be governed by and interpreted in accordance with
                the laws of <strong>India</strong>.
              </p>
              <p>
                Any disputes arising from the use of our website or hotel services shall be subject
                to the exclusive jurisdiction of the competent courts in{" "}
                <strong>Mathura, Uttar Pradesh</strong>.
              </p>
            </>
          ),
        },
      ]}
      closing={
        <p>
          By accessing this website, making a reservation, or staying at RK Residency, you confirm
          that you have read, understood, and agreed to these Terms & Conditions. These terms are
          designed to ensure a safe, comfortable, and enjoyable experience for all guests while
          protecting the rights of both our guests and RK Residency.
        </p>
      }
    />
  );
}
