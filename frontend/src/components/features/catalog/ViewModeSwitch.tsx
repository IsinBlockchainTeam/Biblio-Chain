import styles from './styles/ViewModeSwitch.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThLarge, faList } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useLibrary } from '../../../contexts/LibraryContext.tsx';

/**
 * Toggle UI for switching between "grid" and "list" catalog views.
 */
const ViewModeSwitch = () => {
    const { viewMode, setViewMode } = useLibrary();
    const { t } = useTranslation();

    return (
        <div className={styles.viewModeSwitch}>
            <span className={styles.label}>{t('catalog_viewMode')}</span>
            <div className={styles.switchContainer}>
                <button
                    className={`${styles.switchButton} ${viewMode === 'grid' ? styles.active : ''}`}
                    onClick={() => setViewMode('grid')}
                    aria-label={t('catalog_grouped')}
                    title={t('catalog_grouped')}
                >
                    <FontAwesomeIcon icon={faThLarge} />
                    <span>{t('catalog_grouped')}</span>
                </button>

                <button
                    className={`${styles.switchButton} ${viewMode === 'list' ? styles.active : ''}`}
                    onClick={() => setViewMode('list')}
                    aria-label={t('catalog_list')}
                    title={t('catalog_list')}
                >
                    <FontAwesomeIcon icon={faList} />
                    <span>{t('catalog_list')}</span>
                </button>
            </div>
        </div>
    );
};

export default ViewModeSwitch;
