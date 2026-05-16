'use client'
import clsx from 'clsx'
import React from 'react'

const LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'en'
const letters = LOCALE === 'en' ? 'ZJ' : LOCALE.toUpperCase()

export function LogoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 60 30"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={clsx('h-6 w-auto fill-current', props.className)}
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="20"
        fontWeight="300"
        letterSpacing="4"
        fill="currentColor"
      >
        {letters}
      </text>
    </svg>
  )
}
