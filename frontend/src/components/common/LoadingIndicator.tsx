import styles from './styles/LoadingIndicator.module.css';

interface LoadingIndicatorProps {
    /** What type of data is being loaded (e.g., 'books', 'profile') */
    item?: string;
    /** Main loading message */
    message?: string;
    /** Secondary contextual message */
    subMessage?: string;
    /** Whether to animate dots after the message */
    showDots?: boolean;
    /** Spinner size */
    size?: 'small' | 'medium' | 'large';
}

/**
 * LoadingIndicator
 *
 * Displays a customizable loading spinner with optional messages and size.
 */
const LoadingIndicator = ({
                                                         item = 'data',
                                                         message,
                                                         subMessage,
                                                         showDots = true,
                                                         size = 'medium'
                                                     } : LoadingIndicatorProps) => {
    const mainMessage = message || `Retrieving ${item}`;
    const defaultSubMessage = `Loading your blockchain ${item.toLowerCase()}`;
    const displaySubMessage = subMessage || defaultSubMessage;

    const spinnerSizeClass = styles[`spinner${size.charAt(0).toUpperCase() + size.slice(1)}`];

    return (
        <div className={styles.loadingState}>
            <div className={`${styles.spinner} ${spinnerSizeClass}`} />

            <p className={styles.loadingText}>
                {mainMessage}
                {showDots && <span className={styles.loadingDots} />}
            </p>

            <p className={styles.loadingSubtext}>{displaySubMessage}</p>
        </div>
    );
};

export default LoadingIndicator;
