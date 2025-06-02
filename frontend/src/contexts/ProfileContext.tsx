import {
    createContext,
    useContext,
    ReactNode,
    useMemo
} from 'react'
import { useLibrary } from './LibraryContext'
import { useAuth } from './AuthContext'
import {
    Book,
    RentableBook,
    SellableBook,
    Transaction,
    TransactionFilters
} from '../types/interfaces'

import { useProfileBooks } from '../hooks/profile/useProfileBooks.ts'
import { useProfileTransactions } from '../hooks/profile/useProfileTransaction.ts'

type AnyBookType = Book | RentableBook | SellableBook

interface ProfileContextType {
    filteredOwnedBooks: AnyBookType[]
    filteredBorrowedBooks: AnyBookType[]
    selectedProfileBook: AnyBookType | null
    selectProfileBook: (book: AnyBookType | null) => void

    transactions: Transaction[]
    loadTransactions: (filters?: TransactionFilters) => Promise<void>
    isTransactionsLoading: boolean
    transactionFilters: TransactionFilters
    setTransactionFilters: (filters: TransactionFilters) => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

interface ProfileProviderProps {
    children: ReactNode
}
/**
 * ProfileProvider wraps components that need access to profile-related data
 * It provides books (owned/borrowed), transactions, and selection state
 */
export const ProfileProvider = ({ children } :ProfileProviderProps) => {
    const { ownedBooks, borrowedBooks } = useLibrary()
    const { walletAddress } = useAuth()

    const {
        transactions,
        loadTransactions,
        isTransactionsLoading,
        transactionFilters,
        setTransactionFilters
    } = useProfileTransactions(walletAddress)

    const {
        filteredOwnedBooks,
        filteredBorrowedBooks,
        selectedProfileBook,
        selectProfileBook
    } = useProfileBooks(ownedBooks, borrowedBooks, walletAddress)

    const contextValue = useMemo<ProfileContextType>(() => ({
        filteredOwnedBooks,
        filteredBorrowedBooks,
        selectedProfileBook,
        selectProfileBook,
        transactions,
        loadTransactions,
        isTransactionsLoading,
        transactionFilters,
        setTransactionFilters
    }), [
        filteredOwnedBooks,
        filteredBorrowedBooks,
        selectedProfileBook,
        selectProfileBook,
        transactions,
        loadTransactions,
        isTransactionsLoading,
        transactionFilters,
        setTransactionFilters
    ])

    return (
        <ProfileContext.Provider value={contextValue}>
            {children}
        </ProfileContext.Provider>
    )
}

/**
 * useProfile is a custom hook to access the profile context
 * Must be used inside a ProfileProvider
 *
 * @returns ProfileContextType with book and transaction state
 */
export const useProfile = (): ProfileContextType => {
    const context = useContext(ProfileContext)
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider')
    }
    return context
}
