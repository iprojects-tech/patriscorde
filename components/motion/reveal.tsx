"use client"

import React from "react"

import { useRef } from "react"
import { motion, useInView, type Variants } from "framer-motion"
import { fadeInUp, fadeIn, slideInLeft, slideInRight, scaleIn, premiumEasing } from "@/lib/motion"

type RevealVariant = "fadeInUp" | "fadeIn" | "slideInLeft" | "slideInRight" | "scaleIn"

const variants: Record<RevealVariant, Variants> = {
  fadeInUp,
  fadeIn,
  slideInLeft,
  slideInRight,
  scaleIn,
}

interface RevealProps {
  children: React.ReactNode
  variant?: RevealVariant
  delay?: number
  duration?: number
  className?: string
  once?: boolean
  amount?: number
}

export function Reveal({
  children,
  variant = "fadeInUp",
  delay = 0,
  duration,
  className,
  once = true,
  amount = 0.3,
}: RevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount })

  const selectedVariant = variants[variant]
  
  const customVariant: Variants = duration
    ? {
        ...selectedVariant,
        visible: {
          ...selectedVariant.visible,
          transition: {
            duration,
            delay,
            ease: premiumEasing,
          },
        },
      }
    : {
        ...selectedVariant,
        visible: {
          ...selectedVariant.visible,
          transition: {
            ...((selectedVariant.visible as Record<string, unknown>).transition as object),
            delay,
          },
        },
      }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={customVariant}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger children reveal
interface StaggerRevealProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  once?: boolean
}

export function StaggerReveal({
  children,
  className,
  staggerDelay = 0.1,
  once = true,
}: StaggerRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: 0.2 })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: 20,
          filter: "blur(6px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.5,
            ease: premiumEasing,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
