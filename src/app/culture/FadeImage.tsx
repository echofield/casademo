'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
}

export function FadeImage({ src, alt, fill, sizes, priority, className }: Props) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onLoad={() => setLoaded(true)}
      style={{
        opacity: loaded ? 1 : 0,
        transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    />
  )
}
