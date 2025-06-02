import { BookFormData } from "../../types/interfaces.ts"

/**
 * Service for book form validation and normalization
 */
export class BookService {
    /**
     * Validates a single book form field
     * @param fieldName Name of the field to validate
     * @param value Field value
     * @returns Validation error message or undefined if valid
     */
    validateField(
        fieldName: keyof BookFormData,
        value: string | undefined | File | "rentable" | "sellable"
    ): string | undefined {
        switch (fieldName) {
            case 'title':
                return this.validateRequiredField(value as string, 'Title')
            case 'author':
                return this.validateRequiredField(value as string, 'Author')
            case 'genre':
                return this.validateRequiredField(value as string, 'Genre')
            case 'publishedYear':
                return this.validateYear(value as string)
            case 'depositAmount':
            case 'price':
                return this.validateAmount(value as string)
            case 'lendingPeriod':
                return this.validateLendingPeriod(value as string)
            default:
                return undefined
        }
    }

    /**
     * Performs binary signature validation for image content
     * @param file Image file to validate
     * @returns Object indicating validity and optional error message
     */
    async validateImageContent(file: File): Promise<{ isValid: boolean; errorMessage?: string }> {
        try {
            const buffer = await file.arrayBuffer()
            const bytes = new Uint8Array(buffer).slice(0, 8)
            const hex = Array.from(bytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')

            const jpegSignatures = ['ffd8ff']
            const pngSignature = '89504e47'
            const gifSignatures = ['474946383761', '474946383961']
            const webpSignature = '52494646'

            const isValidImage =
                jpegSignatures.some(sig => hex.startsWith(sig)) ||
                hex.startsWith(pngSignature) ||
                gifSignatures.some(sig => hex.startsWith(sig)) ||
                hex.startsWith(webpSignature)

            if (!isValidImage) {
                return {
                    isValid: false,
                    errorMessage: "File does not appear to be a valid image"
                }
            }

            return { isValid: true }
        } catch (error) {
            console.error("Error validating image content:", error)
            return {
                isValid: false,
                errorMessage: "Error validating image content"
            }
        }
    }

    /**
     * Validates image file type, size, extension, and binary content
     * @param file Image file
     * @returns Validation error message or undefined if valid
     */
    async validateImage(file: File | undefined): Promise<string | undefined> {
        if (!file) return undefined

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return "Unsupported file type. Use JPEG, PNG, GIF, or WebP"
        }

        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return "Image must be smaller than 5MB"
        }

        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        const fileName = file.name.toLowerCase()
        if (!validExtensions.some(ext => fileName.endsWith(ext))) {
            return "Invalid file extension. Use .jpg, .jpeg, .png, .gif, or .webp"
        }

        const contentCheck = await this.validateImageContent(file)
        if (!contentCheck.isValid) {
            return contentCheck.errorMessage
        }

        return undefined
    }

    /**
     * Validates that a required string field is not empty
     * @param value Field value
     * @param fieldName Name of the field for the error message
     * @returns Validation error message or undefined
     */
    private validateRequiredField(value: string | undefined, fieldName: string): string | undefined {
        if (!value || !value.trim()) {
            return `${fieldName} is required`
        }
        return undefined
    }

    /**
     * Validates year input format and range
     * @param year Year string
     * @returns Validation error message or undefined
     */
    private validateYear(year: string | undefined): string | undefined {
        const currentYear = new Date().getFullYear()
        if (!year) return 'Year is required'

        const yearNum = parseInt(year, 10)
        if (isNaN(yearNum)) return 'Invalid year'
        if (yearNum < 1000) return 'Year must be at least 1000'
        if (yearNum > currentYear) return `Year cannot be greater than ${currentYear}`

        return undefined
    }

    /**
     * Validates ETH amount input format and value
     * @param amount Amount as string
     * @returns Validation error message or undefined
     */
    private validateAmount(amount: string | undefined): string | undefined {
        if (!amount) return 'Amount is required'

        const normalizedAmount = amount.replace(',', '.')
        const regex = /^\d+(\.\d{1,5})?$/

        if (!regex.test(normalizedAmount)) return 'Invalid amount format'

        const numAmount = parseFloat(normalizedAmount)
        if (numAmount <= 0) return 'Amount must be positive'
        if (numAmount > 1000) return 'Amount cannot exceed 1000 ETH'

        return undefined
    }

    /**
     * Validates lending period input format and range
     * @param period Lending period in days
     * @returns Validation error message or undefined
     */
    private validateLendingPeriod(period: string | undefined): string | undefined {
        if (!period) return 'Lending period is required'

        const periodNum = parseInt(period, 10)
        if (isNaN(periodNum)) return 'Lending period must be a number'
        if (periodNum <= 0) return 'Lending period must be positive'
        if (periodNum > 365) return 'Lending period cannot exceed 365 days'

        return undefined
    }

    /**
     * Normalize user input before storing or validating
     * @param fieldName Name of the field
     * @param value Raw input string
     * @returns Normalized string value
     */
    normalizeInput(fieldName: keyof BookFormData, value: string): string {
        switch (fieldName) {
            case 'depositAmount':
            case 'price':
                return value.replace(',', '.')
            case 'lendingPeriod':
                return value.replace(/\D/g, '')
            default:
                return value
        }
    }

    /**
     * Returns default values for a new book form
     * @returns Initialized book form data
     */
    createInitialFormData(): BookFormData {
        return {
            title: '',
            author: '',
            genre: '',
            publishedYear: new Date().getFullYear().toString(),
            description: '',
            coverColor: '#004E9A',
            bookType: 'rentable',
            lendingPeriod: '30'
        }
    }
}

/**
 * Singleton instance of BookService
 */
export const bookService = new BookService()
