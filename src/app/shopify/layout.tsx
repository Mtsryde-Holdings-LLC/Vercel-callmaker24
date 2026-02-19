/**
 * Shopify Embedded App Layout
 *
 * This layout wraps all pages served within the Shopify admin iframe.
 * It loads App Bridge 4 via CDN and provides the necessary HTML structure
 * for embedded Shopify apps.
 *
 * App Bridge 4 auto-initializes using the data-api-key attribute on the
 * script tag. It exposes window.shopify for session tokens and navigation.
 */

import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "CallMaker24 - Shopify App",
  description: "CRM, Loyalty & Marketing for Shopify stores",
};

export default function ShopifyEmbeddedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.SHOPIFY_API_KEY || "";

  return (
    <html lang="en">
      <head>
        {/* App Bridge 4 CDN - must load before page renders */}
        <Script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          data-api-key={apiKey}
          strategy="beforeInteractive"
        />
        <meta name="shopify-api-key" content={apiKey} />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
