'use client'
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'en'
const letters = LOCALE === 'en' ? 'ZJ' : LOCALE.toUpperCase()

export const Logo = () => {
  return (
    <svg viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="28"
        fontWeight="300"
        letterSpacing="6"
        fill="currentColor"
      >
        {letters}
      </text>
    </svg>
  )
}
