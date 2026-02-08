import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LlmChatMap",
  description: "Transform your LLM chat histories into interactive mind maps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
