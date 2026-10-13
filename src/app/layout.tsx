import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionConfigProvider } from "@/components/motion-config-provider";
import { StoreHydrator } from "@/components/store-hydrator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veðr — Weather Dashboard",
  description:
    "A portfolio-grade Weather Dashboard blending modern SaaS data visualization with a moody Scottish Highlands creative identity. Track temperature, humidity, wind, pressure, UV index, cloud cover and visibility across the glens — worldwide.",
  keywords: [
    "weather dashboard",
    "Veðr",
    "weather intelligence",
    "React",
    "Tailwind CSS",
    "shadcn/ui",
    "data visualization",
  ],
  authors: [{ name: "Veðr" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Veðr — Weather Dashboard",
    description:
      "Moody, atmospheric weather intelligence — worldwide, with a Scottish Highlands creative identity.",
    siteName: "Veðr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veðr Dashboard",
    description: "Weather intelligence dashboard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload the Norse-Bold display font so it's available immediately on
         * load (avoids a flash of fallback text on reload/navigation). */}
        <link rel="preload" href="/fonts/NorseBold.otf" as="font" type="font/otf" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfigProvider>
            <StoreHydrator>
              {children}
              <Toaster />
              <SonnerToaster position="bottom-right" richColors closeButton />
            </StoreHydrator>
          </MotionConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
