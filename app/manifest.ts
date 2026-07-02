import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Berries Angeles";

  return {
    name: appName,
    short_name: "Berries",
    description: "Sistema de gestión Berries Angeles",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a472a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
