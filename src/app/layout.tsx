import type { Metadata, Viewport } from "next";
import "@fontsource-variable/noto-sans-kr";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "커피턴",
  description: "우리 셋의 공평한 커피 순서",
  applicationName: "커피턴",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "커피턴",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f1",
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