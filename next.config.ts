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
    serverExternalPackages: ["pdfkit", "fontkit", "linebreak", "png-js", "razorpay"],
};

export default nextConfig;

