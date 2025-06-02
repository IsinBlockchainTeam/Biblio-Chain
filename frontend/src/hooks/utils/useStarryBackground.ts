import { useMemo } from 'react'

interface Star {
    id: number
    size: 'Small' | 'Medium' | 'Large'
    top: string
    left: string
    animationDelay: string
    animationDuration: string
    opacity: number
    isColored?: boolean
}

/**
 * useStarryBackground generates an array of stars with randomized styles and animations
 * Used to create animated starfield backgrounds
 *
 * @param starsCount Total number of stars to render
 * @param coloredStarsPercentage Percentage of stars that should be colored
 * @returns Array of Star objects with positioning and animation properties
 */
export const useStarryBackground = (
    starsCount: number,
    coloredStarsPercentage: number
): Star[] => {
    return useMemo(() => {
        return Array.from({ length: starsCount }, (_, i) => {
            const isColored = Math.random() * 100 < coloredStarsPercentage

            return {
                id: i,
                size: Math.random() > 0.94 ? 'Large' : Math.random() > 0.8 ? 'Medium' : 'Small',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
                opacity: 0.1 + Math.random() * 0.7,
                isColored
            }
        })
    }, [starsCount, coloredStarsPercentage])
}
