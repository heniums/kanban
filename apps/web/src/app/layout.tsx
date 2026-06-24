import type { Metadata } from "next";
import { inter, interMono } from "@/lib/font";
import { SessionProvider } from "@/components/session-provider";
import { Header } from "@/components/header";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban",
  description: "Collaborative kanban board application",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${interMono.variable}`}>
      <body className="antialiased">
        <ToastProvider>
          <SessionProvider>
            <Header />
            {children}
          </SessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
