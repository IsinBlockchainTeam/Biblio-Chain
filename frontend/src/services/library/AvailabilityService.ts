import { blockchainService } from '../blockchain/BlockchainService.ts'
import { OperationType } from "../../types/interfaces.ts"

/**
 * Service to manage and check the availability of blockchain operations
 */
export class ServiceAvailabilityService {
    /**
     * Check if a specific operation is currently paused
     * @param operationType Type of operation to check
     * @returns True if the operation is paused
     */
    async isOperationPaused(operationType: OperationType): Promise<boolean> {
        try {
            await blockchainService.connect()
            const contract = blockchainService.getContract()
            return await contract.isOperationPaused(operationType)
        } catch (error) {
            console.error(`Error checking if operation type ${operationType} is paused:`, error)
            return false
        }
    }

    /**
     * Check if all operations are currently paused
     * @returns True if all operations are paused
     */
    async areAllPaused(): Promise<boolean> {
        try {
            await blockchainService.connect()
            const contract = blockchainService.getContract()
            return await contract.areAllPaused()
        } catch (error) {
            console.error('Error checking if all services are paused:', error)
            return false
        }
    }

    /**
     * Pause all blockchain operations
     */
    async pauseAllServices(): Promise<void> {
        try {
            await blockchainService.connect()
            const contract = blockchainService.getContract()
            const tx = await contract.pauseAll()
            await tx.wait()
        } catch (error) {
            console.error('Error pausing all services:', error)
            throw error
        }
    }

    /**
     * Resume all blockchain operations
     */
    async unpauseAllServices(): Promise<void> {
        try {
            await blockchainService.connect()
            const contract = blockchainService.getContract()
            const tx = await contract.unpauseAll()
            await tx.wait()
        } catch (error) {
            console.error('Error unpausing all services:', error)
            throw error
        }
    }

    /**
     * Pause a specific blockchain operation
     * @param operationType Type of operation to pause
     */
    async pauseOperation(operationType: OperationType): Promise<void> {
        try {
            await blockchainService.connect()
            const contract = blockchainService.getContract()
            const tx = await contract.pauseOperation(operationType)
            await tx.wait()
        } catch (error) {
            console.error(`Error pausing operation type ${operationType}:`, error)
            throw error
        }
    }

    /**
     * Resume a specific blockchain operation
     * @param operationType Type of operation to resume
     */
    async unpauseOperation(operationType: OperationType): Promise<void> {
        try {
            await blockchainService.connect()
            const contract = blockchainService.getContract()
            const tx = await contract.unpauseOperation(operationType)
            await tx.wait()
        } catch (error) {
            console.error(`Error unpausing operation type ${operationType}:`, error)
            throw error
        }
    }
}

/**
 * Singleton instance of ServiceAvailabilityService
 */
export const serviceAvailabilityService = new ServiceAvailabilityService()
