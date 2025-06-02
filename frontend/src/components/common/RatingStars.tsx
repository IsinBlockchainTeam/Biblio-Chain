import styles from './styles/RatingStars.module.css';

interface RatingStarsProps {
    /** Rating value from 0 to 5 */
    rating: number;
    /** Whether to display numeric value next to the stars */
    showValue?: boolean;
    /** Size of the stars (default: medium) */
    size?: 'small' | 'medium' | 'large';
}

/**
 * RatingStars
 *
 * Renders a star-based rating component with optional numeric value.
 */
const RatingStars = ({
                                               rating = 0,
                                               showValue = false,
                                               size = 'medium',
                                           } :RatingStarsProps) => {
    const percentage = (Math.min(rating, 5) / 5) * 100;

    return (
        <div className={styles.ratingContainer}>
            <div className={`${styles.stars} ${styles[size]}`}>
                <div className={styles.emptyStars}>★★★★★</div>
                <div
                    className={styles.filledStars}
                    style={{ width: `${percentage}%` }}
                >
                    ★★★★★
                </div>
            </div>

            {showValue && (
                <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
            )}
        </div>
    );
};

export default RatingStars;
