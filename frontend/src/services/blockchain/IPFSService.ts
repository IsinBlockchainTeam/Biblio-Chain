import axios from "axios"
import "../../types/costants.ts"
import { IPFS_GATEWAY } from "../../types/costants.ts"
import { BookFormData } from "../../types/interfaces.ts"

/**
 * Service for interacting with IPFS via Pinata
 */
export class IPFSService {

    /**
     * Returns authorization headers for Pinata API
     */
    private get headers() {
        return {
            pinata_api_key: import.meta.env.VITE_PINATA_API_KEY!,
            pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY!,
        }
    }

    /**
     * Uploads an image file to IPFS using Pinata
     * @param file Image file to upload
     * @returns IPFS hash of the uploaded image
     */
    async uploadImage(file: File): Promise<string> {
        const formData = new FormData()
        formData.append("file", file)
        formData.append('pinataMetadata', JSON.stringify({
            name: `BiblioChain_Cover_${Date.now()}`,
            keyvalues: {
                app: 'BiblioChain',
                type: 'book_cover'
            }
        }))

        const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            headers: {
                ...this.headers,
                "Content-Type": "multipart/form-data"
            }
        })

        return response.data.IpfsHash
    }

    /**
     * Uploads book metadata to IPFS as a JSON object
     * @param bookData Book form data containing metadata fields
     * @returns IPFS hash of the uploaded metadata
     */
    async uploadBookMetadata(bookData: BookFormData): Promise<string> {
        const metadata = {
            title: bookData.title,
            author: bookData.author,
            genre: bookData.genre,
            publishedYear: bookData.publishedYear,
            description: bookData.description || "",
            coverColor: bookData.coverColor,
            coverImage: bookData.coverImage || "",
            type: bookData.bookType,
            created: new Date().toISOString(),
            depositAmount: bookData.depositAmount || "",
            lendingPeriod: bookData.lendingPeriod || "",
            price: bookData.price || ""
        }

        const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            pinataMetadata: {
                name: `${bookData.title.replace(/\s+/g, '_')}_metadata`,
                keyvalues: {
                    app: 'BiblioChain',
                    type: 'book_metadata'
                }
            },
            pinataContent: metadata
        }, {
            headers: this.headers
        })

        return response.data.IpfsHash
    }

    /**
     * Fetches content from IPFS using a CID
     * @param cid IPFS CID or URI
     * @returns The content retrieved from IPFS
     */
    async getContentFromIPFS(cid: string): Promise<unknown> {
        const cleaned = cid.replace('ipfs://', '')
        const url = `${IPFS_GATEWAY}${cleaned}`

        const response = await axios.get(url)
        return response.data
    }

    /**
     * Converts an IPFS URI to a gateway-accessible URL
     * @param cid IPFS CID or URI
     * @returns URL for fetching content through HTTP
     */
    getIPFSUrl(cid: string): string {
        return `${IPFS_GATEWAY}${cid.replace('ipfs://', '')}`
    }

    /**
     * Handles complete upload process for a book
     * Uploads cover (if present) and metadata to IPFS
     * @param bookData Book data including file and metadata
     * @returns Object containing metadata and optional cover CIDs
     */
    async processBookUpload(bookData: BookFormData): Promise<{ metadataCid: string; coverCid?: string }> {
        let coverCid
        if (bookData.coverFile) {
            coverCid = await this.uploadImage(bookData.coverFile)
        }

        const metadataCid = await this.uploadBookMetadata({
            ...bookData,
            coverImage: coverCid ? `ipfs://${coverCid}` : bookData.coverImage
        })

        return { metadataCid, coverCid }
    }
}

/**
 * Singleton instance of IPFSService
 */
export const ipfsService = new IPFSService()
