import type { Metadata } from "next";
import { Rethink_Sans } from "next/font/google";


const inter = Rethink_Sans({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Admin Dashboard – Ordo CRM",
  description:
    "Admin dashboard for managing e-commerce orders, inventory, sales representatives, agents, expenses, revenue, and profit tracking in real time.",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
