"use client";

import { LegalPage, Bullets, Callout } from "./LegalPage";

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How RK Residency collects, uses, stores, and protects your personal information when you visit our website, make a reservation, or stay at our hotel."
      accent="teal"
      effectiveDate="July 2026"
      intro={
        <p>
          Welcome to <strong className="text-teal">RK Residency</strong>. Your privacy is
          important to us. This Privacy Policy explains how we collect, use, store, and
          protect your personal information when you visit our website, make a reservation,
          or stay at our hotel. By using our website and services, you agree to the practices
          described in this policy.
        </p>
      }
      sections={[
        {
          id: "information-collection",
          number: "1",
          title: "Information We Collect",
          body: (
            <>
              <p>
                To provide a seamless booking experience and quality hospitality services, we
                may collect the following information:
              </p>
              <p className="font-serif text-base font-semibold text-charcoal">Personal Information</p>
              <Bullets items={[
                "Full Name",
                "Email Address",
                "Mobile Number",
                "Residential Address",
                "Government-issued Identity Proof (as required by law)",
                "Nationality (if applicable)",
              ]} />
              <p className="font-serif text-base font-semibold text-charcoal">Booking Information</p>
              <Bullets items={[
                "Check-in and Check-out Dates",
                "Number of Guests",
                "Room Preferences",
                "Special Requests",
                "Booking History",
              ]} />
              <p className="font-serif text-base font-semibold text-charcoal">Payment Information</p>
              <p>
                Payments are securely processed through trusted payment gateways. RK Residency
                does <strong>not</strong> store your complete debit card, credit card, UPI PIN,
                CVV, or banking credentials.
              </p>
              <p className="font-serif text-base font-semibold text-charcoal">Technical Information</p>
              <p>When you visit our website, we may automatically collect:</p>
              <Bullets items={[
                "IP Address",
                "Browser Type",
                "Device Information",
                "Operating System",
                "Pages Visited",
                "Date & Time of Visit",
                "Cookies and Analytics Data",
              ]} />
            </>
          ),
        },
        {
          id: "how-we-use",
          number: "2",
          title: "How We Use Your Information",
          body: (
            <>
              <p>We use your information to:</p>
              <Bullets items={[
                "Process room reservations.",
                "Confirm and manage bookings.",
                "Provide customer support.",
                "Verify guest identity during check-in.",
                "Improve our hotel services.",
                "Improve website performance and user experience.",
                "Send booking confirmations and important notifications.",
                "Respond to customer inquiries.",
                "Maintain hotel security.",
                "Comply with applicable laws and regulations.",
              ]} />
              <p>We never use your personal information for unlawful purposes.</p>
            </>
          ),
        },
        {
          id: "booking-information",
          number: "3",
          title: "Booking & Reservation Information",
          body: (
            <>
              <p>Information provided during booking is used solely for:</p>
              <Bullets items={[
                "Reservation confirmation",
                "Guest verification",
                "Check-in procedures",
                "Customer communication",
                "Billing and invoice generation",
              ]} />
              <p>Please ensure that all information submitted during booking is accurate and complete.</p>
            </>
          ),
        },
        {
          id: "payment-security",
          number: "4",
          title: "Payment Security",
          body: (
            <>
              <p>Your online security is important to us.</p>
              <p>
                All online transactions are processed through secure, encrypted third-party
                payment providers. We do not store sensitive payment credentials such as:
              </p>
              <Bullets items={[
                "Debit Card Numbers",
                "Credit Card Numbers",
                "CVV",
                "ATM PIN",
                "UPI PIN",
                "Internet Banking Passwords",
              ]} />
            </>
          ),
        },
        {
          id: "cookies",
          number: "5",
          title: "Cookies",
          body: (
            <>
              <p>Our website uses cookies to improve your browsing experience.</p>
              <p>Cookies help us:</p>
              <Bullets items={[
                "Remember user preferences",
                "Improve website functionality",
                "Analyze visitor behavior",
                "Enhance website performance",
              ]} />
              <p>
                You may disable cookies through your browser settings, although certain website
                features may not function properly.
              </p>
            </>
          ),
        },
        {
          id: "guest-data",
          number: "6",
          title: "Guest Identity Verification",
          body: (
            <>
              <p>
                In accordance with applicable laws, guests may be required to provide a valid
                government-issued identification document during check-in.
              </p>
              <p>
                This information is collected only for legal compliance and guest verification
                purposes.
              </p>
            </>
          ),
        },
        {
          id: "cctv-notice",
          number: "7",
          title: "CCTV Surveillance",
          body: (
            <>
              <p>
                For the safety and security of our guests, employees, and property, selected
                public areas of RK Residency may be monitored through CCTV surveillance.
              </p>
              <p>
                CCTV recordings are used only for security, safety, and legal purposes and are
                accessed only by authorized personnel.
              </p>
            </>
          ),
        },
        {
          id: "information-sharing",
          number: "8",
          title: "Information Sharing",
          body: (
            <>
              <p>RK Residency values your privacy.</p>
              <p>We do <strong>not</strong> sell, rent, or trade your personal information.</p>
              <p>Your information may be shared only when necessary with:</p>
              <Bullets items={[
                "Authorized payment providers",
                "Government authorities where legally required",
                "Law enforcement agencies upon lawful request",
                "Technology service providers supporting our hotel operations",
              ]} />
            </>
          ),
        },
        {
          id: "data-security",
          number: "9",
          title: "Data Security",
          body: (
            <>
              <p>
                We implement appropriate technical and organizational security measures to
                protect your personal information against:
              </p>
              <Bullets items={[
                "Unauthorized access",
                "Data loss",
                "Misuse",
                "Alteration",
                "Unauthorized disclosure",
              ]} />
              <Callout>
                While we take every reasonable precaution, no online system can guarantee absolute
                security.
              </Callout>
            </>
          ),
        },
        {
          id: "data-retention",
          number: "10",
          title: "Data Retention",
          body: (
            <>
              <p>Your personal information is retained only for as long as necessary to:</p>
              <Bullets items={[
                "Complete reservations",
                "Meet legal obligations",
                "Resolve disputes",
                "Maintain business records",
              ]} />
              <p>
                After the required retention period, information is securely deleted or anonymized.
              </p>
            </>
          ),
        },
        {
          id: "third-party-services",
          number: "11",
          title: "Third-Party Services",
          body: (
            <>
              <p>Our website may include links or integrations with third-party services such as:</p>
              <Bullets items={[
                "Google Maps",
                "Online Payment Gateways",
                "Social Media Platforms",
                "Booking Platforms",
              ]} />
              <p>
                These services operate under their own privacy policies, and RK Residency is not
                responsible for their privacy practices.
              </p>
            </>
          ),
        },
        {
          id: "marketing",
          number: "12",
          title: "Marketing Communications",
          body: (
            <>
              <p>With your consent, we may occasionally send:</p>
              <Bullets items={[
                "Promotional Offers",
                "Seasonal Discounts",
                "Hotel Updates",
                "Event Announcements",
              ]} />
              <p>You may opt out of promotional communications at any time.</p>
            </>
          ),
        },
        {
          id: "childrens-privacy",
          number: "13",
          title: "Children's Privacy",
          body: (
            <>
              <p>
                Our website is not intended for children under the age of 18 without parental or
                guardian supervision.
              </p>
              <p>
                We do not knowingly collect personal information from children without appropriate
                consent.
              </p>
            </>
          ),
        },
        {
          id: "user-rights",
          number: "14",
          title: "Your Rights",
          body: (
            <>
              <p>Depending on applicable laws, you may have the right to:</p>
              <Bullets items={[
                "Access your personal information",
                "Request corrections",
                "Request deletion where legally permitted",
                "Withdraw consent",
                "Raise privacy-related concerns",
              ]} />
              <p>Requests may be subject to legal verification requirements.</p>
            </>
          ),
        },
        {
          id: "policy-updates",
          number: "15",
          title: "Policy Updates",
          body: (
            <p>
              RK Residency reserves the right to update this Privacy Policy at any time to reflect
              changes in legal requirements, business practices, or website functionality. The
              latest version will always be available on this page with the updated Effective Date.
            </p>
          ),
        },
      ]}
      closing={
        <p>
          By accessing our website, making a reservation, or staying at RK Residency, you
          acknowledge that you have read, understood, and agreed to this Privacy Policy. We are
          committed to protecting your information and providing a safe, transparent, and
          trustworthy hospitality experience.
        </p>
      }
    />
  );
}
