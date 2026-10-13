'use client'

import * as React from 'react'
import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
}

/**
 * StaggerGroup — wraps a list of children so each direct child animates in
 * with a small stagger on mount. Reduced-motion is handled globally by the
 * `<MotionConfig reducedMotion="user">` wrapper in
 * `src/components/motion-config-provider.tsx` (imported via layout.tsx);
 * CSS keyframe animations are covered by the `@media (prefers-reduced-motion)`
 * block in globals.css.
 */
export function StaggerGroup({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerItem — a single item inside a StaggerGroup. Wrap each card.
 */
export const StaggerItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function StaggerItem({ children, className, ...props }, ref) {
  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      className={cn('h-full', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
})
