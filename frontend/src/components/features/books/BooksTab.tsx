
import styles from './styles/BooksTab.module.css';
import BooksCollection from './BooksCollections.tsx';
import BookDetail from './BookDetail.tsx';
import BlockchainLoading from '../../common/BlockchainLoading.tsx';
import { useProfile } from '../../../contexts/ProfileContext.tsx';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';
import { useTranslation } from 'react-i18next';

/**
 * Props for BooksTab
 */
interface BooksTabProps {
    onAddNewBook: () => void;
}

/**
 * Displays a tab with owned and borrowed books.
 * Handles loading/error states and displays detailed view on selection.
 */
const BooksTab = ({ onAddNewBook } :BooksTabProps) => {
    const { t } = useTranslation();
    const {
        filteredOwnedBooks,
        filteredBorrowedBooks,
    } = useProfile();

    const { returnBook, isLoading, error, refreshLibrary } = useLibrary();

    const ownedBookIds = filteredOwnedBooks.map(book => book.id);
    const borrowedBookIds = filteredBorrowedBooks.map(book => book.id);

    if (isLoading) {
        return (
            <div className={styles.booksTab}>
                <BlockchainLoading message={t('profile_loading_books', 'Loading your books from blockchain')} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.booksTab}>
                <div className={styles.errorContainer}>
                    <p className={styles.errorMessage}>
                        {t('profile_error', 'Error loading books: ')} {error}
                    </p>
                    <button
                        className={styles.retryButton}
                        onClick={refreshLibrary}
                    >
                        {t('profile_retry', 'Retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.booksTab}>
            <BooksCollection
                title={t('profile_book_ownedTitle')}
                bookIds={ownedBookIds}
                emptyStateMessage={t('profile_book_noOwned')}
                emptyStateButtonText={t('profile_book_add')}
                emptyStateButtonAction={onAddNewBook}
                onAddBook={onAddNewBook}
            />

            <BooksCollection
                title={t('profile_book_borrowedTitle')}
                bookIds={borrowedBookIds}
                emptyStateMessage={t('profile_book_noBorrowed')}
                emptyStateButtonText={t('profile_book_addFromCatalog')}
                onReturnBook={returnBook}
            />

            <BookDetail />
        </div>
    );
};

export default BooksTab;
