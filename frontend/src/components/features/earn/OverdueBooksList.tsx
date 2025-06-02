import { useState } from 'react';
import styles from './styles/OverdueBooksList.module.css';
import { RentableBook } from '../../../types/interfaces.ts';
import OverdueBookCard from './OverdueBookCard.tsx';
import { useTranslation } from 'react-i18next';
import { useEarn } from '../../../contexts/EarnContext.tsx';

/**
 * Props for OverdueBooksList
 */
interface OverdueBooksListProps {
    books: RentableBook[];
    onRewardEarned: (amount: number) => void;
    onPaused: () => void;
}

/**
 * Displays a list of overdue books that can be returned.
 * Shows rewards when books are returned successfully.
 */
const OverdueBooksList = ({ books, onRewardEarned, onPaused } : OverdueBooksListProps) => {
    const { t } = useTranslation();
    const { returnOverdueBook } = useEarn();
    const [processingBookId, setProcessingBookId] = useState<number | null>(null);

    /**
     * Handles the return of an overdue book and triggers reward callback
     * @param bookId - ID of the book being returned
     */
    const handleReturnBook = async (bookId: number) => {
        try {
            setProcessingBookId(bookId);
            const rewardAmount = await returnOverdueBook(bookId);
            onRewardEarned(rewardAmount);
        } catch (error) {
            console.error('Error returning book:', error);
        } finally {
            setProcessingBookId(null);
        }
    };

    if (books.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyStateIcon}>
                    <i className="fas fa-book-open"></i>
                </div>

                <h3 className={styles.emptyStateTitle}>{t("earn_no_overdue_books")}</h3>
                <p className={styles.emptyStateDescription}>
                    {t("earn_no_overdue_books_description")}
                </p>
            </div>
        );
    }

    return (
        <div className={styles.overdueBooksList}>
            <div className={styles.listHeader}>
                <h2 className={styles.listTitle}>{t("earn_overdue_books")}</h2>
                <div className={styles.bookCount}>
                    {t("earn_books_found", { count: books.length })}
                </div>
            </div>

            <div className={styles.booksList}>
                {books.map(book => (
                    <OverdueBookCard
                        key={book.id}
                        book={book}
                        onReturn={() => handleReturnBook(book.id)}
                        isProcessing={processingBookId === book.id}
                        onPaused={onPaused}
                    />
                ))}
            </div>
        </div>
    );
};

export default OverdueBooksList;
