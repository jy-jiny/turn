import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "턴",
    short_name: "턴",
    description: "함께 쓰는 공평한 순서",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f5f1",
    theme_color: "#176047",
    lang: "ko",
    categories: ["lifestyle", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}