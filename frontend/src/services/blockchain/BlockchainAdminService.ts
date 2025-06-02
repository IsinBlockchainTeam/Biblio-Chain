
import { blockchainService } from './BlockchainService.ts';
import { serviceAvailabilityService} from "../library/AvailabilityService.ts";
import {
    AdminUser,
    BlacklistedAddress,
    GovernanceProposal,
    OperationType,
    ServiceStatus,
    User
} from "../../types/interfaces.ts";

/**
 * Enum representing types of governance proposals
 */
enum ProposalType {
    AddOwner = 0,
    RemoveOwner = 1
}
/**
 * Provides administrative operations for interacting with the blockchain
 */
export class BlockchainAdminService {
    /**
     * Ensures the blockchain connection is established.
     */
    private async ensureConnection() {
        await blockchainService.connect();
    }
    /**
     * Retrieves all pending governance proposals for a specific wallet
     * @param wallet - The wallet address to check for voting status
     * @returns A list of pending governance proposals
     */
    async getPendingProposals(wallet: string): Promise<GovernanceProposal[]> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();

            // Get pending proposal IDs
            const proposalIds = await contract.getPendingProposals();

            if (proposalIds.length === 0) {
                return [];
            }

            const proposals: GovernanceProposal[] = await Promise.all(
                proposalIds.map(async (id: bigint) => {
                    try {

                        const proposalId = Number(id);

                        const [, type, target ,proposer,acount,rcount] = await contract.getProposalInfo(proposalId);

                        const hasVoted = await contract.hasVoted(wallet);

                        return {
                            id: proposalId,
                            type: Number(type) === ProposalType.AddOwner ? 'add_admin' : 'remove_admin',
                            target: target,
                            proposer: proposer,
                            approvalCount: Number(acount),
                            rejectionCount: Number(rcount),
                            state: 'Pending',
                            hasVoted: hasVoted || (String(proposer).trim().toLowerCase() === String(wallet).trim().toLowerCase())
                        };
                    } catch (error) {
                        console.error(`Error getting details for proposal ${id}:`, error);
                        return null;
                    }
                })
            );

