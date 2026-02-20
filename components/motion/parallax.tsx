"use client"

import React from "react"

import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

interface ParallaxProps {
  children: React.ReactNode
  offset?: number
  className?: string
}

export function Parallax({ children, offset = 50, className }: ParallaxProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30, restDelta: 0.001 })

  return (
    <motion.div ref={ref} style={{ y: smoothY }} className={className}>
      {children}
    </motion.div>
  )
}

interface ParallaxImageProps {
  src: string
  alt: string
  offset?: number
  className?: string
  containerClassName?: string
}

export function ParallaxImage({
  src,
  alt,
  offset = 80,
  className,
  containerClassName,
}: ParallaxImageProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.05, 1])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30, restDelta: 0.001 })
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30, restDelta: 0.001 })

  return (
    <div ref={ref} className={`overflow-hidden ${containerClassName || ""}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y: smoothY, scale: smoothScale }}
        className={`w-full h-full object-cover ${className || ""}`}
      />
    </div>
  )
}

interface ParallaxTextProps {
  children: React.ReactNode
  offset?: number
  className?: string
}

export function ParallaxText({ children, offset = 30, className }: ParallaxTextProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [offset, 0])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 1])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 })

  return (
    <motion.div
      ref={ref}
      style={{ y: smoothY, opacity: smoothOpacity }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
