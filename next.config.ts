import type { NextConfig } from "next";

// GitHub Pages serves the site from /<repo-name>; the deploy workflow sets this.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
