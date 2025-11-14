import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import QueryProvider from "./query-provider"; // 👇 new client wrapper

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"], variable: "--font-source-code-pro" });

export const metadata: Metadata = {
  title: "La Monjería",
  description: "AI Animation and Music Studio",
  other: {
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: "https://monjeria.vercel.app/preview.png",
      button: {
        title: "Enter La Monjería",
        action: {
          type: "launch_frame",
          name: "La Monjería",
          url: "https://monjeria.vercel.app",
        },
      },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceCodePro.variable} bg-black text-white`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
