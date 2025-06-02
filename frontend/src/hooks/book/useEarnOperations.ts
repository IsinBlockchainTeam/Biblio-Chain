import { useState, useCallback } from 'react';
import { RentableBook } from '../../types/interfaces.ts';
import { earnService } from '../../services/library/EarnService.ts';

/**
 * Hook for managing earn operations related to overdue books
 */
export function useEarnOperations(isConnected: boolean) {

    const [overdueBooks, setOverdueBooks] = useState<RentableBook[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Calculate reward amount (30% of the deposit)
     */
    const calculateRewardAmount = useCallback((depositAmount: number): number => {
        return depositAmount * 0.3;
    }, []);

    /**
     * Refresh the list of overdue books
     */
    const refreshOverdueBooks = useCallback(async (): Promise<void> => {
        if (!isConnected) {
            setOverdueBooks([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Fetch overdue books from service
            const books = await earnService.getOverdueBooks();
            setOverdueBooks(books);
        } catch (error) {
            console.error('Error fetching overdue books:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [isConnected]);

    /**
     * Return an overdue book and earn reward
     */
    const returnOverdueBook = useCallback(async (bookId: number): Promise<number> => {
        if (!isConnected) {
            throw new Error('You must be connected to return books');
        }

        try {
            const rewardAmount = await earnService.returnOverdueBook(bookId);

            setOverdueBooks(prev => prev.filter(book => book.id !== bookId));

            return rewardAmount;
        } catch (error) {
            console.error('Error returning overdue book:', error);
            throw error;
        }
    }, [isConnected]);

    return {
        // State
        overdueBooks,
        isLoading,
        error,

        // Actions
        calculateRewardAmount,
        refreshOverdueBooks,
        returnOverdueBook
    };
}