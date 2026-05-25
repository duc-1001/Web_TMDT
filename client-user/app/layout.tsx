import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProviders } from "@/components/QueryClientProviders";
import ReduxProvider from "@/store/ReduxProvider";
import DynamicSiteHead from "@/components/layout/user/dynamic-site-head";
import ChatbotWindow from "@/components/chatbot/ChatbotWindow";
import { getBackendUrl } from "@/lib/backend-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type GeneralInfoMetadata = {
  websiteName?: string;
  shortName?: string;
  websiteDescription?: string;
  favicon?: string;
};

const getGeneralInfoForMetadata = async (): Promise<GeneralInfoMetadata | null> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/system/general-info`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const json = await response.json();
    return json?.data || null;
  } catch {
    return null;
  }
};

export async function generateMetadata(): Promise<Metadata> {
  const info = await getGeneralInfoForMetadata();
  const title = info?.websiteName || info?.shortName || "Snack Việt";
  const description = info?.websiteDescription || "Snack Việt - Ẩm thực đường phố";
  const icon = info?.favicon || "/favicon.ico";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    icons: {
      icon,
      shortcut: icon,
      apple: icon,
    },
  };
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ReduxProvider>
          <DynamicSiteHead />
          <QueryClientProviders>
            {children}
          </QueryClientProviders>
        </ReduxProvider>
        <Toaster position="top-center" richColors />
        <ChatbotWindow />
      </body>
    </html>
  );
}
