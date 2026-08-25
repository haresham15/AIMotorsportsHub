import React from 'react';

export default function ApexisLogo({ className = "", width = 32, height = 32 }: { className?: string, width?: number, height?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      width={width} 
      height={height} 
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="apexis-blue" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0B57CF" />
          <stop offset="100%" stopColor="#083E9E" />
        </linearGradient>
        <linearGradient id="apexis-teal" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#25B9B6" />
        </linearGradient>
      </defs>
      
      {/* Left side of 'A' (Blue) */}
      <path 
        d="M20 80 L50 20 L60 40 L35 70 Z" 
        fill="url(#apexis-blue)" 
      />
      
      {/* Right side arrow of 'A' (Teal) */}
      <path 
        d="M50 50 L75 25 L85 30 L60 80 L50 70 L65 40 Z" 
        fill="url(#apexis-teal)" 
      />
      <path 
        d="M75 25 L65 20 L80 15 L85 30 Z" 
        fill="url(#apexis-teal)" 
      />
      
      {/* Crossbar */}
      <path 
        d="M30 60 L60 55 L55 45 L35 50 Z" 
        fill="url(#apexis-blue)" 
      />
    </svg>
  );
}
