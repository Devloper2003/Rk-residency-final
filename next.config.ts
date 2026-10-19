import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the preview iframe origin to talk to the dev server without
  // triggering the cross-origin warning in development.
  allowedDevOrigins: ["*.space-z.ai"],
  reactStrictMode: true,
  // pdfkit uses fs.readFileSync(__dirname + '/data/Helvetica.afm') to load
  // font metrics at runtime. Without this flag, Next.js's bundler
  // tree-shakes the .afm files out of the serverless bundle → ENOENT error
  // on Vercel. Marking it as a server external package forces the whole
  // pdfkit package (including js/data/*.afm) to be bundled verbatim.
  serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "png-js", "razorpay", "sharp"],
  async headers() {
    return [
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
