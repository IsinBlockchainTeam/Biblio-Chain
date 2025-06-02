import { useState } from 'react';
import { Book } from '../../../types/interfaces.ts';
import { useTranslation } from 'react-i18next';
import Button from '../../common/Button.tsx';
import styles from './styles/TransactionContent.module.css';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';

/**
 * Props for RatingTransactionContent component
 */
interface RatingTransactionContentProps {
    book: Book;
    onClose: () => void;
}

/**
 * Displays a modal for rating a book after a transaction.
 * Includes book info, star rating, and submit confirmation.
 */
const RatingTransactionContent = ({
                                                                         book,
                                                                         onClose,
                                                                     } : RatingTransactionContentProps) => {
    const { t } = useTranslation();
    const { rateBook } = useLibrary();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rating, setRating] = useState<number>(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    /**
     * Handles user selecting a rating
     * @param newRating - value from 1 to 5
     */
    const handleRatingChange = (newRating: number) => {
        setRating(newRating);
    };

    /**
     * Submits the rating to the backend
     */
    const handleSubmitRating = async () => {
        if (rating === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            await rateBook(book.id, rating);
            setIsSubmitted(true);
        } catch (err) {
            console.error('Rating submission error:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit rating. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className={styles.ratingSubmittedContainer}>
                <h3 className={styles.ratingThankYouTitle}>{t('transaction_rating_confirm')}</h3>

                <div className={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <div
                            key={star}
                            className={`${styles.ratingStar} ${rating >= star ? styles.ratingStarActive : ''}`}
                        >
                            ★
                        </div>
                    ))}
                </div>

                <div className={styles.modalFooter}>
                    <Button variant="fill" onClick={onClose}>
                        {t('earn_close')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.bookInfoContainer}>
                <div
                    className={styles.bookCover}
                    style={{
                        backgroundColor: book.coverColor,
                        backgroundImage: book.coverImage ? `url(${book.coverImage})` : 'none'
                    }}
                />

                <div className={styles.bookInfoContent}>
                    <div className={styles.bookHeaderInfo}>
                        <h3 className={styles.bookTitle}>{book.title}</h3>
                        <p className={styles.bookAuthor}>{book.author}</p>
                    </div>
                </div>
            </div>

            <div className={styles.ratingSection}>
                <h4 className={styles.ratingSectionTitle}>{t('transaction_rating_title')}</h4>
                <p className={styles.ratingDescription}>{t('transaction_rating_description')}</p>

                <div className={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <div
                            key={star}
                            className={`${styles.ratingStar} ${rating >= star ? styles.ratingStarActive : ''}`}
                            onClick={() => handleRatingChange(star)}
                        >
                            ★
                        </div>
                    ))}
                </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.modalFooter}>
                <Button variant="simple" onClick={onClose} disabled={isProcessing}>
                    {t('transaction_cancel')}
                </Button>

                <Button
                    variant="fill"
                    onClick={handleSubmitRating}
                    disabled={isProcessing || rating === 0}
                    className={isProcessing ? styles.processingButton : ''}
                >
                    {isProcessing
                        ? t('transaction_processing')
                        : t('transaction_confirm_sign')}
                </Button>
            </div>
        </>
    );
};

export default RatingTransactionContent;
