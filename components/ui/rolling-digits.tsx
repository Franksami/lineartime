'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RollingDigitsProps {
  value: number
  className?: string
  'aria-label'?: string
}

export function RollingDigits({ value, className, 'aria-label': ariaLabel }: RollingDigitsProps) {
  const [digits, setDigits] = React.useState<string[]>(String(value).split(''))

  React.useEffect(() => {
    setDigits(String(value).split(''))
  }, [value])

  return (
    <>
      <span className={className} aria-label={ariaLabel || `${value}`}>
        {digits.map((digit, idx) => (
          <span 
            key={`${idx}-${digit}`} 
            className="rollingDigit inline-block" 
            aria-hidden="true"
          >
            <span 
              className="inline-block"
              style={{ 
                animationDelay: `${idx * 0.06}s`,
                transform: 'translateY(10%)',
                opacity: 0,
                animation: 'rollIn 0.18s ease forwards'
              }}
            >
              {digit}
            </span>
          </span>
        ))}
        <span className="sr-only">{value}</span>
      </span>

      <style jsx>{`
        .rollingDigit {
          display: inline-block;
          height: 1em;
          line-height: 1em;
          vertical-align: baseline;
          overflow: hidden;
          position: relative;
        }
        
        @keyframes rollIn {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}