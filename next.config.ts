import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the preview iframe origin to talk to the dev server without
  // triggering the cross-origin warning in development.
  allowedDevOrigins: ["*.space-z.ai"],
  reactStrictMode: true,
  // Do not advertise the framework version (x-powered-by header)
  poweredByHeader: false,
  // pdfkit uses fs.readFileSync(__dirname + '/data/Helvetica.afm') to load
  // font metrics at runtime. Without this flag, Next.js's bundler
  // tree-shakes the .afm files out of the serverless bundle → ENOENT error
  // on Vercel. Marking it as a server external package forces the whole
  // pdfkit package (including js/data/*.afm) to be bundled verbatim.
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "png-js", "razorpay", "sharp"],
  async redirects() {
    return [
      // Audit H4: duplicate blog posts — 301 the thin duplicate to the rich
      // canonical post. Owner unpublishes the duplicate row in Admin → Blog.
      {
        source: "/blog/janmashtami-2026-vrindavan-calendar",
        destination: "/blog/janmashtami-in-vrindavan-2026",
        permanent: true,
      },
      {
        source: "/blog/banke-bihari-mandir-darshan-guide",
        destination: "/blog/banke-bihari-darshan-guide",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Site-wide hardening (applies before the narrower blocks below):
        // no framing anywhere (clickjacking), no MIME sniffing, tight
        // referrer leakage, and permissive-but-real CSP frame-ancestors.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      {
        // SEO: keep the admin console and every API route out of search
        // indexes via X-Robots-Tag (works even for routes without HTML meta).
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
