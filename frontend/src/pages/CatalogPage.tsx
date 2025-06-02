import StarryBackground from '../components/common/StarryBackground.tsx'
import Title from '../components/common/Title.tsx'
import BookDetail from '../components/features/books/BookDetail.tsx'
import CatalogFilters from '../components/features/catalog/CatalogFilters.tsx'
import ViewModeSwitch from '../components/features/catalog/ViewModeSwitch.tsx'
import CatalogGrid from '../components/features/catalog/CatalogGrid.tsx'
import CatalogList from '../components/features/catalog/CatalogList.tsx'
import BlockchainLoading from '../components/common/BlockchainLoading.tsx'
import styles from './styles/CatalogPage.module.css'
import { useLibrary } from '../contexts/LibraryContext.tsx'
import { useTranslation } from 'react-i18next'

/**
 * CatalogContent is responsible for rendering the catalog UI,
 * including filters, view switcher, list/grid display and book detail
 * It also handles loading and error states
 */
const CatalogContent= () => {
    const { t } = useTranslation()
    const { filteredBooks, viewMode, isLoading, error } = useLibrary()

    if (isLoading) {
        return (
            <div className={styles.catalogPage}>
                <StarryBackground starsCount={200} coloredStarsPercentage={5} />
                <div className={styles.catalogContainer}>
                    <div className={styles.catalogHeader}>
                        <Title>{t('catalog_title')}</Title>
                    </div>
                    <BlockchainLoading message={t('catalog_loading_books', 'Loading catalog from blockchain')} />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.catalogPage}>
                <StarryBackground starsCount={200} coloredStarsPercentage={5} />
                <div className={styles.catalogContainer}>
                    <div className={styles.catalogHeader}>
                        <Title>{t('catalog_title')}</Title>
                    </div>
                    <div className={styles.errorContainer}>
                        <p className={styles.errorMessage}>
                            {t('catalog_error', 'Error loading books: ')} {error}
                        </p>
                        <button
                            className={styles.retryButton}
                            onClick={() => window.location.reload()}
                        >
                            {t('catalog_retry', 'Retry')}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.catalogPage}>
            <StarryBackground starsCount={200} coloredStarsPercentage={5} />
            <div className={styles.catalogContainer}>
                <div className={styles.catalogHeader}>
                    <Title>{t('catalog_title')}</Title>
                    <p className={styles.catalogDescription}>
                        {t('catalog_desc')}
                    </p>
                </div>

                <CatalogFilters />

                <div className={styles.resultsHeader}>
                    <div className={styles.resultsCount}>
                        {filteredBooks.length}{' '}
                        {filteredBooks.length === 1
                            ? t('catalog_singleBook')
                            : t('catalog_multipleBooks')}
                        {t('catalog_found')}
                    </div>
                    <ViewModeSwitch />
                </div>

                {viewMode === 'grid' ? <CatalogGrid /> : <CatalogList />}
                <BookDetail />
            </div>
        </div>
    )
}

/**
 * CatalogPage is the top-level container for the book catalog
 * It delegates rendering logic to CatalogContent
 */
const CatalogPage =  () => {
    return <CatalogContent />
}

export default CatalogPage
