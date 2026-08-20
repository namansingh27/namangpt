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
    "AI-powered personal portfolio chatbot. Ask about projects, experience, skills, and background.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "NamanGPT — Ask me anything about Naman Singh",
    description:
      "AI-powered personal portfolio chatbot. Ask about projects, experience, skills, and background.",
    url: "https://namangpt-one.vercel.app",
    siteName: "NamanGPT",
    type: "website",
    images: [
      {
        url: "/naman.jpg",
        width: 800,
        height: 800,
        alt: "Naman Singh",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "NamanGPT",
    description: "Ask me anything about Naman Singh.",
    images: ["/naman.jpg"],
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
