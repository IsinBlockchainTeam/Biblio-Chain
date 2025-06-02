import { ethers } from 'ethers';
import { ProviderConnection } from '../../types/interfaces.ts';
import { CHAIN_ID } from '../../types/costants.ts';

/**
 * Service for handling MetaMask wallet connections.
 */
export class MetamaskService {
    /**
     * Formats an Ethereum wallet address to a shorter representation.
     * @param address - The full Ethereum address.
     * @returns The shortened address (e.g., 0xAbc...1234).
     */
    formatAddress(address: string): string {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    /**
     * Connects the user to MetaMask and requests wallet access.
     * Switches the network to the required CHAIN_ID if needed.
     * Retrieves the account address and balance.
     * @returns ProviderConnection object with formatted address and balance.
     * @throws If MetaMask is not installed or connection fails.
     */
    async connectMetamask(): Promise<ProviderConnection> {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            }) as string[];

            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();

            if (network.chainId !== BigInt(CHAIN_ID)) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }]
                    });
                } catch (switchError) {
                    // Optional: handle network switch error
                }
            }

            const address = accounts[0];
            const balanceBN = await provider.getBalance(address);
            const balance = ethers.formatEther(balanceBN);

            return {
                address,
                shortAddress: this.formatAddress(address),
                balance: `${parseFloat(balance).toFixed(4)} ETH`,
            };
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
            throw error;
        }
    }
}

/** Singleton instance of MetamaskService */
export const metamaskService = new MetamaskService();
