import "./globals.css";

export const metadata = {
  title: "Kunal Chauhan | Secure UPI Payment",
  description: "Pay securely via UPI — Google Pay, PhonePe, Paytm, BHIM. Instant payment verification.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
