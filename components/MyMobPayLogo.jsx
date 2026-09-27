'use client';

import React from 'react';

/**
 * MyMobPayMark — Standalone vector dual-color M logo
 * Left stroke: Electric / Azure Blue (#0284C7)
 * Right stroke: Vibrant Warm Orange (#FF7800)
 */
export function MyMobPayMark({ className = 'w-6 h-6', ...props }) {
  return (
    <svg
      viewBox="0 0 38 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MyMobPay Mark"
      {...props}
    >
      {/* Left Blue Stroke */}
      <path
        d="M 6.5 28.5 V 13 C 6.5 7.2 11.5 5 15.5 8.2 L 19 18.5"
        stroke="#0284C7"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Orange Stroke */}
      <path
        d="M 19 18.5 L 22.5 8.2 C 26.5 5 31.5 7.2 31.5 13 V 28.5"
        stroke="#FF7800"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * MyMobPayLogo — Full Brand Logo with Blue/Orange M Mark before "MyMobPay"
 * Clean SVG implementation that drops cleanly into any existing MyMobPayLogo instance.
 */
export function MyMobPayLogo({
  className = 'w-48 h-auto',
  textColor = 'var(--text-primary)',
  ...props
}) {
  return (
    <svg
      viewBox="0 0 220 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 select-none ${className}`}
      {...props}
    >
      {/* M Mark (Left Blue, Right Orange) */}
      <g transform="translate(2, 3)">
        <path
          d="M 6.5 28.5 V 13 C 6.5 7.2 11.5 5 15.5 8.2 L 19 18.5"
          stroke="#0284C7"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 19 18.5 L 22.5 8.2 C 26.5 5 31.5 7.2 31.5 13 V 28.5"
          stroke="#FF7800"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {/* Wordmark: MyMobPay */}
      <text
        x="43"
        y="27"
        fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="26"
        fill={textColor}
        letterSpacing="-0.5"
      >
        MyMobPay
      </text>
    </svg>
  );
}

/**
 * MyMobPayQrBadge — Center logo badge overlay for UPI QR codes
 * Placed in the dead center of the QR code with white backing and soft shadow.
 */
export function MyMobPayQrBadge({ size = 32, markSize = 20, className = '' }) {
  return (
    <div
      className={`absolute inset-0 m-auto rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100/90 pointer-events-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        padding: '3px',
      }}
    >
      <MyMobPayMark
        style={{
          width: `${markSize}px`,
          height: `${markSize}px`,
          display: 'block',
        }}
      />
    </div>
  );
}

export default MyMobPayLogo;
