import React, { useCallback } from 'react';
import { Book, RentableBook, SellableBook } from '../../types/interfaces.ts';
import { filterService } from '../../services/library/FilterService.ts';
import { blockchainService } from '../../services/blockchain/BlockchainService.ts';

type AnyBookType = Book | RentableBook | SellableBook;
type BookWithMetadata = AnyBookType & {
    _metadata?: {
        isOwner: boolean;
        isBorrower: boolean;
        hasRated: boolean;
    }
};

/**
 * Hook for handling book metadata in the library
 */
export function useLibraryMetadata(
    books: BookWithMetadata[],
    setBooks: React.Dispatch<React.SetStateAction<BookWithMetadata[]>>,
    walletAddress: string
) {

    const isBookOwner = useCallback((book: AnyBookType | null): boolean => {
        if (!book || !walletAddress) return false;
        return filterService.isOwned(book, walletAddress);
    }, [walletAddress]);

    const isBookBorrower = useCallback((book: AnyBookType | null): boolean => {
        if (!book || !walletAddress) return false;
        return filterService.isBorrowed(book, walletAddress);
    }, [walletAddress]);

    const hasUserRatedBook = useCallback((book: AnyBookType | null): boolean => {
        if (!book) return false;

        const bookWithMeta = book as BookWithMetadata;
        if (bookWithMeta._metadata) {
            return bookWithMeta._metadata.hasRated;
        }

        return false;
    }, []);

    const precalculateBookMetadata = useCallback(async (bookId: number) => {
        try {
            const bookToUpdate = books.find(b => b.id === bookId);
            if (!bookToUpdate || !walletAddress) return null;

            const isOwner = filterService.isOwned(bookToUpdate, walletAddress);
            const isBorrower = filterService.isBorrowed(bookToUpdate, walletAddress);

            // Check if user has rated the book
            let hasRated = false;
            try {
                hasRated = await blockchainService.hasRated(bookId, walletAddress);
            } catch (error) {
                console.error(`Error checking if user has rated book ${bookId}:`, error);
            }

            const metadata = {
                isOwner,
                isBorrower,
                hasRated
            };

            setBooks(prevBooks => prevBooks.map(book => {
                if (book.id === bookId) {
                    return {
                        ...book,
                        _metadata: metadata
                    };
                }
                return book;
            }));

            return metadata;
        } catch (error) {
            console.error(`Error precalculating metadata for book ${bookId}:`, error);
            return null;
        }
    }, [books, walletAddress, setBooks]);

    return {
        isBookOwner,
        isBookBorrower,
        hasUserRatedBook,
        precalculateBookMetadata
    };
}