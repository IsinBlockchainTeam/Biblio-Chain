import { useState } from 'react'
import { Book } from '../../types/interfaces.ts'

type TransactionType = 'borrow' | 'buy' | 'return' | 'rate'

/**
 * useTransactionModal manages the state for opening and closing a transaction modal
 * It tracks the type of transaction, the selected book, and the modal position for animation
 */
export function useTransactionModal() {
    const [showTransaction, setShowTransaction] = useState(false)
    const [transactionType, setTransactionType] = useState<TransactionType>('borrow')
    const [selectedBook, setSelectedBook] = useState<Book | null>(null)
    const [coverPosition, setCoverPosition] = useState<{
        top: number
        left: number
        width: number
        height: number
    } | null>(null)

    const openTransaction = (
        type: TransactionType,
        book: Book,
        position: { top: number; left: number; width: number; height: number }
    ) => {
        setTransactionType(type)
        setSelectedBook(book)
        setCoverPosition(position)
        setShowTransaction(true)
    }

    const closeTransaction = () => {
        setShowTransaction(false)
        setCoverPosition(null)
    }

    return {
        showTransaction,
        transactionType,
        selectedBook,
        coverPosition,
        openTransaction,
        closeTransaction
    }
}
