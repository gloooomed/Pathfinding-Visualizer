import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dijkstra's Algorithm Visualizer",
  description: "Interactive visualization of Dijkstra's pathfinding algorithm with animated step-by-step execution",
};

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
        <div className="min-h-screen flex flex-col">
          <nav className="px-6 py-3 border-b border-gray-800 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50">
            <div className="max-w-6xl mx-auto flex items-center justify-center">
              <div className="relative">
                <div className="relative flex gap-1 p-1 rounded-xl bg-gray-50/10 border border-gray-200/20">
                  <Link href="/" className="px-4 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 select-none text-gray-400 hover:text-white hover:bg-white/10 whitespace-nowrap">
                    <span>⬛</span>
                    <span>Grid</span>
                  </Link>
                  <Link href="/map" className="px-4 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 select-none text-gray-400 hover:text-white hover:bg-white/10 whitespace-nowrap">
                    <span>🗺️</span>
                    <span>Map</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
