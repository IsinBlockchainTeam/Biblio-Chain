import { RentableBook } from '../../types/interfaces.ts'
import { blockchainService } from '../blockchain/BlockchainService.ts'
import { libraryService } from './LibraryService.ts'

/**
 * Service for handling earning rewards by returning overdue books
 */
export class EarnService {
    /**
     * Retrieves all books that are overdue and eligible for return
     * @returns Array of overdue rentable books
     */
    async getOverdueBooks(): Promise<RentableBook[]> {
        try {
            await blockchainService.connect()
            const allBookIds = await blockchainService.getAllBookIds()

            const booksPromises = allBookIds.map(id => this.checkIfBookIsOverdue(id))
            const books = await Promise.all(booksPromises)

            return books.filter((book): book is RentableBook =>
                book !== null && this.isBookOverdue(book as RentableBook)
            )
        } catch (error) {
            console.error('Error fetching overdue books:', error)
            throw new Error('Failed to fetch overdue books from blockchain')
        }
    }

    /**
     * Checks whether a specific book is rentable and overdue
     * @param bookId Book token ID
     * @returns RentableBook if overdue, otherwise null
     */
    private async checkIfBookIsOverdue(bookId: number): Promise<RentableBook | null> {
        try {
            const bookDetails = await blockchainService.getBookDetails(bookId)
            if (Number(bookDetails.bookType) !== 0) return null

            const book = await libraryService.fetchBookById(bookId) as RentableBook
            if (!book) return null

            return book
        } catch (error) {
            console.error(`Error checking if book ${bookId} is overdue:`, error)
            return null
        }
    }

    /**
     * Determines if a rentable book is overdue based on borrow date and lending period
     * @param book Rentable book object
     * @returns True if the book is overdue
     */
    private isBookOverdue(book: RentableBook): boolean {
        if (book.status !== 'Lent' || !book.borrowDate) return false

        const borrowDate = new Date(book.borrowDate)
        const dueDate = new Date(borrowDate)
        dueDate.setDate(dueDate.getDate() + book.lendingPeriod)

        return new Date() > dueDate
    }

    /**
     * Returns an overdue book and receives a reward
     * @param bookId Book token ID to return
     * @returns Amount of ETH rewarded for returning the overdue book
     */
    async returnOverdueBook(bookId: number): Promise<number> {
        try {
            await blockchainService.connect()

            const book = await libraryService.fetchBookById(bookId) as RentableBook
            if (!book || book.status !== 'Lent' || !this.isBookOverdue(book)) {
                throw new Error('Book is not overdue or not available for return')
            }

            const rewardAmount = book.depositAmount * 0.3

            await blockchainService.returnBook(bookId)

            return rewardAmount
        } catch (error) {
            console.error(`Error returning overdue book ${bookId}:`, error)
            throw new Error('Failed to return the overdue book')
        }
    }
}

/**
 * Singleton instance of EarnService
 */
export const earnService = new EarnService()
