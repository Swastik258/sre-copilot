import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-client";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SITE_URL } from "@/lib/seo";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Tarn",
  description:
    "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Evidence-backed diagnoses you can act on.",
  applicationName: "Tarn",
  category: "technology",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Tarn",
    title: "Tarn — Evidence-backed infrastructure diagnosis",
    description:
      "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Structured diagnoses separate observed facts from ranked hypotheses.",
  },
  twitter: {
    card: "summary",
    title: "Tarn — Evidence-backed infrastructure diagnosis",
    description:
      "Read-only investigation for Kubernetes, logs, CI/CD, and Terraform. Structured diagnoses separate observed facts from ranked hypotheses.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${interTight.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{const paths=["/admin","/assistant","/audit","/cicd","/dashboard","/history","/infra-code","/kubernetes","/logs","/metrics","/runbooks","/settings","/terraform"];const path=location.pathname;const isProduct=paths.some((route)=>path===route||path.startsWith(route+"/"));if(!isProduct)return;const valid=(value)=>value==="light"||value==="dark"||value==="system";let preference;try{preference=localStorage.getItem("tarn-theme");}catch(error){console.error("Unable to read the saved theme preference.",error);}if(!valid(preference)){const cookie=document.cookie.split("; ").find((entry)=>entry.startsWith("tarn-theme="))?.slice(11);preference=valid(cookie)?cookie:"system";}document.documentElement.dataset.theme=preference==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):preference;})();`,
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>{children}</AuthProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
