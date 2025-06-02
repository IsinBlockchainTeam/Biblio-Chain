
import { useState, useCallback } from 'react';
import { blockchainAdminService } from '../../services/blockchain/BlockchainAdminService.ts';
import { serviceAvailabilityService } from "../../services/library/AvailabilityService.ts";
import {
    AdminUser,
    BlacklistedAddress,
    GovernanceProposal,
    OperationType,
    ServiceStatus
} from "../../types/interfaces.ts";

/**
 * Hook for managing admin operations
 */
export function useAdminOperations(walletAddress: string) {

    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [blacklistedAddresses, setBlacklistedAddresses] = useState<BlacklistedAddress[]>([]);
    const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all admin data
     */
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const servicesData = await blockchainAdminService.getServicesStatus();
            setServices(servicesData);

            const adminsData = await blockchainAdminService.getAllAdmins();
            const updatedAdmins = adminsData.map((admin: { address: string }) => ({
                ...admin,
                isCurrentUser: admin.address.toLowerCase() === walletAddress.toLowerCase()
            }));
            setAdminUsers(updatedAdmins);

            const blacklistData = await blockchainAdminService.getBlacklistedAddresses();
            setBlacklistedAddresses(blacklistData);

            const proposalsData = await blockchainAdminService.getPendingProposals(walletAddress);
            setProposals(proposalsData);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setError('An error occurred while loading data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress]);

    /**
     * Pause all services
     */
    const pauseAllServices = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await serviceAvailabilityService.pauseAllServices();
            await refreshData();
        } catch (err) {
            console.error('Error pausing services:', err);
            setError('Failed to pause services. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Unpause all services
     */
    const unpauseAllServices = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await serviceAvailabilityService.unpauseAllServices();
            await refreshData();
        } catch (err) {
            console.error('Error unpausing services:', err);
            setError('Failed to unpause services. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Pause a specific operation
     */
    const pauseOperation = useCallback(async (operationType: OperationType) => {
        setIsLoading(true);
        setError(null);

        try {
            await serviceAvailabilityService.pauseOperation(operationType);
            await refreshData();
        } catch (err) {
            console.error(`Error pausing operation ${operationType}:`, err);
            setError('Failed to pause operation. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Unpause a specific operation
     */
    const unpauseOperation = useCallback(async (operationType: OperationType) => {
        setIsLoading(true);
        setError(null);

        try {
            await serviceAvailabilityService.unpauseOperation(operationType);
            await refreshData();
        } catch (err) {
            console.error(`Error unpausing operation ${operationType}:`, err);
            setError('Failed to unpause operation. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Propose to revoke admin permissions
     */
    const revokeAdminPermissions = useCallback(async (address: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await blockchainAdminService.proposeRemoveAdmin(address);
            await refreshData();
        } catch (err) {
            console.error('Error proposing admin removal:', err);
            setError('Failed to propose admin removal. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Propose to add a new admin
     */
    const addNewAdmin = useCallback(async (address: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await blockchainAdminService.proposeAddAdmin(address);
            await refreshData();
        } catch (err) {
            console.error('Error proposing new admin:', err);
            setError('Failed to propose new admin. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Remove address from blacklist
     */
    const removeFromBlacklist = useCallback(async (address: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await blockchainAdminService.unbanUser(address);
            await refreshData();
        } catch (err) {
            console.error('Error removing from blacklist:', err);
            setError('Failed to remove address from blacklist. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Add address to blacklist
     */
    const addToBlacklist = useCallback(async (address: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await blockchainAdminService.banUser(address);
            await refreshData();
        } catch (err) {
            console.error('Error adding to blacklist:', err);
            setError('Failed to add address to blacklist. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Approve a governance proposal
     */
    const approveProposal = useCallback(async (proposalId: number) => {
        setIsLoading(true);
        setError(null);

        try {
            await blockchainAdminService.approveProposal(proposalId);
            await refreshData();
        } catch (err) {
            console.error(`Error approving proposal ${proposalId}:`, err);
            setError('Failed to approve proposal. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    /**
     * Reject a governance proposal
     */
    const rejectProposal = useCallback(async (proposalId: number) => {
        setIsLoading(true);
        setError(null);

        try {
            await blockchainAdminService.rejectProposal(proposalId);
            await refreshData();
        } catch (err) {
            console.error(`Error rejecting proposal ${proposalId}:`, err);
            setError('Failed to reject proposal. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [refreshData]);

    return {
        // State
        services,
        adminUsers,
        blacklistedAddresses,
        proposals,
        isLoading,
        error,

        // Actions
        refreshData,
        pauseAllServices,
        unpauseAllServices,
        pauseOperation,
        unpauseOperation,
        revokeAdminPermissions,
        addNewAdmin,
        removeFromBlacklist,
        addToBlacklist,
        approveProposal,
        rejectProposal
    };
}