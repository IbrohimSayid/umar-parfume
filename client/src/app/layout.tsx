import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import BottomNavbar from "../components/BottomNavbar";
import { AuthProvider } from "../contexts/AuthContext";
import { OrderProvider } from "../contexts/OrderContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Umar Perfume",
  description: "Umar Perfume - erkaklar va ayollar uchun premium sifatli atirlar. Eng yaxshi brendlar va noyob hidlar.",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
        <AuthProvider>
          <Navbar />
          <OrderProvider>
            {children}
            <ToastContainer position="bottom-right" theme="dark" />
          </OrderProvider>
            <BottomNavbar />
        </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
