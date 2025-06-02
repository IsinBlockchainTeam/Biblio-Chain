import styles from './styles/BannedUserOverlay.module.css';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';

/**
 * Props for BannedUserOverlay
 */
interface BannedUserOverlayProps {
    walletAddress: string;
}

/**
 * Full-screen overlay shown to banned users, disabling interaction
 * and displaying a message with appeal instructions.
 */
const BannedUserOverlay = ({ walletAddress } : BannedUserOverlayProps) => {
    const { t } = useTranslation();

    return (
        <div className={styles.overlay}>
            <div className={styles.banContainer}>
                <div className={styles.banIcon}>
                    <FontAwesomeIcon icon={faBan} />
                </div>

                <h1 className={styles.banTitle}>{t('ban_title')}</h1>

                <p className={styles.banMessage}>{t('ban_message')}</p>

                <p className={styles.banDetail}>
                    <strong>
                        From now on, BiblioChain will no longer process any of your transactions and
                        access will be blocked until an admin decides to unban you.
                    </strong>
                </p>

                <div className={styles.addressBox}>
                    <span className={styles.addressLabel}>{t('ban_wallet_address')}:</span>
                    <span className={styles.address}>{walletAddress}</span>
                </div>

                <p className={styles.appealInfo}>
                    {t('ban_appeal')}
                    <br />
                    <a
                        href="mailto:admins@sample-bibliochain.com"
                        className={styles.appealEmail}
                    >
                        admins@sample-bibliochain.com
                    </a>
                </p>
            </div>
        </div>
    );
};

export default BannedUserOverlay;
