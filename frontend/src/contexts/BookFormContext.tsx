import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { BookFormData, ValidationErrors } from '../types/interfaces'
import { useBookFormOperations } from '../hooks/book/useBookForm.ts'

type Step = 'details' | 'cover' | 'type' | 'review'

interface BookFormContextType {
    formData: BookFormData
    errors: ValidationErrors

    currentStep: Step
    goToNextStep: () => void
    goToPrevStep: () => void

    updateFormData: (fieldName: keyof BookFormData, value: string) => void

    validateStep: () => boolean
    isNextDisabled: () => boolean

    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void

    handleSubmit: () => Promise<void>
    resetForm: () => void

    getStepTitle: () => string

    isSubmitting: boolean
}

const BookFormContext = createContext<BookFormContextType | undefined>(undefined)

interface BookFormProviderProps {
    children: ReactNode
    onSuccess?: () => void
    onClose?: () => void
}

/**
 * BookFormProvider supplies context for the multi-step book creation form
 * Includes state, step navigation, validation, and image upload
 */
export const BookFormProvider = ({
                                                                      children,
                                                                      onSuccess,
                                                                      onClose
                                                                  } : BookFormProviderProps) => {
    const bookFormOps = useBookFormOperations(onSuccess, onClose)

    const contextValue = useMemo<BookFormContextType>(() => ({
        formData: bookFormOps.formData,
        errors: bookFormOps.errors,
        currentStep: bookFormOps.currentStep,
        goToNextStep: bookFormOps.goToNextStep,
        goToPrevStep: bookFormOps.goToPrevStep,
        updateFormData: bookFormOps.updateFormData,
        validateStep: bookFormOps.validateStep,
        isNextDisabled: bookFormOps.isNextDisabled,
        handleImageUpload: bookFormOps.handleImageUpload,
        handleSubmit: bookFormOps.handleSubmit,
        resetForm: bookFormOps.resetForm,
        getStepTitle: bookFormOps.getStepTitle,
        isSubmitting: bookFormOps.isSubmitting
    }), [bookFormOps])

    return (
        <BookFormContext.Provider value={contextValue}>
            {children}
        </BookFormContext.Provider>
    )
}

/**
 * useBookForm provides access to the book form context
 * Must be used inside a BookFormProvider
 *
 * @returns BookFormContextType with form state, actions, and navigation
 */
export const useBookForm = (): BookFormContextType => {
    const context = useContext(BookFormContext)
    if (context === undefined) {
        throw new Error('useBookForm must be used within a BookFormProvider')
    }
    return context
}
