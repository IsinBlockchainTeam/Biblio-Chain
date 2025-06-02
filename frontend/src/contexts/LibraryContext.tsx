import {
    createContext,
    ReactNode,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo
} from 'react'
import { Book, BookFormData, CatalogFilters, RentableBook, SellableBook } from '../types/interfaces'
import { useAuth } from './AuthContext'

import { useLibraryMetadata } from '../hooks/book/useLibraryMetadata.ts'
import { filterService } from '../services/library/FilterService'
import { useLibraryBooksOperations } from '../hooks/book/useLibraryBooksOperation.ts'
import { useLibraryFilters } from '../hooks/book/useLibraryFilter.ts'

type AnyBookType = Book | RentableBook | SellableBook

export interface LibraryContextType {
    allBooks: AnyBookType[]
    ownedBooks: AnyBookType[]
    borrowedBooks: AnyBookType[]
    getBookById: (id: number) => AnyBookType | undefined

    selectedBook: AnyBookType | null
    selectBook: (book: AnyBookType | null) => void

    isBookOwner: (book: AnyBookType | null) => boolean
    isBookBorrower: (book: AnyBookType | null) => boolean
    hasUserRatedBook: (book: AnyBookType | null) => boolean

    addBook: (book: BookFormData) => Promise<AnyBookType>
    returnBook: (bookId: number) => Promise<AnyBookType>
    borrowBook: (bookId: number) => Promise<AnyBookType>
    buyBook: (bookId: number) => Promise<AnyBookType>
    refreshLibrary: () => Promise<AnyBookType[]>
    rateBook: (bookId: number, rating: number) => Promise<AnyBookType>
    precalculateBookMetadata: (bookId: number) => Promise<{
        isOwner: boolean
        isBorrower: boolean
        hasRated: boolean
    } | null | undefined>

    filteredBooks: AnyBookType[]
    booksByGenre: Record<string, AnyBookType[]>

    filters: CatalogFilters
    setSearchQuery: (query: string) => void
    setSelectedGenres: (genres: string[]) => void
    setSelectedStatuses: (statuses: string[]) => void
    setSelectedYearRange: (range: [number, number]) => void
    clearAllFilters: () => void

    viewMode: 'grid' | 'list'
    setViewMode: (mode: 'grid' | 'list') => void
    isFiltersOpen: boolean
    setIsFiltersOpen: (isOpen: boolean) => void

    getUniqueGenres: () => string[]
    getYearRange: () => [number, number]

    isLoading: boolean
    error: string | null
}

type LibraryProviderProps = {
    children: ReactNode;
};
export const LibraryContext = createContext<LibraryContextType | undefined>(undefined)

/**
 * LibraryProvider wraps the application and provides state for books, filters, metadata, and catalog operations
 */
export const LibraryProvider = ({ children } : LibraryProviderProps) => {
    const { walletAddress } = useAuth()

    const [books, setBooks] = useState<AnyBookType[]>([])
    const [selectedBook, setSelectedBook] = useState<AnyBookType | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const {
        addBook,
        returnBook,
        borrowBook,
        buyBook,
        rateBook,
        refreshLibrary
    } = useLibraryBooksOperations(walletAddress, setBooks, setSelectedBook, setIsLoading, setError)

    const {
        filters,
        filteredBooks,
        booksByGenre,
        isFiltersOpen,
        setIsFiltersOpen,
        setSearchQuery,
        setSelectedGenres,
        setSelectedStatuses,
        setSelectedYearRange,
        clearAllFilters,
        getUniqueGenres,
        getYearRange
    } = useLibraryFilters(books)

    const {
        isBookOwner,
        isBookBorrower,
        hasUserRatedBook,
        precalculateBookMetadata
    } = useLibraryMetadata(books, setBooks, walletAddress)

    const ownedBooks = useMemo(
        () => filterService.filterOwnedBooks(books, walletAddress),
        [books, walletAddress]
    )

    const borrowedBooks = useMemo(
        () => filterService.filterBorrowedBooks(books, walletAddress),
        [books, walletAddress]
    )

    const getBookById = useCallback(
        (id: number) => books.find(book => book.id === id),
        [books]
    )

    const selectBook = useCallback(
        async (book: AnyBookType | null) => {
            if (!book) {
                setSelectedBook(null)
                return
            }

            try {
                if ('_metadata' in book) {
                    setSelectedBook(book)
                    return
                }
                await precalculateBookMetadata(book.id)
                setSelectedBook(book)
            } catch (error) {
                console.error('Error selecting book:', error)
                setSelectedBook(book)
            }
        },
        [precalculateBookMetadata]
    )

    useEffect(() => {
        refreshLibrary().then()
    }, [refreshLibrary])

    const contextValue = useMemo<LibraryContextType>(() => ({
        allBooks: books,
        ownedBooks,
        borrowedBooks,
        getBookById,
        selectedBook,
        selectBook,
        isBookOwner,
        isBookBorrower,
        hasUserRatedBook,
        addBook,
        returnBook,
        borrowBook,
        buyBook,
        refreshLibrary,
        rateBook,
        precalculateBookMetadata,
        filteredBooks,
        booksByGenre,
        filters,
        setSearchQuery,
        setSelectedGenres,
        setSelectedStatuses,
        setSelectedYearRange,
        clearAllFilters,
        viewMode,
        setViewMode,
        isFiltersOpen,
        setIsFiltersOpen,
        getUniqueGenres,
        getYearRange,
        isLoading,
        error
    }), [
        books, ownedBooks, borrowedBooks, getBookById,
        selectedBook, selectBook,
        isBookOwner, isBookBorrower, hasUserRatedBook,
        addBook, returnBook, borrowBook, buyBook, refreshLibrary, rateBook, precalculateBookMetadata,
        filteredBooks, booksByGenre,
        filters, setSearchQuery, setSelectedGenres, setSelectedStatuses, setSelectedYearRange, clearAllFilters,
        viewMode, setViewMode, isFiltersOpen, setIsFiltersOpen,
        getUniqueGenres, getYearRange,
        isLoading, error
    ])

    return (
        <LibraryContext.Provider value={contextValue}>
            {children}
        </LibraryContext.Provider>
    )
}

/**
 * useLibrary provides access to the library context
 * Must be used inside a LibraryProvider
 *
 * @returns LibraryContextType with all books, filters, and catalog logic
 */
export const useLibrary = (): LibraryContextType => {
    const context = useContext(LibraryContext)
    if (context === undefined) {
        throw new Error('useLibrary must be used within a LibraryProvider')
    }
    return context
}
