import CatalogBookCard from './CatalogBookCard.tsx';
import styles from './styles/CatalogList.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';

/**
 * Displays books grouped by genre in a vertical list layout.
 * If no books are available, shows an empty state message.
 */
const CatalogList= () => {
    const { booksByGenre, selectBook, precalculateBookMetadata } = useLibrary();
    const { t } = useTranslation();

    /**
     * Prepares metadata and selects a book by ID
     * @param bookId - ID of the selected book
     */
    const handleBookSelect = async (bookId: number) => {
        try {
            await precalculateBookMetadata(bookId);
        } catch (error) {
            console.error("Error preparing book for selection:", error);
        }

        // Fallback: search the book manually in grouped lists
        let selectedBook = null;
        for (const [, books] of Object.entries(booksByGenre)) {
            const found = books.find(b => b.id === bookId);
            if (found) {
                selectedBook = found;
                break;
            }
        }

        if (selectedBook) {
            selectBook(selectedBook);
        }
    };

    const hasBooks = Object.values(booksByGenre).some(books => books.length > 0);

    if (!hasBooks) {
        return (
            <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>
                    <FontAwesomeIcon icon={faBook} size="3x" />
                </div>
                <h3 className={styles.noResultsTitle}>{t('catalog_noBooksFound')}</h3>
                <p className={styles.noResultsMessage}>{t('catalog_noBooksFoundDesc')}</p>
            </div>
        );
    }

    return (
        <div className={styles.genreSections}>
            {Object.entries(booksByGenre).map(([genre, genreBooks]) => {
                if (genreBooks.length === 0) return null;

                return (
                    <div key={genre} className={styles.genreSection}>
                        <h3 className={styles.genreTitle}>
                            {genre} <span className={styles.bookCount}>({genreBooks.length})</span>
                        </h3>
                        <div className={styles.genreBooks}>
                            {genreBooks.map(book => (
                                <div key={book.id} className={styles.bookCard}>
                                    <CatalogBookCard
                                        id={book.id}
                                        title={book.title}
                                        author={book.author}
                                        coverColor={book.coverColor}
                                        coverImage={book.coverImage}
                                        rating={book.rating || 0}
                                        status={book.status}
                                        genre={book.genre}
                                        publishedYear={book.publishedYear}
                                        onClick={() => handleBookSelect(book.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CatalogList;
