type EthereumRequestMethod =
    | 'eth_requestAccounts'
    | 'eth_accounts'
    | 'eth_chainId'
    | 'wallet_switchEthereumChain'
    | 'wallet_addEthereumChain'
    | string;

type EthereumEventType =
    | 'accountsChanged'
    | 'chainChanged'
    | 'connect'
    | 'disconnect'
    | string;

declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: boolean;
            request: (request: {
                method: EthereumRequestMethod;
                params?: unknown[]
            }) => Promise<unknown>;
            on: (event: EthereumEventType, callback: (...args: unknown[]) => void) => void;
            removeListener: (event: EthereumEventType, callback: (...args: unknown[]) => void) => void;
        };
    }
}

// Export to make it a module
export {};