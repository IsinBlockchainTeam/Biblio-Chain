import styles from './styles/AddBookModal.module.css';
import { useBookForm } from '../../../contexts/BookFormContext.tsx';
import { useTranslation } from 'react-i18next';

/**
 * Final review step showing book summary before submission
 */
const BookReviewStep = () => {
    const { t } = useTranslation();
    const { formData } = useBookForm();

    /**
     * Renders the book cover preview with fallback content
     */
    const renderCoverPreview = () => (
        <div
            className={styles.coverPreview}
            style={{
                backgroundColor: formData.coverColor,
                backgroundImage: formData.coverImage ? `url(${formData.coverImage})` : 'none'
            }}
        >
            {!formData.coverImage && (
                <div className={styles.coverPlaceholder}>
                    <p className={styles.coverTitle}>
                        {formData.title || t('add_popup_title_fallback')}
                    </p>
                    <p className={styles.coverAuthor}>
                        {formData.author || t('add_popup_author_fallback')}
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <div className={styles.formStep}>
            <div className={styles.reviewSectionCentered}>
                <div className={styles.reviewLeft}>{renderCoverPreview()}</div>

                <div className={styles.reviewRight}>
                    <h2 className={styles.reviewTitle}>{formData.title}</h2>
                    <p className={styles.bookAuthor}>
                        {t('add_popup_by') + formData.author}
                    </p>

                    <div className={styles.reviewDetails}>
                        <div className={styles.reviewDetail}>
                            <span className={styles.detailLabel}>
                                {t('add_popup_genreReview')}
                            </span>
                            <span className={styles.detailValue}>{formData.genre}</span>
                        </div>

                        <div className={styles.reviewDetail}>
                            <span className={styles.detailLabel}>
                                {t('add_popup_publishReview')}
                            </span>
                            <span className={styles.detailValue}>
                                {formData.publishedYear}
                            </span>
                        </div>

                        <div className={styles.reviewDetail}>
                            <span className={styles.detailLabel}>
                                {t('add_popup_typeReview')}
                            </span>
                            <span className={styles.bookTypeTag}>
                                {formData.bookType === 'rentable'
                                    ? t('add_popup_forRentReview')
                                    : t('add_popup_forSaleReview')}
                            </span>
                        </div>

                        {formData.bookType === 'rentable' && formData.depositAmount && (
                            <div className={styles.reviewDetail}>
                                <span className={styles.detailLabel}>
                                    {t('add_popup_forRentReviewDeposit')}
                                </span>
                                <span className={styles.valueHighlight}>
                                    {formData.depositAmount} ETH
                                </span>
                            </div>
                        )}

                        {formData.bookType === 'sellable' && formData.price && (
                            <div className={styles.reviewDetail}>
                                <span className={styles.detailLabel}>
                                    {t('add_popup_forSaleReviewPrice')}
                                </span>
                                <span className={styles.valueHighlight}>
                                    {formData.price} ETH
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {formData.description && (
                <div className={styles.descriptionContainer}>
                    <h4 className={styles.descriptionTitle}>
                        {t('add_popup_reviewDescription')}
                    </h4>
                    <p className={styles.descriptionText}>{formData.description}</p>
                </div>
            )}
        </div>
    );
};

export default BookReviewStep;
