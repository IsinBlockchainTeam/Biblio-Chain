import {useEffect, useState} from 'react';
import { Book, RentableBook } from '../../../types/interfaces.ts';
import { useTranslation } from 'react-i18next';
import Button from '../../common/Button.tsx';
import styles from './styles/TransactionContent.module.css';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';
import {blockchainService} from "../../../services/blockchain/BlockchainService.ts";
import {useAuth} from "../../../contexts/AuthContext.tsx";

interface ReturnTransactionContentProps {
    book: Book;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

const ReturnTransactionContent  = ({
                                                                         book,
                                                                         onClose,
                                                                         onConfirm
                                                                     } : ReturnTransactionContentProps) => {
    const { t } = useTranslation();
    const { rateBook } = useLibrary();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rating, setRating] = useState<number>(0);
    const [hasRated, setHasRated] = useState(false);
    const {walletAddress} = useAuth();


    useEffect(() => {
        const checkServiceStatus = async () => {
            if (!book || !walletAddress) return;

            try {
                const rated = await blockchainService.hasRated(book.id, walletAddress);
                setHasRated(rated);

            } catch (error) {
                console.error("Error checking service status:", error);
            }
        };

        checkServiceStatus().then();
    }, [book, walletAddress]);

    const getDepositAmount = (): number => {
        if ('depositAmount' in book) {
            return (book as RentableBook).depositAmount;
        }
        return 0;
    };

    const getBorrowDuration = (): number | null => {
        if ('borrowDate' in book && book.borrowDate) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const borrowedDate = new Date(book.borrowDate);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - borrowedDate.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return null;
    };

    const depositAmount = getDepositAmount();
    const borrowedDays = getBorrowDuration();
    const lendingPeriod = (book as RentableBook).lendingPeriod || 30;


    const isOverdue = borrowedDays !== null && borrowedDays > lendingPeriod;


    const handleRatingChange = (newRating: number) => {
        setRating(newRating);
    };


    const handleConfirm = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // If the user provided a rating, submit it first
            if (rating > 0) {
                await rateBook(book.id, rating);
            }

            await onConfirm();
            onClose();
        } catch (err) {
            console.error('transaction error:', err);
            setError(err instanceof Error ? err.message : 'transaction failed. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <>
            {/* Book info and rating section */}
            <div className={styles.bookInfoContainer}>
                {/* Book cover */}
                <div
                    className={styles.bookCover}
                    style={{
                        backgroundColor: book.coverColor,
                        backgroundImage: book.coverImage ? `url(${book.coverImage})` : 'none'
                    }}
                />

                {/* Book info and rating */}
                <div className={styles.bookInfoContent}>
                    {/* Book title and author */}
                    <div className={styles.bookHeaderInfo}>
                        <h3 className={styles.bookTitle}>{book.title}</h3>
                        <p className={styles.bookAuthor}>{book.author}</p>
                    </div>

                    {/* Rating section - directly below author */}
                    {
                        !hasRated &&
                        <div className={styles.ratingSection}>
                            <h4 className={styles.ratingSectionTitle}>{t('transaction_rating_title')}</h4>

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
                    }

                </div>
            </div>

            {/* transaction Details Section */}
            <div className={styles.transactionDetails}>
                {/* Borrowing days */}
                {borrowedDays !== null && (
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>
                            {t('transaction_return_borrowed_for')}:
                        </span>
                        <span
                            className={`${styles.detailValue} ${
                                isOverdue ? styles.overdue : ''
                            }`}
                        >
                            {borrowedDays} {t('add_popup_days')}
                        </span>
                    </div>
                )}

                {/* Deposit */}
                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>{t('transaction_return_deposit')}:</span>
                    <span className={styles.detailValue}>{depositAmount} ETH</span>
                </div>

                {/* Owner address */}
                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>{t('transaction_return_to')}:</span>
                    <span className={styles.detailValue}>
                        {book.owner.substring(0, 8)}...
                        {book.owner.substring(book.owner.length - 6)}
                    </span>
                </div>

                {/* Refund total */}
                <div className={styles.detailRowTotal}>
                    <span className={styles.detailLabel}>{t('transaction_return_refund')}:</span>
                    <span className={styles.detailValueTotal}>
                        {depositAmount.toFixed(4)} ETH
                    </span>
                </div>
            </div>

            {/* Error message display */}
            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Display warning if overdue */}
            {isOverdue && (
                <div className={styles.penaltyWarning}>
                    {t("transaction_penalty_warning")}
                </div>
            )}

            {/* Terms info */}
            <div className={styles.termsInfo}>
                <p>{t('transaction_return_terms')}</p>
            </div>

            {/* Action buttons */}
            <div className={styles.modalFooter}>
                <Button variant="simple" onClick={onClose} disabled={isProcessing}>
                    {t('transaction_cancel')}
                </Button>

                <Button
                    variant="fill"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className={isProcessing ? styles.processingButton : ''}
                >
                    {isProcessing
                        ? t('transaction_processing')
                        : t('transaction_confirm_return')}
                </Button>
            </div>
        </>
    );
};

export default ReturnTransactionContent;