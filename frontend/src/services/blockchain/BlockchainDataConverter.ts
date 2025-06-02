import { ethers } from 'ethers'
import {
    Book,
    BookGenre,
    IPFSBookMetadata,
    RentableBook,
    SellableBook
} from "../../types/interfaces.ts"
import { ipfsService } from "./IPFSService.ts"
import {EMPTY_WALLET, RATING_SCALE_FACTOR, SECONDS_PER_DAY} from "../../types/costants.ts"


/**
 * Error thrown when data conversion fails
 */
export class DataConversionError extends Error {
    constructor(message: string, public originalError?: unknown) {
        super(message)
        this.name = 'DataConversionError'
    }
}

/**
 * Error thrown when fetching IPFS data fails
 */
export class IPFSFetchError extends Error {
    constructor(message: string, public cid: string, public originalError?: unknown) {
        super(message)
        this.name = 'IPFSFetchError'
    }
}

interface BookBaseData {
    ipfsMetadata: string
    ratingSum: bigint
    ratingCount: bigint
}

interface RentalData {
    borrower: string
    startDate: bigint
    depositAmount: bigint
    lendingPeriod: bigint
}

interface SaleData {
    price: bigint
    isForSale: boolean
}

/**
 * Converts raw blockchain data into application-level book objects
 */
export class BlockchainDataConverter {
    /**
     * Converts raw blockchain book data into a typed application book object
     * @param bookId Token ID of the book
     * @param bookType Type of the book (0 = Rentable, 1 = Sellable)
     * @param bookDataBytes Encoded blockchain data string
     * @param ownerAddress Wallet address of the book owner
     * @returns Converted book object
     */
    async convertBlockchainBookToAppBook(
        bookId: number,
        bookType: number,
        bookDataBytes: string,
        ownerAddress: string
    ): Promise<Book | RentableBook | SellableBook> {
        try {
            if (bookType === 0) {
                return await this.processRentableBook(bookId, bookDataBytes, ownerAddress)
            } else if (bookType === 1) {
                return await this.processSellableBook(bookId, bookDataBytes, ownerAddress)
            } else {
                throw new DataConversionError(`Unknown book type: ${bookType}`)
            }
        } catch (error) {
            if (error instanceof DataConversionError || error instanceof IPFSFetchError) {
                throw error
            }
            throw new DataConversionError(`Error converting book ID ${bookId}`, error)
        }
    }

    /**
     * Converts blockchain data into a RentableBook object
     * @param bookId Token ID of the book
     * @param bookDataBytes Encoded blockchain data string
     * @param ownerAddress Wallet address of the book owner
     * @returns RentableBook object
     */
    private async processRentableBook(
        bookId: number,
        bookDataBytes: string,
        ownerAddress: string
    ): Promise<RentableBook> {
        try {
            const decodedData = this.decodeBookData(
                bookDataBytes,
                [
                    "tuple(string ipfsMetadata, uint256 ratingSum, uint256 ratingCount)",
                    "tuple(address borrower, uint256 startDate, uint256 depositAmount, uint256 lendingPeriod)"
                ]
            )

            const baseData = decodedData.baseData
            const rentalData = decodedData.rentalData!

            const baseBook = await this.createBaseBook(bookId, baseData, ownerAddress)

            return {
                ...baseBook,
                status: this.isEmptyAddress(rentalData.borrower) ? 'ForRent' : 'Lent',
                depositAmount: Number(ethers.formatEther(rentalData.depositAmount)),
                lendingPeriod: Number(rentalData.lendingPeriod),
                borrower: this.isEmptyAddress(rentalData.borrower) ? undefined : rentalData.borrower,
                borrowDate: rentalData.startDate > 0n
                    ? new Date(Number(rentalData.startDate) * 1000).toISOString()
                    : undefined,
                borrowStatus: rentalData.startDate > 0n
                    ? this.calculateBorrowStatus(Number(rentalData.startDate), Number(rentalData.lendingPeriod))
                    : undefined
            }
        } catch (error) {
            throw new DataConversionError(`Error processing rentable book ID ${bookId}`, error)
        }
    }

    /**
     * Converts blockchain data into a SellableBook object
     * @param bookId Token ID of the book
     * @param bookDataBytes Encoded blockchain data string
     * @param ownerAddress Wallet address of the book owner
     * @returns SellableBook object
     */
    private async processSellableBook(
        bookId: number,
        bookDataBytes: string,
        ownerAddress: string
    ): Promise<SellableBook> {
        try {
            const decodedData = this.decodeBookData(
                bookDataBytes,
                [
                    "tuple(string ipfsMetadata, uint256 ratingSum, uint256 ratingCount)",
                    "tuple(uint256 price, bool isForSale)"
                ]
            )

            const baseData = decodedData.baseData
            const saleData = decodedData.saleData!

            const baseBook = await this.createBaseBook(bookId, baseData, ownerAddress)

            return {
                ...baseBook,
                status: saleData.isForSale ? 'Available' : 'Sold',
                price: Number(ethers.formatEther(saleData.price))
            }
        } catch (error) {
            throw new DataConversionError(`Error processing sellable book ID ${bookId}`, error)
        }
    }

