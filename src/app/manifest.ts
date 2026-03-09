import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Slab Advisor",
    short_name: "SlabAdvisor",
    description:
      "Manage your trading card collection and get AI-powered grade estimates before sending to PSA, BGS, or SGC.",
    start_url: "/",
    display: "standalone",
    background_color: "#2f4b2d",
    theme_color: "#ed732d",
    icons: [
      {
        src: "/icon_light.png",
        sizes: "928x1152",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
