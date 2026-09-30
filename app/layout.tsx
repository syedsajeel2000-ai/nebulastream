import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-client";
import { ToastProvider } from "@/components/Toast";
import PageTransition from "@/components/PageTransition";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "NebulaStream — Stream movies & TV shows",
    template: "%s · NebulaStream",
  },
  description:
    "NebulaStream is a demo streaming platform: browse movies and TV shows, build your list, track progress, and get recommendations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0c14] text-[#f4f6fb]">
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="min-h-[70vh] pt-16">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
