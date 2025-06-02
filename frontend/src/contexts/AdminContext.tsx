import {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useMemo
} from 'react'
import { useAuth } from './AuthContext'
import {
    AdminUser,
    BlacklistedAddress,
    GovernanceProposal,
    OperationType,
    ServiceStatus
} from '../types/interfaces'
import { useAdminOperations } from '../hooks/profile/useAdminOperations.ts'

interface AdminContextType {
    services: ServiceStatus[]
    pauseAllServices: () => Promise<void>
    unpauseAllServices: () => Promise<void>
    pauseOperation: (operationType: OperationType) => Promise<void>
    unpauseOperation: (operationType: OperationType) => Promise<void>

    adminUsers: AdminUser[]
    revokeAdminPermissions: (address: string) => Promise<void>
    addNewAdmin: (address: string) => Promise<void>

    blacklistedAddresses: BlacklistedAddress[]
    removeFromBlacklist: (address: string) => Promise<void>
    addToBlacklist: (address: string) => Promise<void>

    proposals: GovernanceProposal[]
    approveProposal: (proposalId: number) => Promise<void>
    rejectProposal: (proposalId: number) => Promise<void>

    refreshData: () => Promise<void>

    isLoading: boolean
    error: string | null
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

interface AdminProviderProps {
    children: ReactNode
}

/**
 * AdminProvider gives access to admin-level controls and blockchain data
 * Only renders its children if the user has admin privileges
 */
export const AdminProvider = ({ children } : AdminProviderProps) => {
    const { walletAddress, isAdmin } = useAuth()
    const adminOps = useAdminOperations(walletAddress)

    useEffect(() => {
        if (isAdmin) {
            adminOps.refreshData()
        }
    }, [isAdmin, adminOps.refreshData])

    if (!isAdmin) return null

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const contextValue = useMemo<AdminContextType>(() => ({
        services: adminOps.services,
        pauseAllServices: adminOps.pauseAllServices,
        unpauseAllServices: adminOps.unpauseAllServices,
        pauseOperation: adminOps.pauseOperation,
        unpauseOperation: adminOps.unpauseOperation,
        adminUsers: adminOps.adminUsers,
        revokeAdminPermissions: adminOps.revokeAdminPermissions,
        addNewAdmin: adminOps.addNewAdmin,
        blacklistedAddresses: adminOps.blacklistedAddresses,
        removeFromBlacklist: adminOps.removeFromBlacklist,
        addToBlacklist: adminOps.addToBlacklist,
        proposals: adminOps.proposals,
        approveProposal: adminOps.approveProposal,
        rejectProposal: adminOps.rejectProposal,
        refreshData: adminOps.refreshData,
        isLoading: adminOps.isLoading,
        error: adminOps.error
    }), [adminOps])

    return (
        <AdminContext.Provider value={contextValue}>
            {children}
        </AdminContext.Provider>
    )
}

/**
 * useAdmin exposes all admin-related operations and blockchain service controls
 * Must be used inside an AdminProvider
 *
 * @returns AdminContextType
 */
export const useAdmin = (): AdminContextType => {
    const context = useContext(AdminContext)
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider')
    }
    return context
}
