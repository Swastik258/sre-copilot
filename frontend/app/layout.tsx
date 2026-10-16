import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { clerkEnabled } from "@/lib/auth";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SRE Copilot",
  description:
    "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Evidence-backed diagnoses you can act on.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const body = (
    <>
      <TopNav />
      <main className="min-h-screen pt-16">{children}</main>
      <SiteFooter />
    </>
  );

  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="bg-ink-900 font-sans text-paper-100 antialiased">
        {clerkEnabled ? (
          <ClerkProvider>{body}</ClerkProvider>
        ) : (
          // Demo mode: no auth provider, no third-party keys required.
          body
        )}
      </body>
    </html>
  );
}
