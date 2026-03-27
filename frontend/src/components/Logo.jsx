export default function Logo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />

      {/* Lines from center to each of the 6 dots (reach / connections) */}
      <line x1="20" y1="20" x2="20" y2="5"   stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="20" y1="20" x2="33" y2="12.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="20" y1="20" x2="33" y2="27.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="20" y1="20" x2="20" y2="35"   stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="20" y1="20" x2="7"  y2="27.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <line x1="20" y1="20" x2="7"  y2="12.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

      {/* 6 outer circles — six zeros = 1,000,000 people */}
      <circle cx="20"  cy="5"    r="2.8" fill="rgba(255,255,255,0.55)" />
      <circle cx="33"  cy="12.5" r="2.8" fill="rgba(255,255,255,0.55)" />
      <circle cx="33"  cy="27.5" r="2.8" fill="rgba(255,255,255,0.55)" />
      <circle cx="20"  cy="35"   r="2.8" fill="rgba(255,255,255,0.55)" />
      <circle cx="7"   cy="27.5" r="2.8" fill="rgba(255,255,255,0.55)" />
      <circle cx="7"   cy="12.5" r="2.8" fill="rgba(255,255,255,0.55)" />

      {/* Center "1" — the founder */}
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Georgia', serif"
        fontSize="16"
        fontWeight="bold"
        fill="white"
      >
        1
      </text>
    </svg>
  )
}
