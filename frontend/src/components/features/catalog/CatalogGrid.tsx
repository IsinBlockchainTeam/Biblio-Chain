import CatalogBookCard from './CatalogBookCard.tsx';
import styles from './styles/CatalogGrid.module.css';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

/**
 * Displays a grid of filtered books.
 * Handles book selection and shows a message if no books are found.
 */
const CatalogGrid= () => {
    const { filteredBooks, selectBook } = useLibrary();
    const { t } = useTranslation();

    /**
     * Handles user selecting a book by ID
     * @param bookId - The ID of the selected book
     */
    const handleBookSelect = async (bookId: number) => {
        const book = filteredBooks.find(b => b.id === bookId);

        if (!book) {
            console.error(`Book with ID ${bookId} not found.`);
            return;
        }

        try {
            selectBook(book);
        } catch (error) {
            console.error("Error during book selection:", error);
            selectBook(book); // fallback
        }
    };

    return (
        <div className={styles.catalogGrid}>
            {filteredBooks.length > 0 ? (
                <div className={styles.booksGrid}>
                    {filteredBooks.map(book => (
                        <div key={book.id} className={styles.bookCard}>
                            <CatalogBookCard
                                id={book.id}
                                title={book.title}
                                author={book.author}
                                coverColor={book.coverColor}
                                coverImage={book.coverImage}
                                rating={book.rating}
                                status={book.status}
                                genre={book.genre}
                                publishedYear={book.publishedYear}
                                onClick={() => handleBookSelect(book.id)}
                                disableHoverEffect={false}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.noResults}>
                    <div className={styles.noResultsIcon}>
                        <FontAwesomeIcon
                            icon={faBook}
                            size="3x"
                            style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                        />
                    </div>
                    <h3 className={styles.noResultsTitle}>{t('catalog_noBooksFound')}</h3>
                    <p className={styles.noResultsMessage}>
                        {t('catalog_noBooksFoundDesc')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CatalogGrid;
