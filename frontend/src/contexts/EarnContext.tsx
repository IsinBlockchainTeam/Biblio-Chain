import { createContext, useContext, ReactNode, useEffect, useMemo } from 'react'
import { RentableBook } from '../types/interfaces'
import { useAuth } from './AuthContext'
import { useEarnOperations } from '../hooks/book/useEarnOperations.ts'

interface EarnContextType {
    overdueBooks: RentableBook[]
    returnOverdueBook: (bookId: number) => Promise<number>
    refreshOverdueBooks: () => Promise<void>
    calculateRewardAmount: (depositAmount: number) => number
    isLoading: boolean
    error: string | null
}

const EarnContext = createContext<EarnContextType | undefined>(undefined)

interface EarnContextProviderProps {
    children: ReactNode;
}
/**
 * EarnProvider supplies context for overdue book actions and state
 * Should wrap any components that use the useEarn hook
 */
export const EarnProvider = ({ children } : EarnContextProviderProps) => {
    const { walletAddress, isConnected } = useAuth()
    const earnOps = useEarnOperations(isConnected)

    useEffect(() => {
        if (isConnected) {
            earnOps.refreshOverdueBooks()
        }
    }, [isConnected, walletAddress, earnOps.refreshOverdueBooks])

    const contextValue = useMemo<EarnContextType>(() => ({
        overdueBooks: earnOps.overdueBooks,
        returnOverdueBook: earnOps.returnOverdueBook,
        refreshOverdueBooks: earnOps.refreshOverdueBooks,
        calculateRewardAmount: earnOps.calculateRewardAmount,
        isLoading: earnOps.isLoading,
        error: earnOps.error
    }), [
        earnOps.overdueBooks,
        earnOps.returnOverdueBook,
        earnOps.refreshOverdueBooks,
        earnOps.calculateRewardAmount,
        earnOps.isLoading,
        earnOps.error
    ])

    return (
        <EarnContext.Provider value={contextValue}>
            {children}
        </EarnContext.Provider>
    )
}

/**
 * useEarn provides access to earn-related functionality and state
 * Must be used inside an EarnProvider
 *
 * @returns EarnContextType with book list, actions, and status
 */
export const useEarn = (): EarnContextType => {
    const context = useContext(EarnContext)
    if (context === undefined) {
        throw new Error('useEarn must be used within an EarnProvider')
    }
    return context
}
