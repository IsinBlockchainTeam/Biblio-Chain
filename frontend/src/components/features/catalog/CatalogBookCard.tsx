import styles from './styles/CatalogBookCard.module.css';
import RatingStars from '../../common/RatingStars.tsx';

/**
 * Props for CatalogBookCard component
 */
export interface CatalogBookCardProps {
    id: number;
    title: string;
    author: string;
    coverImage?: string;
    coverColor: string;
    rating?: number;
    status?: string;
    genre?: string;
    publishedYear?: number;
    onClick?: () => void;
    disableHoverEffect?: boolean;
}

/**
 * Renders a single book card for the catalog.
 * Displays cover, title, author, rating, status, genre, and publication year.
 */
const CatalogBookCard  = ({
                                                       title,
                                                       author,
                                                       coverImage,
                                                       coverColor,
                                                       rating,
                                                       status,
                                                       genre,
                                                       publishedYear,
                                                       onClick,
                                                       disableHoverEffect = false
                                                   } : CatalogBookCardProps) => {
    /**
     * Returns a CSS class based on the book's availability status
     */
    const getStatusClass = () => {
        if (!status) return '';

        switch (status) {
            case 'Available':
                return styles.available;
            case 'ForRent':
            case 'For Rent':
                return styles.forRent;
            case 'Lent':
                return styles.lent;
            default:
                return '';
        }
    };

    return (
        <div
            className={`${styles.bookCard} ${disableHoverEffect ? styles.noHoverEffect : ''}`}
            onClick={onClick}
        >
            {/* Cover */}
            <div
                className={styles.bookCover}
                style={{
                    backgroundColor: coverColor,
                    backgroundImage: coverImage ? `url(${coverImage})` : 'none',
                }}
            >
                {/* Fallback for missing cover */}
                {!coverImage && (
                    <div className={styles.bookCoverFallback}>
                        <span>{title}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className={styles.bookContent}>
                <h3 className={styles.bookTitle}>{title}</h3>
                <p className={styles.bookAuthor}>{author}</p>

                <div className={styles.bookMeta}>
                    <div className={styles.bookRating}>
                        <RatingStars rating={rating ?? 0} />
                        <span className={styles.ratingValue}>{(rating ?? 0).toFixed(1)}</span>
                    </div>
                    {publishedYear && (
                        <span className={styles.publishYear}>{publishedYear}</span>
                    )}
                </div>

                <div className={styles.bookTags}>
                    {status && (
                        <span className={`${styles.statusTag} ${getStatusClass()}`}>
                            {status === 'ForRent' ? 'For Rent' : status}
                        </span>
                    )}
                    {genre && <span className={styles.genreTag}>{genre}</span>}
                </div>
            </div>
        </div>
    );
};

export default CatalogBookCard;
