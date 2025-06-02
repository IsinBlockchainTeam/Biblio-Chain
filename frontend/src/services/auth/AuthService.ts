import { metamaskService } from './MetamaskService.ts';
import { walletConnectService } from './WalletConnectService.ts';
import { blockchainService } from '../blockchain/BlockchainService.ts';
import { ethers } from 'ethers';
import { WalletConnection } from '../../types/interfaces.ts';

/**
 * Service handling wallet authentication and connection logic.
 */
export class AuthService {
    /**
     * Connects the user using MetaMask.
     * Registers the user on-chain if not already registered.
     * Stores the wallet type in localStorage.
     * @returns WalletConnection object with user details and admin status.
     */
    async connectMetamask(): Promise<WalletConnection> {
        try {
            const providerConnection = await metamaskService.connectMetamask();

            if (!await blockchainService.isUserRegistered(providerConnection.address)) {
                await blockchainService.registerUser();
            }

            localStorage.setItem('walletType', 'metamask');

            const isAdmin = await blockchainService.isUserAdmin(providerConnection.address);
            return {
                ...providerConnection,
                isAdmin,
            };
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
            throw error;
        }
    }

    /**
     * Connects the user using WalletConnect.
     * Registers the user on-chain if not already registered.
     * Stores the wallet type in localStorage.
     * @returns WalletConnection object with user details and admin status.
     */
    async connectWalletConnect(): Promise<WalletConnection> {
        try {
            const providerConnection = await walletConnectService.connectWalletConnect();

            if (!await blockchainService.isUserRegistered(providerConnection.address)) {
                await blockchainService.registerUser();
            }

            localStorage.setItem('walletType', 'walletconnect');

            return {
                ...providerConnection,
                isAdmin: await blockchainService.isUserAdmin(providerConnection.address),
            };
        } catch (error) {
            console.error('Error connecting to WalletConnect:', error);
            throw error;
        }
    }

    /**
     * Development-only login method.
     * Provides a static wallet connection object.
     * @returns Mock WalletConnection for development purposes.
     */
    devModeLogin(): WalletConnection {
        const devAddress = '0xDEV000000000000000000000000000000DEV1234';

        return {
            address: devAddress,
            shortAddress: this.formatAddress(devAddress),
            balance: '99.99 ETH',
            isAdmin: true,
        };
    }

    /**
     * Formats an Ethereum wallet address for display.
     * @param address - Full Ethereum address
     * @returns Formatted short address (e.g., 0xABCD...1234)
     */
    formatAddress(address: string): string {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    /**
     * Attempts to restore the previous wallet connection from localStorage.
     * Includes logic for MetaMask and WalletConnect recovery.
     * @returns WalletConnection or null if restoration fails.
     */
    async restoreConnection(): Promise<WalletConnection | null> {
        const walletType = localStorage.getItem('walletType');
        const address = localStorage.getItem('walletAddress') || '';
        const isAdminStored = localStorage.getItem('isAdmin') === 'true';

        try {
            if (walletType === 'walletconnect') {
                let providerConnection = null;

                if (!walletConnectService.isConnected()) {
                    const reconnected = await walletConnectService.reconnect();
                    if (!reconnected) return null;
                }

                providerConnection = await walletConnectService.restoreConnection();
                if (!providerConnection) return null;

                return {
                    ...providerConnection,
                    isAdmin: await blockchainService.isUserAdmin(providerConnection.address),
                };
            }

            if (walletType === 'metamask' && typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];

                if (accounts && accounts.length > 0) {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const balanceBN = await provider.getBalance(accounts[0]);
                    const balance = ethers.formatEther(balanceBN);

                    return {
                        address: accounts[0],
                        shortAddress: this.formatAddress(accounts[0]),
                        balance: `${parseFloat(balance).toFixed(4)} ETH`,
                        isAdmin: await blockchainService.isUserAdmin(accounts[0]),
                    };
                }
            }

            const isConnected = localStorage.getItem('walletConnected') === 'true';
            if (isConnected) {
                const balance = await this.getWalletBalance(address);
                return {
                    address,
                    shortAddress: this.formatAddress(address),
                    balance,
                    isAdmin: isAdminStored,
                };
            }

            return null;
        } catch (e) {
            console.error('Error restoring wallet connection:', e);
            return null;
        }
    }

    /**
     * Retrieves the wallet balance in ETH for a given address.
     * @param address - Ethereum wallet address
     * @returns Balance as formatted string with ETH suffix
     */
    async getWalletBalance(address: string): Promise<string> {
        try {
            let provider: ethers.BrowserProvider | null = null;
            const walletType = localStorage.getItem('walletType');

            if (walletType === 'walletconnect') {
                const providerInstance = walletConnectService.getProvider();
                if (!providerInstance) {
                    const reconnected = await walletConnectService.reconnect();
                    if (!reconnected) throw new Error('Provider unavailable');
                    provider = reconnected;
                } else {
                    provider = new ethers.BrowserProvider(providerInstance);
                }
            } else if (walletType === 'metamask' && typeof window.ethereum !== 'undefined') {
                provider = new ethers.BrowserProvider(window.ethereum);
            }

            if (!provider) throw new Error('Provider unavailable');

            const balanceBN = await provider.getBalance(address);
            return `${parseFloat(ethers.formatEther(balanceBN)).toFixed(4)} ETH`;
        } catch (err) {
            console.error('Error retrieving wallet balance:', err);
            return '0.0000 ETH';
        }
    }

    /**
     * Disconnects the wallet by clearing stored connection data.
     */
    disconnect(): void {
        localStorage.removeItem('walletType');
    }
}

/** Singleton instance of AuthService */
export const authService = new AuthService();
