import { useState } from 'react';
import { Book, RentableBook } from '../../../types/interfaces.ts';
import { useTranslation } from 'react-i18next';
import Button from '../../common/Button.tsx';
import styles from './styles/TransactionContent.module.css';

/**
 * Props for BorrowTransactionContent component
 */
interface BorrowTransactionContentProps {
    book: Book;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

/**
 * Displays the content for confirming a book borrowing.
 * Shows deposit, lending period, and renter info.
 */
const BorrowTransactionContent = ({
                                                                         book,
                                                                         onClose,
                                                                         onConfirm
                                                                     } : BorrowTransactionContentProps) => {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Retrieves the deposit amount from the book if available
     * @returns deposit amount in ETH
     */
    const getDepositAmount = (): number => {
        if ('depositAmount' in book) {
            return (book as RentableBook).depositAmount;
        }
        return 0;
    };

    const depositAmount = getDepositAmount();
    const lendingPeriod = 'lendingPeriod' in book ? (book as RentableBook).lendingPeriod || 30 : 30;

    /**
     * Handles confirmation of the borrow transaction
     */
    const handleConfirm = async () => {
        setIsProcessing(true);
        setError(null);

        try {
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
            <div className={styles.transactionDetails}>
                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>{t('transaction_deposit')}:</span>
                    <span className={styles.detailValue}>{depositAmount} ETH</span>
                </div>

                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>{t('transaction_borrow_period')}:</span>
                    <span className={styles.detailValue}>
                        {lendingPeriod} {t('add_popup_days')}
                    </span>
                </div>

                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>{t('transaction_rent_from')}:</span>
                    <span className={styles.detailValue}>
                        {book.owner.substring(0, 8)}...{book.owner.substring(book.owner.length - 6)}
                    </span>
                </div>

                <div className={styles.detailRowTotal}>
                    <span className={styles.detailLabel}>{t('transaction_total')}:</span>
                    <span className={styles.detailValueTotal}>{depositAmount.toFixed(4)} ETH</span>
                </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.termsInfo}>
                <p>{t('transaction_borrow_terms_short')}</p>
            </div>

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
                        : t('transaction_confirm_sign')}
                </Button>
            </div>
        </>
    );
};

export default BorrowTransactionContent;
