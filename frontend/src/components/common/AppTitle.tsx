import styles from './styles/AppTitle.module.css';
import { useTranslation } from 'react-i18next';

/**
 * AppTitle component
 *
 * Displays the localized application title with styled accent.
 * Used typically in headers or branding areas.
 */
export default function AppTitle() {
    const { t } = useTranslation();

    return (
        <>
            <span className={styles.logoText}>{t('app_titleStart')}</span>
            <span className={styles.logoAccent}>{t('app_titleEnd')}</span>
        </>
    );
}
