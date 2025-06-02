import styles from './styles/LoadingIndicator.module.css';
import { useTranslation } from 'react-i18next';

interface BlockchainLoadingProps {
    message?: string;
}

/**
 * Displays a loading spinner with localized blockchain-related messages.
 * Used while fetching data from the blockchain.
 */
const BlockchainLoading =({
                                                                 message,
                                                             } : BlockchainLoadingProps) => {
    const { t } = useTranslation();

    return (
        <div className={styles.loadingState}>
            <div className={`${styles.spinner} ${styles.spinnerLarge}`} />

            <p className={styles.loadingText}>
                {message || t('blockchain_loading_title', 'Loading books from blockchain')}
                <span className={styles.loadingDots} />
            </p>

            <p className={styles.loadingSubtext}>
                {t(
                    'blockchain_loading_message',
                    'This may take a moment as we connect to the blockchain and load your data.'
                )}
            </p>
        </div>
    );
};

export default BlockchainLoading;
