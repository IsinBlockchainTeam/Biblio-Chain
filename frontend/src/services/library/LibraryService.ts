import {
    Book,
    RentableBook,
    SellableBook,
    BookStatus,
    BookGenre,
    BookFormData,
    AnyBookType, ALL_GENRES
} from '../../types/interfaces';
import { blockchainService, UserBannedError, BlockchainConnectionError } from "../blockchain/BlockchainService.ts";
import { blockchainDataConverter } from "../blockchain/BlockchainDataConverter.ts";
import { ipfsService } from "../blockchain/IPFSService.ts";
import {filterService} from "./FilterService.ts";

const TEN_DAYS_IN_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Custom error types for better error handling
 */
export class LibraryServiceError extends Error {
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'LibraryServiceError';
    }
}

export class BookNotFoundError extends Error {
    constructor(bookId: number) {
        super(`Book with ID ${bookId} not found`);
        this.name = 'BookNotFoundError';
    }
}

export class PermissionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermissionError';
    }
}

/**
 * Service responsible for managing library operations and book data
 * This service handles the business logic for the library application,
 * coordinating between blockchain interactions and data presentation.
 */
export class LibraryService {
    /**
     * Fetch all books from the blockchain
     * @returns Promise resolving to an array of books
     * @throws {LibraryServiceError} If fetching fails
     */
    async fetchAllBooks(): Promise<AnyBookType[]> {
        try {

            const bookIds = await blockchainService.getAllBookIds();
            const booksPromises = bookIds.map(id => this.fetchBookById(id));
            const books = await Promise.all(booksPromises);

            return books.filter(book => book !== null) as AnyBookType[];
        } catch (error) {
            console.error('Error fetching all books from blockchain:', error);

            if (error instanceof BlockchainConnectionError) {
                throw new LibraryServiceError('Failed to connect to blockchain, please check your wallet connection', error);
            }

            throw new LibraryServiceError('Error fetching books from blockchain', error);
        }
    }

    /**
     * Fetch a single book by its ID
     * @param bookId Book token ID
     * @returns Promise resolving to a Book, RentableBook, or SellableBook, or null if not found
     */
    async fetchBookById(bookId: number): Promise<AnyBookType | null> {
        try {
            const details = await blockchainService.getBookDetails(bookId);
            const { bookType, bookData } = details;

            const owner = await blockchainService.getBookOwner(bookId);

            return await blockchainDataConverter.convertBlockchainBookToAppBook(
                bookId,
                bookType,
                bookData,
                owner
            );
        } catch (error) {
            console.error(`Error fetching book ID ${bookId}:`, error);
            return null;
        }
    }

    /**
     * Check if a book is about to expire its lending period
     * @param bookId Book token ID
     * @param wallet user wallet
     * @returns Promise resolving to true if the book is expiring soon
     */
    public async isExpiring(bookId: number, wallet: string): Promise<boolean> {
        try {
            const book = await this.fetchBookById(bookId);
            if (!book || !this.isRentable(book) || !book.borrowDate) {
                return false;
            }
            if(filterService.isOwned(book, wallet)) {
                return false;
            }

            const borrowTimestamp = new Date(book.borrowDate).getTime();
            const lendingPeriodMs = book.lendingPeriod * 24 * 60 * 60 * 1000;
            const dueDate = borrowTimestamp + lendingPeriodMs;
            const now = Date.now();

            return dueDate - now < TEN_DAYS_IN_MS;
        } catch (error) {
            console.error(`Error checking if book ${bookId} is expiring:`, error);
            return false;
        }
    }

    /**
     * Add a new book
     * @param formData Book form data
     * @param walletAddress Owner wallet address
     * @returns Promise resolving to the created book
     * @throws {LibraryServiceError} If book creation fails
     * @throws {UserBannedError} If the user is banned
     */
    async addBook(formData: BookFormData, walletAddress: string): Promise<AnyBookType> {
        try {

            this.validateBookFormData(formData);
            await this.ensureUserRegistered(walletAddress);

            const { metadataCid } = await ipfsService.processBookUpload(formData);

            return await (formData.bookType === 'rentable'
                ? this.createRentableBook(formData, metadataCid, walletAddress)
                : this.createSellableBook(formData, metadataCid, walletAddress));
        } catch (error) {
            console.error('Error adding book:', error);

            if (error instanceof UserBannedError) {
                throw error;
            }

            throw new LibraryServiceError('Error adding book to the blockchain', error);
        }
    }

