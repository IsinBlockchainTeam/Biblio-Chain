import { useState } from 'react';
import styles from './styles/SettingsTab.module.css';
import Title from '../../common/Title.tsx';
import { useAuth } from '../../../contexts/AuthContext.tsx';
import { useTranslation } from 'react-i18next';

/**
 * Displays user settings such as wallet address,
 * with the ability to copy it to clipboard.
 */
const SettingsTab = () => {
    const { walletAddress } = useAuth();
    const { t } = useTranslation();

    const [showCopyFeedback, setShowCopyFeedback] = useState(false);

    /**
     * Copies the wallet address to clipboard and shows feedback
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(walletAddress);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    return (
        <div className={styles.settingsTab}>
            <Title size="small" alignment="left">
                {t("profile_settings_title")}
            </Title>

            <div className={styles.settingsForm}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>{t("profile_settings_walletAddress")}</label>
                    <div className={styles.walletAddressContainer}>
                        <div className={styles.walletAddressDisplay}>
                            <span className={styles.addressText}>{walletAddress}</span>
                        </div>
                        <button
                            className={styles.copyButton}
                            onClick={handleCopy}
                        >
                            {showCopyFeedback ? t("copy_feedback") : t("copy")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
