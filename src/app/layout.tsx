import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Logger Dashboard – Full-stack logging & monitoring",
    template: "%s | Logger Dashboard",
  },
  description:
    "Logger Dashboard is a PM2-based platform for logging, tracking, and managing your apps with real-time monitoring and dashboard insights.",
  metadataBase: new URL("https://my-log-dashboard.vercel.app"), // Replace with your domain if different
  openGraph: {
    title: "Logger Dashboard – Logging & Monitoring Platform",
    description:
      "Monitor your Node.js apps, track logs, and visualize server performance with Logger Dashboard. Built for PM2s.",
    url: "https://my-log-dashboard.vercel.app",
    siteName: "Logger Dashboard",
    images: [
      {
        url: "/og-image.png", // This file should exist in /public
        width: 1200,
        height: 630,
        alt: "Logger Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Logger Dashboard – Full-stack Monitoring",
    description:
      "A complete platform for app observability and logging using PM2.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};
;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