    /**
     * Create a rentable book
     * @private
     */
    private async createRentableBook(
        formData: BookFormData,
        metadataCid: string,
        walletAddress: string
    ): Promise<RentableBook> {
        if (!formData.depositAmount || !formData.lendingPeriod) {
            throw new LibraryServiceError("Deposit amount and lending period are required for rentable books");
        }

        const tokenId = await blockchainService.createRentableBook(
            metadataCid,
            formData.depositAmount,
            parseInt(formData.lendingPeriod)
        );

        return {
            id: tokenId,
            title: formData.title,
            author: formData.author,
            genre: formData.genre as BookGenre,
            publishedYear: parseInt(formData.publishedYear),
            description: formData.description,
            coverImage: this.processCoverImage(formData.coverImage),
            coverColor: formData.coverColor,
            status: 'ForRent' as BookStatus,
            owner: walletAddress,
            depositAmount: parseFloat(formData.depositAmount),
            lendingPeriod: parseInt(formData.lendingPeriod),
            created: new Date(),
            rating: 0
        };
    }

    /**
     * Create a sellable book
     * @private
     */
    private async createSellableBook(
        formData: BookFormData,
        metadataCid: string,
        walletAddress: string
    ): Promise<SellableBook> {
        if (!formData.price) {
            throw new LibraryServiceError("Price is required for sellable books");
        }

        // Create the book on the blockchain
        const tokenId = await blockchainService.createSellableBook(
            metadataCid,
            formData.price
        );

        // Return the book object
        return {
            id: tokenId,
            title: formData.title,
            author: formData.author,
            genre: formData.genre as BookGenre,
            publishedYear: parseInt(formData.publishedYear),
            description: formData.description,
            coverImage: this.processCoverImage(formData.coverImage),
            coverColor: formData.coverColor,
            status: 'Available' as BookStatus,
            owner: walletAddress,
            price: parseFloat(formData.price),
            created: new Date(),
            rating: 0
        };
    }

    /**
     * Validate book form data
     * @private
     */
    private validateBookFormData(formData: BookFormData): void {
        if (!formData.title?.trim()) {
            throw new LibraryServiceError('Title is required');
        }

        if (!formData.author?.trim()) {
            throw new LibraryServiceError('Author is required');
        }

        if (!formData.genre?.trim()) {
            throw new LibraryServiceError('Genre is required');
        }

        if (!formData.publishedYear?.trim()) {
            throw new LibraryServiceError('Published year is required');
        }

        if (formData.bookType !== 'rentable' && formData.bookType !== 'sellable') {
            throw new LibraryServiceError('Invalid book type');
        }

        if (formData.bookType === 'rentable') {
            if (!formData.depositAmount) {
                throw new LibraryServiceError('Deposit amount is required for rentable books');
            }

            if (!formData.lendingPeriod) {
                throw new LibraryServiceError('Lending period is required for rentable books');
            }
        } else if (formData.bookType === 'sellable') {
            if (!formData.price) {
                throw new LibraryServiceError('Price is required for sellable books');
            }
        }
    }

