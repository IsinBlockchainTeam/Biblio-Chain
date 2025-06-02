import styles from './styles/OverdueBookCard.module.css';
import { useTranslation } from 'react-i18next';
import { useEarn } from '../../../contexts/EarnContext.tsx';
import { useAllServicesStatus, useServiceStatus } from '../../../hooks/utils/useServiceStatus.ts';
import { OperationType, RentableBook } from '../../../types/interfaces.ts';
import Button from '../../common/Button.tsx';

/**
 * Props for OverdueBookCard component
 */
interface OverdueBookCardProps {
    book: RentableBook;
    onReturn: () => void;
    isProcessing: boolean;
    onPaused: () => void;
}

/**
 * Renders a card displaying details about an overdue book,
 * including title, author, overdue days, deposit, and reward.
 */
const OverdueBookCard = ({
                                                       book,
                                                       onReturn,
                                                       isProcessing,
                                                       onPaused
                                                   }: OverdueBookCardProps) => {
    const { t } = useTranslation();
    const { calculateRewardAmount } = useEarn();
    const { isPaused: isReturnPaused } = useServiceStatus(OperationType.Returning);
    const { isAllPaused } = useAllServicesStatus();

    const isServiceUnavailable = isReturnPaused || isAllPaused;

    /**
     * Calculates the number of days the book is overdue
     * @returns number of overdue days
     */
    const calculateDaysOverdue = (): number => {
        if (!book.borrowDate) return 0;

        const borrowDate = new Date(book.borrowDate);
        const dueDate = new Date(borrowDate);
        dueDate.setDate(dueDate.getDate() + book.lendingPeriod);

        const now = new Date();
        const diffTime = Math.abs(now.getTime() - dueDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysOverdue = calculateDaysOverdue();
    const rewardAmount = calculateRewardAmount(book.depositAmount);

    return (
        <div className={styles.overdueBookCard}>
            <div className={styles.bookInfo}>
                <div
                    className={styles.bookCover}
                    style={{
                        backgroundColor: book.coverColor,
                        backgroundImage: book.coverImage ? `url(${book.coverImage})` : 'none'
                    }}
                >
                    {!book.coverImage && (
                        <div className={styles.coverFallback}>
                            <span className={styles.bookInitials}>
                                {book.title.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.bookDetails}>
                    <h3 className={styles.bookTitle}>{book.title}</h3>
                    <p className={styles.bookAuthor}>{book.author}</p>

                    <div className={styles.bookMeta}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>{t("earn_days_overdue")}</span>
                            <span className={styles.overdueCounter}>{daysOverdue}</span>
                        </div>

                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>{t("earn_deposit_amount")}</span>
                            <span className={styles.depositAmount}>{book.depositAmount} ETH</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actionSection}>
                <div className={styles.rewardInfo}>
                    <div className={styles.rewardAmount}>{rewardAmount.toFixed(4)} ETH</div>
                    <div className={styles.rewardLabel}>{t("earn_your_reward")}</div>
                </div>

                {isServiceUnavailable ? (
                    <Button
                        variant="danger"
                        onClick={onPaused}
                        disabled={isProcessing}
                        className={`${styles.returnButton} ${isProcessing ? styles.processing : ''}`}
                    >
                        {t("service_unavailable")}
                    </Button>
                ) : (
                    <Button
                        variant="fill"
                        onClick={onReturn}
                        disabled={isProcessing}
                        className={`${styles.returnButton} ${isProcessing ? styles.processing : ''}`}
                    >
                        {isProcessing ? t("earn_processing") : t("earn_return_book")}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default OverdueBookCard;
