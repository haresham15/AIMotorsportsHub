import { ImageResponse } from 'next/og'
 
export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020817', // Match the new deep slate background
          borderRadius: '20%',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="24"
          height="24"
          fill="none"
        >
          {/* Left side of 'A' (Blue) */}
          <path d="M20 80 L50 20 L60 40 L35 70 Z" fill="#0B57CF" />
          
          {/* Right side arrow of 'A' (Teal) */}
          <path d="M50 50 L75 25 L85 30 L60 80 L50 70 L65 40 Z" fill="#06B6D4" />
          <path d="M75 25 L65 20 L80 15 L85 30 Z" fill="#06B6D4" />
          
          {/* Crossbar */}
          <path d="M30 60 L60 55 L55 45 L35 50 Z" fill="#0B57CF" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
