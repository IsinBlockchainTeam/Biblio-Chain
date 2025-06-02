import { useState, useCallback } from 'react';
import { Transaction, TransactionFilters } from '../../types/interfaces.ts';
import { blockchainService } from '../../services/blockchain/BlockchainService.ts';
import { filterService } from '../../services/library/FilterService.ts';

/**
 * Hook for managing user transactions in the profile
 */
export function useProfileTransactions(walletAddress: string) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
    const [transactionFilters, setTransactionFilters] = useState<TransactionFilters>({});

    /**
     * Load user transactions from blockchain with optional filtering
     */
    const loadTransactions = useCallback(async (filters?: TransactionFilters) => {
        if (!walletAddress) {
            setTransactions([]);
            return;
        }

        try {
            setIsTransactionsLoading(true);

            const loadedTransactions = await blockchainService.getUserTransactionsFromEvents(walletAddress);

            const filteredTransactions = filters
                ? filterService.filterTransactions(loadedTransactions, filters)
                : loadedTransactions;

            setTransactions(filteredTransactions);

            if (filters) {
                setTransactionFilters(filters);
            }

        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setIsTransactionsLoading(false);
        }
    }, [walletAddress]);

    return {
        transactions,
        loadTransactions,
        isTransactionsLoading,
        transactionFilters,
        setTransactionFilters
    };
}