import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface ClippedPanelProps extends ComponentProps<'div'> {
  tone?: 'ink' | 'tan'
}

/** Solid diagonal-cut-corner panel — the book's print-poster card shape. */
export function ClippedPanel({
  tone = 'ink',
  className,
  children,
  ...props
}: ClippedPanelProps) {
  return (
    <div
      className={cn(
        'astro-clip p-4',
        tone === 'ink'
          ? 'bg-astro-black text-astro-white'
          : 'bg-astro-off-white text-astro-black',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
