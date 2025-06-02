import { useState, useCallback } from 'react';
import { authService } from '../../services/auth/AuthService.ts';
import { blockchainService } from '../../services/blockchain/BlockchainService.ts';
import { WalletConnection } from '../../types/interfaces.ts';

/**
 * Hook for managing wallet authentication
 */
export function useAuthWallet() {

    const [walletAddress, setWalletAddress] = useState('');
    const [shortAddress, setShortAddress] = useState('');
    const [balance, setBalance] = useState('0 ETH');
    const [isConnected, setIsConnected] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isBanned, setIsBanned] = useState(false);

    /**
     * Update wallet connection state
     */
    const updateConnectionState = useCallback((connection: WalletConnection) => {
        setWalletAddress(connection.address);
        setShortAddress(connection.shortAddress);
        setBalance(connection.balance);
        setIsConnected(true);
        setIsAdmin(connection.isAdmin);
    }, []);

    /**
     * Connect using MetaMask
     */
    const connectMetamask = useCallback(async () => {
        try {
            const connection = await authService.connectMetamask();

            // Check if user is banned
            const userInfo = await blockchainService.getUserInfo(connection.address);
            if (userInfo.isBanned) {
                setWalletAddress(connection.address);
                setShortAddress(connection.shortAddress);
                setIsBanned(true);
                return;
            }

            updateConnectionState(connection);
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
        }
    }, [updateConnectionState]);

    /**
     * Connect using WalletConnect
     */
    const connectWalletConnect = useCallback(async () => {
        try {
            const connection = await authService.connectWalletConnect();

            const userInfo = await blockchainService.getUserInfo(connection.address);
            if (userInfo.isBanned) {
                setWalletAddress(connection.address);
                setShortAddress(connection.shortAddress);
                setIsBanned(true);
                return;
            }

            updateConnectionState(connection);
        } catch (error) {
            console.error('Error connecting with WalletConnect:', error);
        }
    }, [updateConnectionState]);

    /**
     * Development mode login (for testing)
     */
    const devModeLogin = useCallback(() => {
        const connection = authService.devModeLogin();
        updateConnectionState(connection);
    }, [updateConnectionState]);

    /**
     * Disconnect wallet
     */
    const disconnect = useCallback(() => {
        authService.disconnect();
        setWalletAddress('');
        setShortAddress('');
        setBalance('0 ETH');
        setIsConnected(false);
        setIsAdmin(false);
        setIsBanned(false);
    }, []);

    /**
     * Initialize connection
     */
    const initializeConnection = useCallback(async (devMode: boolean) => {
        if (devMode) {
            devModeLogin();
            return;
        }

        const savedConnection = await authService.restoreConnection();
        if (savedConnection) {
            try {
                const userInfo = await blockchainService.getUserInfo(savedConnection.address);
                if (userInfo.isBanned) {
                    setWalletAddress(savedConnection.address);
                    setShortAddress(savedConnection.shortAddress);
                    setIsBanned(true);
                    return;
                }
            } catch (error) {
                console.error('Error checking ban status:', error);
            }

            updateConnectionState(savedConnection);
        }
    }, [devModeLogin, updateConnectionState]);

    return {
        // State
        walletAddress,
        shortAddress,
        balance,
        isConnected,
        isAdmin,
        isBanned,

        // Actions
        connectMetamask,
        connectWalletConnect,
        devModeLogin,
        disconnect,
        initializeConnection
    };
}