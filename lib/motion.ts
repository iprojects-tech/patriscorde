// Premium animation variants and utilities for framer-motion

export const premiumEasing = [0.22, 1, 0.36, 1] as const

export const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: premiumEasing,
    },
  },
}

export const fadeIn = {
  hidden: {
    opacity: 0,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: premiumEasing,
    },
  },
}

export const slideInLeft = {
  hidden: {
    opacity: 0,
    x: -40,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: premiumEasing,
    },
  },
}

export const slideInRight = {
  hidden: {
    opacity: 0,
    x: 40,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: premiumEasing,
    },
  },
}

export const scaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: premiumEasing,
    },
  },
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem = {
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
}

export const parallaxY = (offset: number) => ({
  y: offset,
  transition: {
    type: "spring",
    stiffness: 100,
    damping: 30,
  },
})

// Hover animations for interactive elements
export const hoverScale = {
  scale: 1.02,
  transition: {
    duration: 0.3,
    ease: premiumEasing,
  },
}

export const hoverLift = {
  y: -4,
  transition: {
    duration: 0.3,
    ease: premiumEasing,
  },
}

// Page transitions
export const pageTransition = {
  initial: {
    opacity: 0,
    y: 20,
    filter: "blur(10px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: premiumEasing,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(6px)",
    transition: {
      duration: 0.3,
      ease: premiumEasing,
    },
  },
}

// Cart/Sheet animations
export const slidePanel = {
  initial: {
    x: "100%",
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: premiumEasing,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: premiumEasing,
    },
  },
}
