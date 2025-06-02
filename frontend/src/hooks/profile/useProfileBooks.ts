import { useState, useCallback, useMemo } from 'react';
import { Book, RentableBook, SellableBook } from '../../types/interfaces.ts';
import { filterService } from '../../services/library/FilterService.ts';

type AnyBookType = Book | RentableBook | SellableBook;

/**
 * Hook for managing books in the user profile
 */
export function useProfileBooks(ownedBooks: AnyBookType[], borrowedBooks: AnyBookType[], walletAddress: string) {
    const [selectedProfileBook, setSelectedProfileBook] = useState<AnyBookType | null>(null);

    const filteredOwnedBooks = useMemo(() =>
            filterService.filterOwnedBooks(ownedBooks, walletAddress),
        [ownedBooks, walletAddress]
    );

    const filteredBorrowedBooks = useMemo(() =>
            filterService.filterBorrowedBooks(borrowedBooks, walletAddress),
        [borrowedBooks, walletAddress]
    );

    /**
     * Select a book in the profile view
     */
    const selectProfileBook = useCallback((book: AnyBookType | null) => {
        setSelectedProfileBook(book);
    }, []);

    return {
        filteredOwnedBooks,
        filteredBorrowedBooks,
        selectedProfileBook,
        selectProfileBook
    };
}