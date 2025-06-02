import {
    AnyBookType,
    CatalogFilters,
    RentableBook,
    Transaction,
    TransactionFilters
} from '../../types/interfaces.ts'

/**
 * Service for filtering and organizing books and transactions
 */
export class FilterService {
    /**
     * Checks if a book is owned by a given wallet address
     * @param book Book to check
     * @param walletAddress Wallet address to compare
     * @returns True if the book is owned by the wallet
     */
    isOwned(book: AnyBookType, walletAddress: string): boolean {
        const cleanWallet = String(walletAddress).trim().toLowerCase()
        const cleanOwner = String(book.owner).trim().toLowerCase()

        return cleanOwner === cleanWallet
    }

    /**
     * Filters a list of books to include only those owned by the given wallet
     * @param books List of books
     * @param walletAddress Wallet address to filter by
     * @returns List of owned books
     */
    filterOwnedBooks(books: AnyBookType[], walletAddress: string): AnyBookType[] {
        books.forEach(book => {
            this.isOwned(book, walletAddress)
        })

        return books.filter(book => this.isOwned(book, walletAddress))
    }

    /**
     * Checks if a rentable book is currently borrowed by the given wallet address
     * @param book Book to check
     * @param walletAddress Wallet address to compare
     * @returns True if the book is borrowed by the wallet
     */
    isBorrowed(book: AnyBookType, walletAddress: string): boolean {
        const cleanWallet = String(walletAddress).trim().toLowerCase()
        const rBook = book as RentableBook
        const cleanBorrower = String(rBook.borrower ?? '').trim().toLowerCase()
        return cleanBorrower === cleanWallet && book.status === 'Lent'
    }

    /**
     * Filters a list of books to include only those borrowed by the given wallet
     * @param books List of books
     * @param walletAddress Wallet address to filter by
     * @returns List of borrowed books
     */
    filterBorrowedBooks(books: AnyBookType[], walletAddress: string): AnyBookType[] {
        books.forEach(book => {
            this.isBorrowed(book, walletAddress)
        })

        return books.filter(book => this.isBorrowed(book, walletAddress))
    }

    /**
     * Filters a list of transactions based on multiple criteria
     * @param transactions List of transactions
     * @param filters Filter criteria
     * @returns Filtered list of transactions
     */
    filterTransactions(
        transactions: Transaction[],
        filters: TransactionFilters
    ): Transaction[] {
        return transactions.filter(transaction => {
            if (filters.type && transaction.type !== filters.type) return false
            if (filters.status && transaction.status !== filters.status) return false
            if (filters.startDate && new Date(transaction.date) < new Date(filters.startDate)) return false
            return !(filters.endDate && new Date(transaction.date) > new Date(filters.endDate));

        })
    }

    /**
     * Filters a list of books based on catalog filter criteria
     * @param books List of books
     * @param filters Catalog filters to apply
     * @returns Filtered list of books
     */
    filterBooks(books: AnyBookType[], filters: CatalogFilters): AnyBookType[] {
        return books.filter(book => {
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase()
                const titleMatch = book.title.toLowerCase().includes(query)
                const authorMatch = book.author.toLowerCase().includes(query)
                if (!titleMatch && !authorMatch) return false
            }

            if (filters.selectedGenres.length > 0) {
                if (!filters.selectedGenres.includes(book.genre)) return false
            }

            if (filters.selectedStatuses.length > 0) {
                if (!filters.selectedStatuses.includes(book.status)) return false
            }

            const [minYear, maxYear] = filters.selectedYearRange
            return !(book.publishedYear < minYear || book.publishedYear > maxYear);


        })
    }

    /**
     * Groups books by genre
     * @param books List of books to group
     * @returns An object where keys are genres and values are arrays of books
     */
    groupBooksByGenre(books: AnyBookType[]): Record<string, AnyBookType[]> {
        return books.reduce<Record<string, AnyBookType[]>>((acc, book) => {
            if (!acc[book.genre]) {
                acc[book.genre] = []
            }
            acc[book.genre].push(book)
            return acc
        }, {})
    }
}

/**
 * Singleton instance of FilterService
 */
export const filterService = new FilterService()
