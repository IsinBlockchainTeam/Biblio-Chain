import styles from './styles/BooksCollection.module.css';
import BookCard from './BookCard.tsx';
import Button from '../../common/Button.tsx';
import Title from '../../common/Title.tsx';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';

/**
 * Props for BooksCollection component
 */
interface BooksCollectionProps {
    title: string;
    bookIds: number[];
    emptyStateMessage: string;
    emptyStateButtonText?: string;
    emptyStateButtonAction?: () => void;
    onReturnBook?: (id: number) => void;
    onAddBook?: () => void;
}

/**
 * Displays a horizontal scrollable collection of books.
 * Shows fallback message and action when list is empty.
 */
const BooksCollection = ({
                                                       title,
                                                       bookIds,
                                                       emptyStateMessage,
                                                       emptyStateButtonText,
                                                       emptyStateButtonAction,
                                                       onAddBook
                                                   } : BooksCollectionProps) => {
    const { getBookById, selectBook } = useLibrary();

    /**
     * Handles click on a book card
     */
    const handleBookClick = (id: number) => {
        const book = getBookById(id);
        if (book) {
            selectBook(book);
        }
    };

    return (
        <div className={styles.booksCollection}>
            <div className={styles.titleContainer}>
                <Title size="small" alignment="left" bottomPadding={0}>
                    {title}
                </Title>

                {onAddBook && (
                    <button
                        className={styles.addButton}
                        onClick={onAddBook}
                        aria-label="Add new book"
                    >
                        <span className={styles.plusIcon}>+</span>
                    </button>
                )}
            </div>

            {bookIds.length > 0 ? (
                <div className={styles.booksCarousel}>
                    {bookIds.map(id => (
                        <div
                            key={id}
                            onClick={() => handleBookClick(id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <BookCard id={id} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p>{emptyStateMessage}</p>
                    {emptyStateButtonText && emptyStateButtonAction && (
                        <Button variant="fill" onClick={emptyStateButtonAction}>
                            {emptyStateButtonText}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default BooksCollection;
