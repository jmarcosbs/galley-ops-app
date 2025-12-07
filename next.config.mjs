import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants.js";

const nextConfigBase = {
  reactStrictMode: true,
  output: "export",

  images: {
    unoptimized: true,
  },
};

const nextConfig = async (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withPWA = (await import("@ducanh2912/next-pwa")).default({
      dest: "public",
      disable: false,
    });

    return withPWA(nextConfigBase);
  }

  return nextConfigBase;
};

export default nextConfig;

