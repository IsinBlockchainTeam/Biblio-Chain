import { useState, useEffect } from 'react'
import { serviceAvailabilityService } from '../../services/library/AvailabilityService.ts'
import { OperationType } from '../../types/interfaces.ts'

/**
 * useServiceStatus checks whether a specific operation is currently paused
 *
 * @param operationType The operation to check (e.g. Rentable, Sellable)
 * @returns An object containing pause status and loading state
 */
export function useServiceStatus(operationType: OperationType) {
    const [isPaused, setIsPaused] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkServiceStatus = async () => {
            try {
                setIsLoading(true)
                const paused = await serviceAvailabilityService.isOperationPaused(operationType)
                setIsPaused(paused)
            } catch (error) {
                console.error(`Error checking service status for operation ${operationType}:`, error)
            } finally {
                setIsLoading(false)
            }
        }

        checkServiceStatus()
    }, [operationType])

    return { isPaused, isLoading }
}

/**
 * useAllServicesStatus checks whether all platform operations are currently paused
 *
 * @returns An object containing global pause status and loading state
 */
export function useAllServicesStatus() {
    const [isAllPaused, setIsAllPaused] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAllServicesStatus = async () => {
            try {
                setIsLoading(true)
                const allPaused = await serviceAvailabilityService.areAllPaused()
                setIsAllPaused(allPaused)
            } catch (error) {
                console.error('Error checking global service status:', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkAllServicesStatus().then();
    }, [])

    return { isAllPaused, isLoading }
}
