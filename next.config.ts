import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// disponibiliza os bindings do wrangler (D1 etc.) no `next dev`
initOpenNextCloudflareForDev();

// fora do /lab/* pra escapar do Cloudflare Access — convidados não têm SSO
const basePath = "/insider-ccxp";

const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
