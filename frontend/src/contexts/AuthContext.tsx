import { createContext, useContext, ReactNode, useEffect, useMemo } from 'react'
import BannedUserOverlay from '../components/features/auth/BannedUserOverlay'
import { useAuthWallet } from '../hooks/utils/useWallet.ts'

interface AuthContextType {
    walletAddress: string
    shortAddress: string
    balance: string
    isConnected: boolean
    isAdmin: boolean
    isBanned: boolean
    connectMetamask: () => Promise<void>
    connectWalletConnect: () => Promise<void>
    disconnect: () => void
    devModeLogin: () => void
}

const defaultAuthContext: AuthContextType = {
    walletAddress: '',
    shortAddress: '',
    balance: '0 ETH',
    isConnected: false,
    isAdmin: false,
    isBanned: false,
    connectMetamask: async () => {},
    connectWalletConnect: async () => {},
    disconnect: () => {},
    devModeLogin: () => {}
}

const AuthContext = createContext<AuthContextType>(defaultAuthContext)

interface AuthProviderProps {
    children: ReactNode
    devMode?: boolean
}

/**
 * AuthProvider supplies authentication state and actions to the app
 * Provides wallet address, admin status, banned state, and wallet connect functions
 */
export const AuthProvider  = ({ children, devMode = false } : AuthProviderProps) => {
    const {
        walletAddress,
        shortAddress,
        balance,
        isConnected,
        isAdmin,
        isBanned,
        connectMetamask,
        connectWalletConnect,
        devModeLogin,
        disconnect,
        initializeConnection
    } = useAuthWallet()

    useEffect(() => {
        initializeConnection(devMode).then()
    }, [devMode, initializeConnection])

    const contextValue = useMemo(() => ({
        walletAddress,
        shortAddress,
        balance,
        isConnected,
        isAdmin,
        isBanned,
        connectMetamask,
        connectWalletConnect,
        disconnect,
        devModeLogin
    }), [
        walletAddress,
        shortAddress,
        balance,
        isConnected,
        isAdmin,
        isBanned,
        connectMetamask,
        connectWalletConnect,
        disconnect,
        devModeLogin
    ])

    return (
        <AuthContext.Provider value={contextValue}>
            {isBanned ? (
                <BannedUserOverlay walletAddress={walletAddress} />
            ) : (
                children
            )}
        </AuthContext.Provider>
    )
}

/**
 * useAuth gives access to authentication state and functions
 * Must be used within an AuthProvider
 *
 * @returns AuthContextType
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