    /**
     * Borrow a book
     * @param bookToBorrow The book to borrow
     * @param walletAddress Borrower wallet address
     * @returns Promise resolving to the updated book
     * @throws {BookNotFoundError} If the book doesn't exist
     * @throws {PermissionError} If the user is the owner
     * @throws {LibraryServiceError} If borrowing fails
     * @throws {UserBannedError} If the user is banned
     */
    async borrowBook(bookToBorrow: RentableBook, walletAddress: string): Promise<RentableBook> {
        try {
            // 1. Validate the book and permissions
            this.validateBookForBorrowing(bookToBorrow, walletAddress);

            // 2. Ensure user is registered
            await this.ensureUserRegistered(walletAddress);

            // 3. Execute blockchain transaction for borrowing
            const depositAmount = bookToBorrow.depositAmount.toString();
            await blockchainService.borrowBook(bookToBorrow.id, depositAmount);

            // 4. Return updated book object
            return {
                ...bookToBorrow,
                status: 'Lent',
                borrower: walletAddress,
                borrowStatus: 'Active',
                borrowDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error borrowing book:', error);

            if (error instanceof UserBannedError || error instanceof PermissionError) {
                throw error;
            }

            throw new LibraryServiceError('Error borrowing book', error);
        }
    }

    /**
     * Validate that a book can be borrowed
     * @private
     */
    private validateBookForBorrowing(book: AnyBookType, walletAddress: string): void {
        if (!this.isRentable(book)) {
            throw new PermissionError("This book is not available for borrowing");
        }

        if (book.status !== 'ForRent') {
            throw new PermissionError("This book is not available for borrowing");
        }

        if (book.owner.toLowerCase() === walletAddress.toLowerCase()) {
            throw new PermissionError("You cannot borrow your own book");
        }
    }

    /**
     * Return a book
     * @param bookToReturn The book to return
     * @returns Promise resolving to the updated book
     * @throws {BookNotFoundError} If the book doesn't exist
     * @throws {PermissionError} If the user is not the borrower
     * @throws {LibraryServiceError} If return fails
     * @throws {UserBannedError} If the user is banned
     */
    async returnBook(bookToReturn: RentableBook): Promise<RentableBook> {
        try {
            if (!this.isRentable(bookToReturn)) {
                throw new PermissionError("This book is not a rentable book");
            }

            if (bookToReturn.status !== 'Lent') {
                throw new PermissionError("This book is not currently borrowed");
            }
            await blockchainService.returnBook(bookToReturn.id);

            return {
                ...bookToReturn,
                status: 'ForRent',
                borrower: undefined,
                borrowStatus: undefined,
                borrowDate: undefined
            };
        } catch (error) {
            console.error('Error returning book:', error);

            if (error instanceof UserBannedError || error instanceof PermissionError) {
                throw error;
            }

            throw new LibraryServiceError('Error returning book', error);
        }
    }

    /**
     * Buy a book
     * @param bookToBuy The book to buy
     * @param walletAddress Buyer wallet address
     * @returns Promise resolving to the updated book
     * @throws {BookNotFoundError} If the book doesn't exist
     * @throws {PermissionError} If the user is the owner
     * @throws {LibraryServiceError} If purchase fails
     * @throws {UserBannedError} If the user is banned
     */
    async buyBook(bookToBuy: SellableBook, walletAddress: string): Promise<SellableBook> {
        try {

            this.validateBookForPurchase(bookToBuy, walletAddress);
            await this.ensureUserRegistered(walletAddress);

            const price = bookToBuy.price.toString();
            await blockchainService.buyBook(bookToBuy.id, price);


            return {
                ...bookToBuy,
                status: 'Sold',
                owner: walletAddress
            };
        } catch (error) {
            console.error('Error buying book:', error);

            if (error instanceof UserBannedError || error instanceof PermissionError) {
                throw error;
            }

            throw new LibraryServiceError('Error buying book', error);
        }
    }

    /**
     * Validate that a book can be purchased
     * @private
     */
    private validateBookForPurchase(book: AnyBookType, walletAddress: string): void {
        if (!this.isSellable(book)) {
            throw new PermissionError("This book is not available for purchase");
        }

        if (book.status !== 'Available') {
            throw new PermissionError("This book is not available for purchase");
        }

        if (book.owner.toLowerCase() === walletAddress.toLowerCase()) {
            throw new PermissionError("You cannot buy your own book");
        }
    }

    /**
     * Rate a book
     * @param bookToRate The book to rate
     * @param rating Rating value (1-5)
     * @returns Promise resolving to the updated book
     * @throws {LibraryServiceError} If rating fails
     * @throws {UserBannedError} If the user is banned
     */
    async rateBook(bookToRate: Book, rating: number): Promise<Book> {
        try {

            this.validateRating(rating);
            await blockchainService.rateBook(bookToRate.id, rating);


            const currentRating = bookToRate.rating || 0;
            const newRating = currentRating ? (currentRating + rating) / 2 : rating;

            return {
                ...bookToRate,
                rating: parseFloat(newRating.toFixed(1))
            };
        } catch (error) {
            console.error('Error rating book:', error);

            if (error instanceof UserBannedError) {
                throw error;
            }

            throw new LibraryServiceError('Error rating book', error);
        }
    }

    /**
     * Validate rating value
     * @private
     */
    private validateRating(rating: number): void {
        if (rating < 1 || rating > 5) {
            throw new LibraryServiceError("Rating must be between 1 and 5");
        }
    }

    /**
     * Ensure user is registered
     * @private
     */
    private async ensureUserRegistered(walletAddress: string): Promise<void> {
        try {
            const isRegistered = await blockchainService.isUserRegistered(walletAddress);

            if (!isRegistered) {
                await blockchainService.registerUser();
            }
        } catch (error) {
            console.error('Error checking/registering user:', error);
            throw new LibraryServiceError('Error registering user', error);
        }
    }

    /**
     * Process cover image
     * @private
     */
    private processCoverImage(coverImage?: string): string | undefined {
        if (!coverImage) {
            return undefined;
        }

        if (coverImage.startsWith('ipfs://')) {
            return ipfsService.getIPFSUrl(coverImage.substring(7));
        }

        return coverImage;
    }

    /**
     * Type guard to check if a book is rentable
     * @private
     */
    private isRentable(book: AnyBookType): book is RentableBook {
        return 'depositAmount' in book;
    }

    /**
     * Type guard to check if a book is sellable
     * @private
     */
    private isSellable(book: AnyBookType): book is SellableBook {
        return 'price' in book;
    }

    getYearRange(books: AnyBookType[]): [number, number] {
        if (books.length === 0) return [1800, new Date().getFullYear()];

        const years = books.map(book => book.publishedYear);
        return [Math.min(...years), Math.max(...years)];
    }
    getUniqueGenres(): string[] {
        return [...ALL_GENRES].sort();
    }
}

export const libraryService = new LibraryService();