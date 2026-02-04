import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Slab Advisor",
    short_name: "SlabAdvisor",
    description:
      "Manage your trading card collection and get AI-powered grade estimates before sending to PSA, BGS, or SGC.",
    start_url: "/",
    display: "standalone",
    background_color: "#334155",
    theme_color: "#FF8C42",
    icons: [
      {
        src: "/logo-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
