import { ethers } from "ethers";
import LibraryABI from "../../contracts/LibraryManagerContract.json";
import {
    Transaction,
    TransactionType,
    User
} from "../../types/interfaces.ts";
import { LIBRARY_CONTRACT_ADDRESS } from "../../types/costants.ts";
import {libraryService} from "../library/LibraryService.ts";

// Constants for service operation
const BLOCKS_TO_SEARCH = 100_000;
const ERROR_BANNED_USER_MESSAGE = "LibraryManager: user is banned";

/**
 * Custom error types for better error handling
 */
export class BlockchainConnectionError extends Error {
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'BlockchainConnectionError';
    }
}

export class BlockchainTransactionError extends Error {
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'BlockchainTransactionError';
    }
}

export class UserBannedError extends Error {
    constructor(message: string = "User is banned from the platform") {
        super(message);
        this.name = 'UserBannedError';
    }
}

// Interface for event processing
interface EventProcessParams {
    walletAddress: string;
    fromBlock: number;
    toBlock: number;
    events: Transaction[];
    processedEvents: Set<string>;
}

/**
 * Service responsible for direct blockchain interactions
 */
export class BlockchainService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;
    private contract: ethers.Contract | null = null;
    private isInitialized = false;

    /**
     * Initialize blockchain connection
     * @throws {BlockchainConnectionError} If connection cannot be established
     */
    async connect(): Promise<void> {
        if (this.isInitialized) return;

        if (!window.ethereum) {
            throw new BlockchainConnectionError("Web3 provider not found. Please install MetaMask or use a compatible wallet.");
        }

        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();

            // Create contract instance using the ABI JSON
            this.contract = new ethers.Contract(
                LIBRARY_CONTRACT_ADDRESS,
                LibraryABI,
                this.signer
            );

            this.isInitialized = true;
        } catch (error) {
            console.error("Error during blockchain connection initialization:", error);
            throw new BlockchainConnectionError("Unable to connect to the blockchain. Please check your wallet connection.", error);
        }
    }

    /**
     * Get the contract instance
     * @returns {ethers.Contract} The initialized contract instance
     * @throws {BlockchainConnectionError} If contract is not initialized
     */
    getContract(): ethers.Contract {
        if (!this.contract) {
            throw new BlockchainConnectionError("Contract not initialized");
        }
        return this.contract;
    }

    /**
     * Check if a user is registered in the system
     * @param {string} address User wallet address
     * @returns {Promise<boolean>} True if user is registered
     */
    async isUserRegistered(address: string): Promise<boolean> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const userInfo = await this.contract.getUserInfo(address);
            return userInfo[0]; // isRegistered is the first item in the tuple
        } catch (error) {
            console.error("Error checking registration:", error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Check if a user has admin privileges
     * @param {string} address User wallet address
     * @returns {Promise<boolean>} True if user is an admin
     */
    async isUserAdmin(address: string): Promise<boolean> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const userInfo = await this.contract.getUserInfo(address);
            return userInfo[3]; // isAdmin is the fourth item in the tuple
        } catch (error) {
            console.error("Error checking admin status:", error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Get detailed information about a user
     * @param {string} address User wallet address
     * @returns {Promise<User>} User information
     */
    async getUserInfo(address: string): Promise<User> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const info = await this.contract.getUserInfo(address);

            return {
                address,
                isRegistered: info[0],
                isBanned: info[1],
                trustLevel: Number(info[2]),
                isSystemOwner: info[3]
            };
        } catch (error) {
            console.error(`Error getting user info for ${address}:`, error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Register a new user
     * @throws {BlockchainTransactionError} If registration fails
     */
    async registerUser(): Promise<void> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const tx = await this.contract.registerUser();
            await tx.wait();

        } catch (error) {
            console.error("Error during user registration:", error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Create a rentable book in the blockchain
     * @param {string} metadataCid IPFS CID for the book metadata
     * @param {string} depositAmount Deposit amount in ETH
     * @param {number} lendingPeriod Lending period in days
     * @returns {Promise<number>} The token ID of the created book
     * @throws {UserBannedError} If the user is banned
     * @throws {BlockchainTransactionError} If creation fails
     */
    async createRentableBook(
        metadataCid: string,
        depositAmount: string,
        lendingPeriod: number
    ): Promise<number> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const depositWei = ethers.parseEther(depositAmount);
            const tx = await this.contract.createRentableBook(
                `ipfs://${metadataCid}`,
                depositWei,
                lendingPeriod
            );

            const receipt = await tx.wait();
            return this.extractTokenIdFromReceipt(receipt, "BookCreated");
        } catch (error) {
            console.error("Error creating rentable book:", error);
            const processedError = this.translateBlockchainError(error);

            // If the user is banned, handle specially
            if (this.isUserBannedError(error)) {
                throw new UserBannedError();
            }

            throw processedError;
        }
    }

    /**
     * Create a sellable book in the blockchain
     * @param {string} metadataCid IPFS CID for the book metadata
     * @param {string} price Book price in ETH
     * @returns {Promise<number>} The token ID of the created book
     * @throws {UserBannedError} If the user is banned
     * @throws {BlockchainTransactionError} If creation fails
     */
    async createSellableBook(
        metadataCid: string,
        price: string
    ): Promise<number> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const priceWei = ethers.parseEther(price);
            const tx = await this.contract.createSellableBook(
                `ipfs://${metadataCid}`,
                priceWei
            );

            const receipt = await tx.wait();
            return this.extractTokenIdFromReceipt(receipt, "BookCreated");
        } catch (error) {
            console.error("Error creating sellable book:", error);
            const processedError = this.translateBlockchainError(error);

            // If the user is banned, handle specially
            if (this.isUserBannedError(error)) {
                throw new UserBannedError();
            }

            throw processedError;
        }
    }

    /**
     * Extract token ID from transaction receipt
     * @private
     */
    private extractTokenIdFromReceipt(receipt: ethers.TransactionReceipt, eventName: string): number {
        if (!this.contract) {
            throw new BlockchainConnectionError("Contract not initialized");
        }

        // Find the relevant event log
        const eventLog = receipt?.logs.find(log => {
            try {
                const signature = `${eventName}(uint256,uint8)`;
                const topic = ethers.id(signature);
                return log.topics[0] === topic;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                return false;
            }
        });

        if (!eventLog) {
            throw new BlockchainTransactionError(`Failed to find ${eventName} event in transaction receipt`);
        }

        // Parse the event data
        const eventInterface = new ethers.Interface([
            `event ${eventName}(uint256 indexed tokenId, uint8 bookType)`
        ]);

        const parsedLog = eventInterface.parseLog({
            topics: eventLog.topics as string[],
            data: eventLog.data
        });

        return Number(parsedLog?.args[0]);
    }

    /**
     * Borrow a book by paying the deposit
     * @param {number} bookId Book token ID
     * @param {string} depositAmount Deposit amount in ETH
     * @throws {UserBannedError} If the user is banned
     * @throws {BlockchainTransactionError} If borrowing fails
     */
    async borrowBook(bookId: number, depositAmount: string): Promise<void> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const depositWei = ethers.parseEther(depositAmount);
            const tx = await this.contract.borrowBook(bookId, {
                value: depositWei
            });

            await tx.wait();
        } catch (error) {
            console.error("Error borrowing book:", error);
            const processedError = this.translateBlockchainError(error);

            if (this.isUserBannedError(error)) {
                throw new UserBannedError();
            }

            throw processedError;
        }
    }

    /**
     * Return a borrowed book
     * @param {number} bookId Book token ID
     * @throws {UserBannedError} If the user is banned
     * @throws {BlockchainTransactionError} If return fails
     */
    async returnBook(bookId: number): Promise<void> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const tx = await this.contract.returnBook(bookId);
            await tx.wait();

        } catch (error) {
            console.error("Error returning book:", error);
            const processedError = this.translateBlockchainError(error);

            if (this.isUserBannedError(error)) {
                throw new UserBannedError();
            }

            throw processedError;
        }
    }

    /**
     * Buy a book by paying the price
     * @param {number} bookId Book token ID
     * @param {string} price Book price in ETH
     * @throws {UserBannedError} If the user is banned
     * @throws {BlockchainTransactionError} If purchase fails
     */
    async buyBook(bookId: number, price: string): Promise<void> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const priceWei = ethers.parseEther(price);
            const tx = await this.contract.buyBook(bookId, {
                value: priceWei
            });

            await tx.wait();
        } catch (error) {
            console.error("Error buying book:", error);
            const processedError = this.translateBlockchainError(error);

            if (this.isUserBannedError(error)) {
                throw new UserBannedError();
            }

            throw processedError;
        }
    }

    /**
     * Rate a book
     * @param {number} bookId Book token ID
     * @param {number} rating Rating value (1-5)
     * @throws {UserBannedError} If the user is banned
     * @throws {BlockchainTransactionError} If rating fails
     */
    async rateBook(bookId: number, rating: number): Promise<void> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            // Get the book type
            const bookDetails = await this.getBookDetails(bookId);

            const scaledRating = rating * 100;

            let tx;
            if (Number(bookDetails.bookType) === 0) { // Rentable book
                tx = await this.contract.rateRentableBook(bookId, scaledRating);
            } else { // Sellable book
                tx = await this.contract.rateSellableBook(bookId, scaledRating);
            }

            await tx.wait();
        } catch (error) {
            console.error("Error rating book:", error);
            const processedError = this.translateBlockchainError(error);

            if (this.isUserBannedError(error)) {
                throw new UserBannedError();
            }

            throw processedError;
        }
    }

    /**
     * Check if a user has rated a book
     * @param {number} bookId Book token ID
     * @param {string} wallet User wallet address
     * @returns {Promise<boolean>} True if the user has rated the book
     */
    async hasRated(bookId: number, wallet: string): Promise<boolean> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            return await this.contract.hasUserRatedBook(bookId, String(wallet));
        } catch (error) {
            console.error("Error checking if user has rated book:", error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Get all book IDs from the blockchain
     * @returns {Promise<number[]>} Array of book token IDs
     */
    async getAllBookIds(): Promise<number[]> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const bookIds = await this.contract.getAllBookIds();
            return bookIds.map((id: never) => Number(id));
        } catch (error) {
            console.error("Error getting book IDs:", error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Get book details from the blockchain
     * @param {number} bookId Book token ID
     * @returns {Promise<{contractAddress: string, bookType: number, bookData: string}>}
     */
    async getBookDetails(bookId: number): Promise<{
        contractAddress: string;
        bookType: number;
        bookData: string;
    }> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const details = await this.contract.getBookDetails(bookId);

            return {
                contractAddress: details[0],
                bookType: Number(details[1]),
                bookData: details[2]
            };
        } catch (error) {
            console.error(`Error getting details for book ${bookId}:`, error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Get the owner of a book
     * @param {number} bookId Book token ID
     * @returns {Promise<string>} Owner wallet address
     */
    async getBookOwner(bookId: number): Promise<string> {
        await this.connect();

        try {
            if (!this.contract) throw new BlockchainConnectionError("Contract not initialized");

            const details = await this.contract.getBookDetails(bookId);
            const contractAddress = details[0];

            // Create an instance of the ERC721 contract at the address
            const ERC721Interface = [
                "function ownerOf(uint256 tokenId) view returns (address)"
            ];

            const bookContract = new ethers.Contract(
                contractAddress,
                ERC721Interface,
                this.provider
            );

            // Call ownerOf to get the owner address
            return await bookContract.ownerOf(bookId);
        } catch (error) {
            console.error(`Error getting owner for book ID ${bookId}:`, error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Get user transactions from blockchain events
     * @param {string} walletAddress User wallet address
     * @returns {Promise<Transaction[]>} Array of transactions
     */
    async getUserTransactionsFromEvents(walletAddress: string): Promise<Transaction[]> {
        await this.connect();
        if (!this.contract || !this.provider) {
            throw new BlockchainConnectionError("Contract or provider not initialized");
        }

        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - BLOCKS_TO_SEARCH);
        const events: Transaction[] = [];
        const processedEvents = new Set<string>(); // To avoid duplicates

        try {
            const params: EventProcessParams = {
                walletAddress,
                fromBlock,
                toBlock: currentBlock,
                events,
                processedEvents
            };

            // Process all types of events
            await Promise.all([
                this.processBorrowedEvents(params),
                this.processReturnedEvents(params),
                this.processCreatedEvents(params),
                this.processPurchasedEvents(params)
            ]);

            // Format dates
            events.forEach(event => {
                event.date = this.formatTransactionDate(event.date);
            });

            // Sort by date (newest first) and limit to 10
            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return events.slice(0, 10);
        } catch (error) {
            console.error("Error querying transaction events:", error);
            throw this.translateBlockchainError(error);
        }
    }

    /**
     * Process BookBorrowed events
     * @private
     */
    private async processBorrowedEvents(params: EventProcessParams): Promise<void> {
        if (!this.contract || !this.provider) return;
        const { walletAddress, fromBlock, toBlock, events, processedEvents } = params;

        const borrowFilter = this.contract.filters.BookBorrowed(null, walletAddress);
        const logs = await this.contract.queryFilter(borrowFilter, fromBlock, toBlock);

        for (const log of logs) {
            await this.processEventLog(log, processedEvents, async (parsedLog) => {
                const tokenId = Number(parsedLog.args[0]);
                const block = await this.provider!.getBlock(log.blockNumber);
                if (!block) return null;

                const timestamp = Number(block.timestamp) * 1000;
                const lender = await this.getBookOwner(tokenId);
                const bookTitle = await this.getBookTitle(tokenId);

                return {
                    id: log.blockNumber * 1000,
                    type: 'Borrowed' as TransactionType,
                    bookId: tokenId,
                    bookTitle,
                    counterpartyAddress: lender,
                    date: new Date(timestamp).toISOString(),
                    status: 'Active'
                };
            }, events);
        }
    }

    /**
     * Process BookReturned events
     * @private
     */
    private async processReturnedEvents(params: EventProcessParams): Promise<void> {
        if (!this.contract || !this.provider) return;
        const { walletAddress, fromBlock, toBlock, events, processedEvents } = params;

        const returnFilter = this.contract.filters.BookReturned(null, walletAddress);
        const logs = await this.contract.queryFilter(returnFilter, fromBlock, toBlock);

        for (const log of logs) {
            await this.processEventLog(log, processedEvents, async (parsedLog) => {
                const tokenId = Number(parsedLog.args[0]);
                const block = await this.provider!.getBlock(log.blockNumber);
                if (!block) return null;

                const timestamp = Number(block.timestamp) * 1000;
                const lender = await this.getBookOwner(tokenId);
                const bookTitle = await this.getBookTitle(tokenId);

                return {
                    id: log.blockNumber * 1000,
                    type: 'Returned' as TransactionType,
                    bookId: tokenId,
                    bookTitle,
                    counterpartyAddress: lender,
                    date: new Date(timestamp).toISOString(),
                    status: 'Completed'
                };
            }, events);
        }
    }

    /**
     * Process BookCreated events
     * @private
     */
    private async processCreatedEvents(params: EventProcessParams): Promise<void> {
        if (!this.contract || !this.provider) return;
        const { walletAddress, fromBlock, toBlock, events, processedEvents } = params;

        const createdFilter = this.contract.filters.BookCreated(null, null);
        const logs = await this.contract.queryFilter(createdFilter, fromBlock, toBlock);

        for (const log of logs) {
            // For created events, we need to check if the transaction was from this user
            const tx = await this.provider.getTransaction(log.transactionHash);
            if (!tx || tx.from.toLowerCase() !== walletAddress.toLowerCase()) continue;

            await this.processEventLog(log, processedEvents, async (parsedLog) => {
                const tokenId = Number(parsedLog.args[0]);
                const block = await this.provider!.getBlock(log.blockNumber);
                if (!block) return null;

                const timestamp = Number(block.timestamp) * 1000;
                const bookTitle = await this.getBookTitle(tokenId);

                return {
                    id: log.blockNumber * 1000,
                    type: 'Created' as TransactionType,
                    bookId: tokenId,
                    bookTitle,
                    counterpartyAddress: "-",
                    date: new Date(timestamp).toISOString(),
                    status: 'Completed'
                };
            }, events);
        }
    }

    /**
     * Process BookPurchased events
     * @private
     */
    private async processPurchasedEvents(params: EventProcessParams): Promise<void> {
        if (!this.contract || !this.provider) return;
        const { walletAddress, fromBlock, toBlock, events, processedEvents } = params;

        const purchaseFilter = this.contract.filters.BookPurchased(null, walletAddress, null);
        const logs = await this.contract.queryFilter(purchaseFilter, fromBlock, toBlock);

        for (const log of logs) {
            await this.processEventLog(log, processedEvents, async (parsedLog) => {
                const tokenId = Number(parsedLog.args[0]);
                const sellerAddress = parsedLog.args[2];

                const block = await this.provider!.getBlock(log.blockNumber);
                if (!block) return null;

                const timestamp = Number(block.timestamp) * 1000;
                const bookTitle = await this.getBookTitle(tokenId);

                return {
                    id: log.blockNumber * 1000,
                    type: 'Bought' as TransactionType,
                    bookId: tokenId,
                    bookTitle,
                    counterpartyAddress: sellerAddress,
                    date: new Date(timestamp).toISOString(),
                    status: 'Completed'
                };
            }, events);
        }
    }

    /**
     * Generic method to process an event log
     * @private
     */
    private async processEventLog(
        log: ethers.Log,
        processedEvents: Set<string>,
        processor: (parsedLog: ethers.LogDescription) => Promise<Transaction | null>,
        events: Transaction[]
    ): Promise<void> {
        if (!this.contract) return;

        const eventId = `${log.transactionHash}`;
        if (processedEvents.has(eventId)) return;

        try {
            const parsedLog = this.contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data
            });

            if (!parsedLog) return;

            const transaction = await processor(parsedLog);
            if (transaction) {
                events.push(transaction);
                processedEvents.add(eventId);
            }
        } catch (e) {
            console.warn("Error processing event log:", e);
        }
    }

    /**
     * Format a date for display in transactions
     * @private
     */
    private formatTransactionDate(isoDate: string): string {
        const date = new Date(isoDate);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    /**
     * Get a basic book title for transactions
     * This is a fallback that doesn't depend on LibraryService
     * @private
     */
    private async getBookTitle(bookId: number): Promise<string> {
        return (await libraryService.fetchBookById(bookId))!.title;
    }

    /**
     * Check if an error is related to a banned user
     * @private
     */
    private isUserBannedError(error: unknown): boolean {
        const errObj = error as { code?: number; message?: string; reason?: string };

        if (errObj.message && errObj.message.includes(ERROR_BANNED_USER_MESSAGE)) {
            return true;
        }

        if (errObj.reason && errObj.reason.includes(ERROR_BANNED_USER_MESSAGE)) {
            return true;
        }

        return false;
    }

    /**
     * Process and standardize errors
     * @private
     */
    private translateBlockchainError(error: unknown): Error {
        if (!error) return new Error("Unknown error");

        const errObj = error as { code?: number; message?: string; reason?: string };

        // User rejection error
        if (errObj.code === 4001 || (errObj.message && errObj.message.includes("user rejected"))) {
            return new BlockchainTransactionError("Transaction rejected by user");
        }

        // Contract revert error
        if (errObj.message && errObj.message.includes("reverted")) {
            // Check for banned user
            if (errObj.message.includes(ERROR_BANNED_USER_MESSAGE)) {
                return new UserBannedError();
            }

            const revertReason = errObj.message.match(/reverted with reason string '([^']+)'/);
            if (revertReason && revertReason[1]) {
                return new BlockchainTransactionError(`Operation failed: ${revertReason[1]}`);
            }
        }

        // Reason may also contain the ban message
        if (errObj.reason && errObj.reason.includes(ERROR_BANNED_USER_MESSAGE)) {
            return new UserBannedError();
        }

        // Generic blockchain error
        return new BlockchainTransactionError(
            errObj.message || "Error during blockchain operation",
            error
        );
    }
}

export const blockchainService = new BlockchainService();