            return proposals.filter((p): p is GovernanceProposal => p !== null);
        } catch (error) {
            console.error('Error getting pending proposals:', error);
            return [];
        }
    }

    /**
     * Approves a governance proposal
     * @param proposalId - The ID of the proposal to approve
     */
    async approveProposal(proposalId: number): Promise<void> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();
            const tx = await contract.approveProposal(proposalId);
            await tx.wait();

        } catch (error) {
            console.error(`Error approving proposal ${proposalId}:`, error);
            throw error;
        }
    }

    /**
     * Rejects a governance proposal
     * @param proposalId - The ID of the proposal to reject
     */
    async rejectProposal(proposalId: number): Promise<void> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();
            const tx = await contract.rejectProposal(proposalId);
            await tx.wait();

        } catch (error) {
            console.error(`Error rejecting proposal ${proposalId}:`, error);
            throw error;
        }
    }

    /**
     * Retrieves information about a user
     * @param address - The wallet address of the user
     * @returns User information or null if not found
     */
    async getUserInfo(address: string): Promise<User | null> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();
            const userInfo = await contract.getUserInfo(address);

            return {
                address,
                isRegistered: userInfo[0],
                isBanned: userInfo[1],
                trustLevel: Number(userInfo[2]),
                isSystemOwner: userInfo[3]
            };
        } catch (error) {
            console.error(`Error getting user info for ${address}:`, error);
            return null;
        }
    }

    /**
     * Retrieves all registered user addresses
     * @returns A list of user wallet addresses
     */
    async getAllUsers(): Promise<string[]> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();
            return await contract.getAllUsers();
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }


    /**
     * Retrieves all users with admin privileges
     * @returns A list of admin users
     */
    async getAllAdmins(): Promise<AdminUser[]> {
        try {
            const allUsers = await this.getAllUsers();

            const adminChecks = await Promise.all(
                allUsers.map(async (address) => {
                    const userInfo = await this.getUserInfo(address);
                    return userInfo?.isSystemOwner ? { address, isCurrentUser: false } : null;
                })
            );
            return adminChecks.filter((admin): admin is AdminUser => admin !== null);
        } catch (error) {
            console.error('Error getting all admins:', error);
            return [];
        }
    }

    /**
     * Retrieves all banned users
     * @returns A list of blacklisted addresses
     */
    async getBlacklistedAddresses(): Promise<BlacklistedAddress[]> {
        try {
            const allUsers = await this.getAllUsers();

            const blacklistChecks = await Promise.all(
                allUsers.map(async (address) => {
                    const userInfo = await this.getUserInfo(address);
                    if (userInfo?.isBanned) {
                        return {
                            address,
                            reason: 'Banned by administrator',
                        };
                    }
                    return null;
                })
            );

            return blacklistChecks.filter((entry): entry is BlacklistedAddress => entry !== null);
        } catch (error) {
            console.error('Error getting blacklisted addresses:', error);
            return [];
        }
    }

    /**
     * Proposes the addition of a new admin
     * @param newAdminAddress - The wallet address of the proposed admin
     * @returns The ID of the created proposal
     */
    async proposeAddAdmin(newAdminAddress: string): Promise<number> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();
            const tx = await contract.proposeAddOwner(newAdminAddress);
            const receipt = await tx.wait();

            let proposalId = 0;
            if (receipt && receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contract.interface.parseLog({
                            topics: log.topics as string[],
                            data: log.data
                        });

                        if (parsedLog && parsedLog.name === 'ProposalCreated') {
                            proposalId = Number(parsedLog.args[0]);
                            break;
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        //empty
                    }
                }
            }


            return proposalId;
        } catch (error) {
            console.error('Error proposing new admin:', error);
            throw error;
        }
    }

    /**
     * Proposes the removal of an admin
     * @param adminAddress - The wallet address of the admin to remove
     * @returns The ID of the created proposal
     */
    async proposeRemoveAdmin(adminAddress: string): Promise<number> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();
            const tx = await contract.proposeRemoveOwner(adminAddress);
            const receipt = await tx.wait();

            let proposalId = 0;
            if (receipt && receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contract.interface.parseLog({
                            topics: log.topics as string[],
                            data: log.data
                        });

                        if (parsedLog && parsedLog.name === 'ProposalCreated') {
                            proposalId = Number(parsedLog.args[0]);
                            break;
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* empty */ }
                }
            }

            return proposalId;
        } catch (error) {
            console.error('Error proposing admin removal:', error);
            throw error;
        }
    }

    /**
     * Bans a user from the system
     * @param userAddress - The wallet address of the user to ban
     */
    async banUser(userAddress: string): Promise<void> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();
            const tx = await contract.banUser(userAddress);
            await tx.wait();

        } catch (error) {
            console.error(`Error banning user ${userAddress}:`, error);
            throw error;
        }
    }

    /**
     * Unbans a user from the system
     * @param userAddress - The wallet address of the user to unban
     */
    async unbanUser(userAddress: string): Promise<void> {
        try {
            await this.ensureConnection();

            const contract = blockchainService.getContract();
            const tx = await contract.unbanUser(userAddress);
            await tx.wait();

        } catch (error) {
            console.error(`Error unbanning user ${userAddress}:`, error);
            throw error;
        }
    }

    /**
     * Retrieves the status of critical system services
     * @returns A list representing the current status of each service
     */
    async getServicesStatus(): Promise<ServiceStatus[]> {
        try {
            await this.ensureConnection();

            // Controlla quali operazioni sono in pausa
            const isRentablePaused = await serviceAvailabilityService.isOperationPaused(OperationType.Rentable);
            const isSellablePaused = await serviceAvailabilityService.isOperationPaused(OperationType.Sellable);
            const isBorrowingPaused = await serviceAvailabilityService.isOperationPaused(OperationType.Borrowing);
            const isReturningPaused = await serviceAvailabilityService.isOperationPaused(OperationType.Returning);
            const isPurchasingPaused = await serviceAvailabilityService.isOperationPaused(OperationType.Purchasing);

            // Determina lo stato di ciascun servizio
            return [
                {
                    name: 'Book Creation Service',
                    status: isRentablePaused || isSellablePaused ? 'paused' : 'running'
                },
                {
                    name: 'Book Borrowing Service',
                    status: isBorrowingPaused ? 'paused' : 'running'
                },
                {
                    name: 'Book Return Service',
                    status: isReturningPaused ? 'paused' : 'running'
                },
                {
                    name: 'Book Purchase Service',
                    status: isPurchasingPaused ? 'paused' : 'running'
                }
            ];
        } catch (error) {
            console.error('Error getting services status:', error);
            throw error;
        }
    }
}

/**
 * Singleton instance of BlockchainAdminService
 */
export const blockchainAdminService = new BlockchainAdminService();