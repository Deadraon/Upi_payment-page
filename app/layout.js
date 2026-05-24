import "./globals.css";

export const metadata = {
  title: "MyMobPay | Secure UPI Payment",
  description: "Pay securely via UPI — Google Pay, PhonePe, Paytm, BHIM. Instant payment verification.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800&family=Orbitron:wght@700;800;900&family=Outfit:wght@500;700;800&family=Space+Grotesk:wght@500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
