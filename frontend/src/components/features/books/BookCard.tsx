import styles from './styles/BookCard.module.css';
import RatingStars from '../../common/RatingStars.tsx';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';
import { useIsExpiring } from '../../../hooks/book/useIsExpiring.ts';

/**
 * Props for BookCard component
 */
interface BookCardProps {
    id: number;
}

/**
 * Displays a compact book card with title, author, cover, rating,
 * and an "Expiring" ribbon if the book is close to expiration.
 */
const BookCard = ({ id } :BookCardProps) => {
    const { getBookById } = useLibrary();
    const book = getBookById(id);
    const isExpiring = useIsExpiring(id);

    if (!book) return null;

    const { title, author, coverImage, coverColor, rating = 0 } = book;

    return (
        <div className={styles.bookCard}>
            {isExpiring && (
                <div className={styles.ribbon}>
                    <span>Expiring</span>
                </div>
            )}

            <div
                className={styles.bookCover}
                style={{
                    backgroundColor: coverColor,
                    backgroundImage: coverImage ? `url(${coverImage})` : 'none',
                }}
            />

            <div className={styles.bookContent}>
                <div className={styles.bookInfo}>
                    <h3 className={styles.bookTitle}>{title}</h3>
                    <p className={styles.bookAuthor}>{author}</p>
                </div>

                <div className={styles.bookRating}>
                    <RatingStars rating={rating} showValue={true} size="small" />
                </div>
            </div>
        </div>
    );
};

export default BookCard;
