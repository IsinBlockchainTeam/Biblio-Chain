import { useState, useCallback } from 'react';
import { bookService } from '../../services/library/BookService.ts';
import { useLibrary } from '../../contexts/LibraryContext.tsx';
import { BookFormData, ValidationErrors } from "../../types/interfaces.ts";

type Step = 'details' | 'cover' | 'type' | 'review';

/**
 * Hook for managing book form state and operations
 */
export function useBookFormOperations(onSuccess?: () => void, onClose?: () => void) {
    const { addBook, refreshLibrary } = useLibrary();

    const [formData, setFormData] = useState<BookFormData>(
        bookService.createInitialFormData()
    );
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [currentStep, setCurrentStep] = useState<Step>('details');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    /**
     * Update a specific form field
     */
    const updateFormData = useCallback((fieldName: keyof BookFormData, value: string) => {

        const normalizedValue = bookService.normalizeInput(fieldName, value);
        setFormData(prev => ({ ...prev, [fieldName]: normalizedValue }));

        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    }, [errors]);

    /**
     * Handle image upload for book cover
     */
    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const errorMessage = await bookService.validateImage(file);

        if (errorMessage) {
            setErrors(prev => ({
                ...prev,
                coverFile: errorMessage
            }));
            if (e.target) {
                e.target.value = '';
            }
            return;
        }

        // If validation passed, proceed
        const imageUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            coverImage: imageUrl,
            coverFile: file
        }));

        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors.coverFile;
            return newErrors;
        });
    }, []);

    /**
     * Validate the current step
     */
    const validateStep = useCallback((): boolean => {
        const newErrors: ValidationErrors = {};

        switch (currentStep) {
            case 'details':
                ['title', 'author', 'genre', 'publishedYear'].forEach(field => {
                    const error = bookService.validateField(
                        field as keyof BookFormData,
                        formData[field as keyof BookFormData]
                    );
                    if (error) newErrors[field as keyof BookFormData] = error;
                });
                break;
            case 'type':
                if (formData.bookType === 'rentable') {
                    const depositError = bookService.validateField('depositAmount', formData.depositAmount || '');
                    const periodError = bookService.validateField('lendingPeriod', formData.lendingPeriod || '');

                    if (depositError) newErrors.depositAmount = depositError;
                    if (periodError) newErrors.lendingPeriod = periodError;
                } else if (formData.bookType === 'sellable') {
                    const priceError = bookService.validateField('price', formData.price || '');
                    if (priceError) newErrors.price = priceError;
                }
                break;
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }, [currentStep, formData]);

    /**
     * Check if Next button should be disabled
     */
    const isNextDisabled = useCallback((): boolean => {
        switch (currentStep) {
            case 'details':
                return !formData.title || !formData.author || !formData.genre || !formData.publishedYear;
            case 'type':
                if (formData.bookType === 'rentable')
                    return !formData.depositAmount || !formData.lendingPeriod;
                if (formData.bookType === 'sellable')
                    return !formData.price;
                return false;
            default:
                return false;
        }
    }, [currentStep, formData]);

    /**
     * Navigate to next step
     */
    const goToNextStep = useCallback(() => {
        if (!validateStep()) return;

        switch (currentStep) {
            case 'details':
                setCurrentStep('cover');
                break;
            case 'cover':
                setCurrentStep('type');
                break;
            case 'type':
                setCurrentStep('review');
                break;
        }
    }, [currentStep, validateStep]);

    /**
     * Navigate to previous step
     */
    const goToPrevStep = useCallback(() => {
        switch (currentStep) {
            case 'cover':
                setCurrentStep('details');
                break;
            case 'type':
                setCurrentStep('cover');
                break;
            case 'review':
                setCurrentStep('type');
                break;
        }
    }, [currentStep]);

    /**
     * Get title for current step
     */
    const getStepTitle = useCallback((): string => {
        switch (currentStep) {
            case 'details': return 'Book Details';
            case 'cover': return 'Cover and Description';
            case 'type': return 'Book Type';
            case 'review': return 'Review and Confirm';
            default: return '';
        }
    }, [currentStep]);

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(async (): Promise<void> => {
        if (!validateStep()) return;

        try {

            setIsSubmitting(true);
            await addBook(formData);
            await refreshLibrary();

            if (onSuccess) onSuccess();

            setFormData(bookService.createInitialFormData());
            setErrors({});
            setCurrentStep('details');

            setTimeout(() => {
                if (onClose) onClose();
            }, 500);
        } catch (error) {
            console.error('Error adding book:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [validateStep, addBook, formData, refreshLibrary, onSuccess, onClose]);

    /**
     * Reset form state
     */
    const resetForm = useCallback(() => {
        setFormData(bookService.createInitialFormData());
        setErrors({});
        setCurrentStep('details');
    }, []);

    return {
        // State
        formData,
        errors,
        currentStep,
        isSubmitting,

        // Actions
        updateFormData,
        handleImageUpload,
        validateStep,
        isNextDisabled,
        goToNextStep,
        goToPrevStep,
        getStepTitle,
        handleSubmit,
        resetForm
    };
}