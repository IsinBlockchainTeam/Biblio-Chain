import styles from './styles/AddBookModal.module.css';
import { useBookForm } from '../../../contexts/BookFormContext.tsx';
import { useTranslation } from 'react-i18next';
import { FloatingLabelInput } from '../../common/FloatingLabel.tsx';
import { COVER_COLOR } from '../../../types/costants.ts';

/**
 * Step of the book form for configuring cover appearance:
 * includes description, cover upload, and color selection.
 */
const BookCoverStep = () => {
    const { t } = useTranslation();
    const { formData, updateFormData, handleImageUpload } = useBookForm();

    /**
     * Renders a live preview of the book cover with fallback title/author
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
            {/* Description input */}
            <div className={styles.descriptionSection}>
                <div className={styles.formGroup}>
                    <FloatingLabelInput
                        as="textarea"
                        id="description"
                        name="description"
                        label={t('add_popup_descriptionField')}
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        rows={3}
                    />
                </div>
            </div>

            <div className={styles.sectionDivider}></div>

            <div className={styles.coverPreviewContainer}>
                {renderCoverPreview()}

                <div className={styles.coverOptions}>
                    {/* Image upload */}
                    <div className={styles.formGroup}>
                        <label htmlFor="coverImage">{t('add_popup_coverField')}</label>
                        <div className={styles.customFileInput}>
                            <button
                                className={styles.fileInputButton}
                                onClick={() =>
                                    document.getElementById('coverImage')?.click()
                                }
                            >
                                Open File
                            </button>
                            <span className={styles.fileName}>
                                {formData.coverImage
                                    ? formData.coverImage.split('/').pop()
                                    : t('add_popup_coverNoSelected')}
                            </span>
                            <input
                                type="file"
                                id="coverImage"
                                name="coverImage"
                                onChange={handleImageUpload}
                                accept="image/*"
                                className={styles.hiddenFileInput}
                            />
                        </div>
                        <p className={styles.helpText}>
                            {t('add_popup_colorOptional')}
                        </p>
                    </div>

                    {/* Color picker */}
                    <div className={styles.formGroup}>
                        <label>{t('add_popup_coverColor')}</label>
                        <div className={styles.colorPicker}>
                            {COVER_COLOR.map((color) => (
                                <div
                                    key={color}
                                    className={`${styles.colorOption} ${
                                        formData.coverColor === color
                                            ? styles.selectedColor
                                            : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() =>
                                        updateFormData('coverColor', color)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookCoverStep;
