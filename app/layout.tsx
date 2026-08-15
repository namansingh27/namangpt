import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NamanGPT — Ask me anything about Naman Singh",
  description:
    "AI-powered personal portfolio chatbot for Naman Singh. Ask about his projects, experience, skills, and background.",
  openGraph: {
    title: "NamanGPT — Ask me anything about Naman Singh",
    description:
      "AI-powered personal portfolio chatbot. Ask about projects, experience, skills, and background.",
    url: "https://namangpt.vercel.app",
    siteName: "NamanGPT",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NamanGPT",
    description: "Ask me anything about Naman Singh.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
