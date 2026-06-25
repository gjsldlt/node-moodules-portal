/**
 * ReducedMotionProvider
 *
 * Convention: every animated Client Component MUST call `useReducedMotion()`
 * from framer-motion and disable or soften motion when it returns true.
 *
 * Example usage:
 *
 *   import { useReducedMotion } from 'framer-motion'
 *
 *   function MyAnimatedComponent() {
 *     const shouldReduce = useReducedMotion()
 *     const variants = {
 *       hidden: { opacity: 0, y: shouldReduce ? 0 : 22 },
 *       visible: { opacity: 1, y: 0 },
 *     }
 *     // ...
 *   }
 *
 * This file re-exports `useReducedMotion` so it can be imported from a single
 * location if the team prefers. Direct imports from 'framer-motion' are also fine.
 */
export { useReducedMotion } from 'framer-motion'
