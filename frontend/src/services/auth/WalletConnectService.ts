import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";
import { ProviderConnection } from "../../types/interfaces.ts";
import {
    CHAIN_ID,
    WALLET_CONNECT_PROJECT_ID,
    WALLET_CONNECT_RC_LINK
} from "../../types/costants.ts";

/**
 * Service for managing WalletConnect connections.
 */
class WalletConnectService {
    private provider: EthereumProvider | null = null;

    /**
     * Formats an Ethereum address into a shortened version.
     * @param address - The full Ethereum address.
     * @returns A short string version of the address (e.g., 0xAbcd...1234).
     */
    formatAddress(address: string): string {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    /**
     * Initializes and connects the user via WalletConnect.
     * Opens the QR modal for user confirmation.
     * @returns ProviderConnection with address and balance info.
     */
    async connectWalletConnect(): Promise<ProviderConnection> {
        if (!this.provider) {
            this.provider = await EthereumProvider.init({
                projectId: WALLET_CONNECT_PROJECT_ID,
                chains: [CHAIN_ID],
                rpcMap: {
                    11155111: WALLET_CONNECT_RC_LINK
                },
                showQrModal: true
            });
        }

        await this.provider.enable();

        const ethersProvider = new ethers.BrowserProvider(this.provider);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        const balanceBN = await ethersProvider.getBalance(address);
        const balance = ethers.formatEther(balanceBN);

        return {
            address,
            shortAddress: this.formatAddress(address),
            balance: `${parseFloat(balance).toFixed(4)} ETH`
        };
    }

    /**
     * Attempts to reconnect a WalletConnect session without showing the QR modal.
     * @returns An ethers provider or null if reconnection fails.
     */
    async reconnect(): Promise<ethers.BrowserProvider | null> {
        if (this.provider) {
            return new ethers.BrowserProvider(this.provider);
        }

        try {
            const provider = await EthereumProvider.init({
                projectId: WALLET_CONNECT_PROJECT_ID,
                chains: [CHAIN_ID],
                rpcMap: {
                    11155111: WALLET_CONNECT_RC_LINK
                },
                showQrModal: false
            });

            await provider.enable();
            this.provider = provider;

            return new ethers.BrowserProvider(provider);
        } catch (err) {
            console.error("Error restoring WalletConnect session:", err);
            return null;
        }
    }

    /**
     * Restores an existing WalletConnect connection.
     * @returns ProviderConnection or null if not available.
     */
    async restoreConnection(): Promise<ProviderConnection | null> {
        if (!this.provider) return null;

        const ethersProvider = new ethers.BrowserProvider(this.provider);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        const balanceBN = await ethersProvider.getBalance(address);
        const balance = ethers.formatEther(balanceBN);

        return {
            address,
            shortAddress: this.formatAddress(address),
            balance: `${parseFloat(balance).toFixed(4)} ETH`
        };
    }

    /**
     * Checks whether WalletConnect is currently connected.
     * @returns True if a provider instance is available.
     */
    isConnected(): boolean {
        return !!this.provider;
    }

    /**
     * Returns the raw WalletConnect provider instance.
     * @returns EthereumProvider or null.
     */
    getProvider(): EthereumProvider | null {
        return this.provider;
    }
}

/** Singleton instance of WalletConnectService */
export const walletConnectService = new WalletConnectService();
