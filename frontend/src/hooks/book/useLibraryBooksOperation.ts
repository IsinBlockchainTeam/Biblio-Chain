import React, { useCallback } from 'react';
import { Book, BookFormData, RentableBook, SellableBook } from '../../types/interfaces.ts';
import { libraryService } from '../../services/library/LibraryService.ts';

type AnyBookType = Book | RentableBook | SellableBook;

/**
 * Hook for handling book operations in the library
 */
export function useLibraryBooksOperations(
    walletAddress: string,
    setBooks: React.Dispatch<React.SetStateAction<AnyBookType[]>>,
    setSelectedBook: React.Dispatch<React.SetStateAction<AnyBookType | null>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
) {

    const addBook = useCallback(async (formData: BookFormData) => {
        try {
            setIsLoading(true);
            setError(null);
            const newBook = await libraryService.addBook(formData, walletAddress);
            setBooks(prev => [...prev, newBook]);
            return newBook;
        } catch (error) {
            console.error('Error adding book:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to add book';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress, setBooks, setIsLoading, setError]);


    const returnBook = useCallback(async (bookId: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const bookToReturn = await findBookById(bookId);
            if (!bookToReturn) {
                throw new Error(`Book with ID ${bookId} not found`);
            }
            const updatedBook = await libraryService.returnBook(bookToReturn as RentableBook);
            updateBookInState(updatedBook);
            return updatedBook;
        } catch (error) {
            console.error('Error returning book:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to return book';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading, setError]);


    const borrowBook = useCallback(async (bookId: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const bookToBorrow = await findBookById(bookId);
            if (!bookToBorrow) {
                throw new Error(`Book with ID ${bookId} not found`);
            }
            const updatedBook = await libraryService.borrowBook(bookToBorrow as RentableBook, walletAddress);
            updateBookInState(updatedBook);
            return updatedBook;
        } catch (error) {
            console.error('Error borrowing book:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to borrow book';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress, setIsLoading, setError]);


    const buyBook = useCallback(async (bookId: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const bookToBuy = await findBookById(bookId);
            if (!bookToBuy) {
                throw new Error(`Book with ID ${bookId} not found`);
            }
            const updatedBook = await libraryService.buyBook(bookToBuy as SellableBook, walletAddress);
            updateBookInState(updatedBook);
            return updatedBook;
        } catch (error) {
            console.error('Error buying book:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to buy book';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress, setIsLoading, setError]);


    const rateBook = useCallback(async (bookId: number, rating: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const bookToRate = await findBookById(bookId);
            if (!bookToRate) {
                throw new Error(`Book with ID ${bookId} not found`);
            }
            const updatedBook = await libraryService.rateBook(bookToRate, rating);
            updateBookInState(updatedBook);
            return updatedBook;
        } catch (error) {
            console.error('Error rating book:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to rate book';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading, setError]);


    const findBookById = useCallback(async (bookId: number): Promise<AnyBookType | null> => {
        try {
            return await libraryService.fetchBookById(bookId);
        } catch (error) {
            console.error(`Error finding book ${bookId}:`, error);
            return null;
        }
    }, []);


    const updateBookInState = useCallback((updatedBook: AnyBookType) => {
        setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
        setSelectedBook(current => current?.id === updatedBook.id ? updatedBook : current);
    }, [setBooks, setSelectedBook]);


    const refreshLibrary = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch all books from blockchain
            const fetchedBooks = await libraryService.fetchAllBooks();
            setBooks(fetchedBooks);

            // If there's a selected book, refresh its data too
            setSelectedBook(current => {
                if (!current) return null;
                const refreshedBook = fetchedBooks.find(book => book.id === current.id);
                return refreshedBook || null;
            });

            return fetchedBooks;
        } catch (error) {
            console.error('Error refreshing library:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh library';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [setBooks, setSelectedBook, setIsLoading, setError]);

    return {
        addBook,
        returnBook,
        borrowBook,
        buyBook,
        rateBook,
        refreshLibrary,
        findBookById
    };
}