    /**
     * Creates a base book object shared by all book types
     * @param bookId Token ID of the book
     * @param baseData Decoded base book data
     * @param ownerAddress Wallet address of the book owner
     * @returns Base book object
     */
    private async createBaseBook(
        bookId: number,
        baseData: BookBaseData,
        ownerAddress: string
    ): Promise<Book> {
        const metadata = await this.fetchIPFSMetadata(baseData.ipfsMetadata)

        const rating = this.calculateRating(
            Number(baseData.ratingSum),
            Number(baseData.ratingCount)
        )

        const coverImage = this.processCoverImage(metadata.coverImage)

        return {
            id: bookId,
            title: metadata.title,
            author: metadata.author,
            genre: metadata.genre as BookGenre,
            publishedYear: parseInt(metadata.publishedYear),
            description: metadata.description || '',
            coverImage,
            coverColor: metadata.coverColor,
            status: 'Available',
            owner: ownerAddress,
            rating,
            created: metadata.created ? new Date(metadata.created) : new Date()
        }
    }

    /**
     * Decodes blockchain book data using the given ABI
     * @param bookDataHex Encoded book data hex string
     * @param abi ABI to decode the book data
     * @returns Decoded book data
     */
    private decodeBookData(
        bookDataHex: string,
        abi: string[]
    ): { baseData: BookBaseData; saleData?: SaleData; rentalData?: RentalData } {
        try {
            const hexData = bookDataHex.startsWith('0x') ? bookDataHex : `0x${bookDataHex}`

            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(abi, hexData)

            const baseData: BookBaseData = {
                ipfsMetadata: decoded[0].ipfsMetadata,
                ratingSum: decoded[0].ratingSum,
                ratingCount: decoded[0].ratingCount
            }

            if (abi[1].includes("depositAmount")) {
                return {
                    baseData,
                    rentalData: decoded[1] as unknown as RentalData
                }
            } else {
                return {
                    baseData,
                    saleData: decoded[1] as unknown as SaleData
                }
            }
        } catch (error) {
            throw new DataConversionError('Error decoding book data', error)
        }
    }

    /**
     * Determines if a borrow is still active or overdue
     * @param startDate Timestamp when borrowing started
     * @param lendingPeriod Lending duration in days
     * @returns Borrow status
     */
    private calculateBorrowStatus(startDate: number, lendingPeriod: number): 'Active' | 'Overdue' {
        const now = Math.floor(Date.now() / 1000)
        const dueDate = startDate + (lendingPeriod * SECONDS_PER_DAY)
        return now > dueDate ? 'Overdue' : 'Active'
    }

    /**
     * Calculates book rating from raw rating values
     * @param ratingSum Total accumulated rating score
     * @param ratingCount Number of ratings received
     * @returns Average rating between 0 and 5
     */
    private calculateRating(ratingSum: number, ratingCount: number): number {
        if (ratingCount === 0) return 0
        return parseFloat(((ratingSum / RATING_SCALE_FACTOR) / ratingCount).toFixed(1))
    }

    /**
     * Fetches metadata from IPFS given its CID
     * @param ipfsCid CID of the metadata object
     * @returns Parsed IPFS metadata object
     */
    private async fetchIPFSMetadata(ipfsCid: string): Promise<IPFSBookMetadata> {
        try {
            const cleanCid = ipfsCid.replace('ipfs://', '')
            const metadata = await ipfsService.getContentFromIPFS(cleanCid)

            if (!metadata) {
                throw new IPFSFetchError(`No metadata returned from IPFS`, cleanCid)
            }

            return metadata as IPFSBookMetadata
        } catch (error) {
            if (error instanceof IPFSFetchError) {
                throw error
            }

            console.warn('Error fetching IPFS metadata, using fallback data', error)
            return this.getFallbackMetadata()
        }
    }

    /**
     * Checks whether an address is the empty wallet address
     * @param address Wallet address to check
     * @returns True if the address is empty
     */
    private isEmptyAddress(address: string): boolean {
        return address === EMPTY_WALLET
    }

    /**
     * Provides default fallback metadata
     * @returns Fallback IPFS metadata object
     */
    private getFallbackMetadata(): IPFSBookMetadata {
        return {
            title: "Unknown Book",
            author: "Unknown Author",
            genre: "Non-fiction",
            publishedYear: new Date().getFullYear().toString(),
            coverColor: "#004E9A",
            created: new Date().toISOString()
        }
    }

    /**
     * Processes cover image IPFS URLs into HTTP URLs if needed
     * @param coverImage IPFS or HTTP image URL
     * @returns Processed image URL
     */
    private processCoverImage(coverImage?: string): string | undefined {
        if (!coverImage) return undefined

        if (coverImage.startsWith('ipfs://')) {
            return ipfsService.getIPFSUrl(coverImage.substring(7))
        }

        return coverImage
    }
}

export const blockchainDataConverter = new BlockchainDataConverter()
