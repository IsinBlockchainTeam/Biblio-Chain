import { useEffect, useState } from "react"
import { libraryService } from "../../services/library/LibraryService.ts"
import { useAuth } from "../../contexts/AuthContext.tsx"

/**
 * useIsExpiring checks whether a specific book is close to its return deadline
 *
 * @param id Book ID to check
 * @returns Boolean indicating if the book is expiring soon
 */
export const useIsExpiring = (id: number) => {
    const [isExpiring, setIsExpiring] = useState(false)
    const { walletAddress } = useAuth()

    useEffect(() => {
        const check = async () => {
            const result = await libraryService.isExpiring(id, walletAddress)
            setIsExpiring(result)
        }
        check()
    }, [id])

    return isExpiring
}
