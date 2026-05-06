import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Space Exploration Simulation",
  description: "An interactive, physically inspired solar system moving through galactic space."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
