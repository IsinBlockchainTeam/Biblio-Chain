import { useEffect, useRef } from 'react'

/**
 * useAutoPlay runs a callback repeatedly with a given delay
 * Can be paused dynamically by toggling the isPaused flag
 *
 * @param callback Function to be called at each interval tick
 * @param delay Interval duration in milliseconds
 * @param isPaused Whether the autoplay should be paused
 */
export function useAutoPlay(callback: () => void, delay: number, isPaused: boolean) {
    const savedCallback = useRef(callback)

    useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    useEffect(() => {
        if (isPaused) return
        const tick = () => savedCallback.current()
        const interval = setInterval(tick, delay)
        return () => clearInterval(interval)
    }, [delay, isPaused])
}
