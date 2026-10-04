import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projeto Mulher Forte",
  description: "Marmitas e jornada física — acompanhamento pessoal da Dany",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4A5D23",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-bege text-stone-900 antialiased">{children}</body>
    </html>
  );
}
