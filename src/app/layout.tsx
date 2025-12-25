import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "@/contexts/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";


export const metadata: Metadata = {
  title: "xScaner | Xandeum pNode Analytics Dashboard",
  description: "Real-time analytics and monitoring dashboard for Xandeum pNodes. Track network health, node performance, and geographic distribution.",
  keywords: ["Xandeum", "pNode", "analytics", "dashboard", "Solana", "blockchain", "storage"],
  authors: [{ name: "xScaner" }],
  openGraph: {
    title: "xScaner | Xandeum pNode Analytics",
    description: "Real-time pNode analytics for the Xandeum decentralized storage network",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 text-foreground min-h-screen antialiased">
        <SidebarProvider>
          <div className="flex">
            <Sidebar />
            <MainContent>
              {children}
            </MainContent>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
