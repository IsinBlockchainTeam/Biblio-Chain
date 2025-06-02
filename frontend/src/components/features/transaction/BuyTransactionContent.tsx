import { useState } from 'react';
import { Book, SellableBook } from '../../../types/interfaces.ts';
import { useTranslation } from 'react-i18next';
import Button from '../../common/Button.tsx';
import styles from './styles/TransactionContent.module.css';

/**
 * Props for BuyTransactionContent component
 */
interface BuyTransactionContentProps {
    book: Book;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

/**
 * Displays content for confirming the purchase of a book.
 * Includes price info, seller details, and transaction controls.
 */
const BuyTransactionContent = ({
                                                                   book,
                                                                   onClose,
                                                                   onConfirm
                                                               } : BuyTransactionContentProps) => {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Retrieves the book price if available
     * @returns price in ETH
     */
    const getPrice = (): number => {
        if ('price' in book) {
            return (book as SellableBook).price;
        }
        return 0;
    };

    const price = getPrice();

    /**
     * Handles confirmation of the book purchase
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
                    <span className={styles.detailLabel}>{t('transaction_price')}:</span>
                    <span className={styles.detailValue}>{price} ETH</span>
                </div>

                <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>{t('transaction_buy_from')}:</span>
                    <span className={styles.detailValue}>
                        {book.owner.substring(0, 8)}...{book.owner.substring(book.owner.length - 6)}
                    </span>
                </div>

                <div className={styles.detailRowTotal}>
                    <span className={styles.detailLabel}>{t('transaction_total')}:</span>
                    <span className={styles.detailValueTotal}>{price.toFixed(4)} ETH</span>
                </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.termsInfo}>
                <p>{t('transaction_buy_terms_short')}</p>
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
                        : t('transaction_confirm_sign')
                    }
                </Button>
            </div>
        </>
    );
};

export default BuyTransactionContent;
