import React, { useEffect } from 'react';
import styles from './styles/AddBookModal.module.css';
import Button from '../../common/Button.tsx';
import Title from '../../common/Title.tsx';
import { useBookForm } from '../../../contexts/BookFormContext.tsx';
import { useTranslation } from 'react-i18next';
import LoadingIndicator from '../../common/LoadingIndicator.tsx';

import BookDetailsStep from './BookDetailsStep.tsx';
import BookCoverStep from './BookCoverStep.tsx';
import BookTypeStep from './BookTypeStep.tsx';
import BookReviewStep from './BookReviewStep.tsx';

/**
 * Props for AddBookModal
 */
interface AddBookModalProps {
    onClose: () => void;
}

/**
 * Modal component that guides the user through a multi-step
 * book creation process: details, cover, type, and review.
 */
const AddBookModal= ({ onClose } :AddBookModalProps) => {
    const steps: ('details' | 'cover' | 'type' | 'review')[] = ['details', 'cover', 'type', 'review'];
    const { t } = useTranslation();

    const {
        currentStep,
        goToNextStep,
        goToPrevStep,
        isNextDisabled,
        handleSubmit,
        getStepTitle,
        isSubmitting,
    } = useBookForm();

    /**
     * Prevents page scroll while the modal is open
     */
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    /**
     * Stops click propagation from modal content to overlay
     */
    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    /**
     * Renders the appropriate step component or loading state
     */
    const renderCurrentStep = () => {
        if (isSubmitting) {
            return (
                <div className={styles.loadingContainer}>
                    <LoadingIndicator
                        message={t('add_popup_submitting')}
                        subMessage={t('add_popup_blockchain_wait')}
                    />
                </div>
            );
        }

        switch (currentStep) {
            case 'details':
                return <BookDetailsStep />;
            case 'cover':
                return <BookCoverStep />;
            case 'type':
                return <BookTypeStep />;
            case 'review':
                return <BookReviewStep />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={handleCardClick}>
                <button className={styles.closeButton} onClick={onClose} disabled={isSubmitting}>
                    ×
                </button>

                <div className={styles.modalHeader}>
                    <Title size="small" alignment="center" bottomPadding={0.5}>
                        {isSubmitting ? t('add_popup_creating_book') : getStepTitle()}
                    </Title>
                </div>

                <div className={styles.modalBody}>
                    {renderCurrentStep()}
                </div>

                {!isSubmitting && (
                    <div className={styles.modalFooter}>
                        <div className={styles.footerContent}>
                            <Button
                                variant="simple"
                                onClick={goToPrevStep}
                                className={currentStep === 'details' ? styles.hidden : ''}
                            >
                                {t('add_popup_back')}
                            </Button>

                            <div className={styles.stepIndicator}>
                                {steps.map((step, index) => (
                                    <div
                                        key={step}
                                        className={`${styles.step} ${currentStep === step ? styles.activeStep : ''} ${
                                            steps.indexOf(currentStep) > index ? styles.completedStep : ''
                                        }`}
                                    />
                                ))}
                            </div>

                            {currentStep !== 'review' ? (
                                <Button
                                    variant="fill"
                                    onClick={goToNextStep}
                                    disabled={isNextDisabled()}
                                >
                                    {t('add_popup_next')}
                                </Button>
                            ) : (
                                <Button variant="fill" onClick={handleSubmit}>
                                    {t('add_popup_addBook')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddBookModal;
