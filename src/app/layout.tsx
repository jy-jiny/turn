import type { Metadata, Viewport } from "next";
import "@fontsource-variable/noto-sans-kr";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "턴",
  description: "함께 쓰는 공평한 순서",
  applicationName: "턴",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "턴",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#176047",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}