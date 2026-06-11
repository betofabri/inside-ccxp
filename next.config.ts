import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// disponibiliza os bindings do wrangler (D1 etc.) no `next dev`
initOpenNextCloudflareForDev();

const basePath = "/lab/inside-ccxp";

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
