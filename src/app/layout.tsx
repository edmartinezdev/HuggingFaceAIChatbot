import "./globals.css";

export const metadata = {
  title: "Chatbot App",
  description: "A simple chatbot built with Next.js and shadcn UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
