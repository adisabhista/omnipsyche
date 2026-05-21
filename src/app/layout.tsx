import type { Metadata } from "next";
import { Toaster } from "sonner";
import AppShell from "@/components/AppShell";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import ThemeProvider from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniPsyche",
  description: "Platform intelijensi kepribadian modular",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <AuthSessionProvider>
            <AppShell>{children}</AppShell>
            <Toaster
              position="bottom-right"
              theme="dark"
              richColors
              closeButton
              toastOptions={{
                style: { background: "rgba(5,6,8,0.95)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" },
              }}
            />
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
