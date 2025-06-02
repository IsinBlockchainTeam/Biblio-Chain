import styles from './styles/AddBookModal.module.css';
import { useBookForm } from '../../../contexts/BookFormContext.tsx';
import { useTranslation } from 'react-i18next';
import { FloatingLabelInput } from '../../common/FloatingLabel.tsx';

/**
 * Step for choosing the book type (rentable/sellable) and filling relevant pricing info.
 */
const BookTypeStep= () => {
    const { t } = useTranslation();
    const { formData, updateFormData, errors } = useBookForm();

    return (
        <div className={styles.formStep}>
            {/* Book type selection cards */}
            <div className={styles.bookTypeOptions}>
                <div
                    className={`${styles.bookTypeCard} ${
                        formData.bookType === 'rentable' ? styles.selectedType : ''
                    }`}
                    onClick={() => updateFormData('bookType', 'rentable')}
                >
                    <h4>{t('add_popup_rentableTitle')}</h4>
                    <p>{t('add_popup_rentableDesc')}</p>
                </div>

                <div
                    className={`${styles.bookTypeCard} ${
                        formData.bookType === 'sellable' ? styles.selectedType : ''
                    }`}
                    onClick={() => updateFormData('bookType', 'sellable')}
                >
                    <h4>{t('add_popup_sellableTitle')}</h4>
                    <p>{t('add_popup_sellableDesc')}</p>
                </div>
            </div>

            {/* Rentable form inputs */}
            {formData.bookType === 'rentable' && (
                <>
                    <div className={styles.priceInputContainer}>
                        <FloatingLabelInput
                            id="depositAmount"
                            name="depositAmount"
                            label={t('add_popup_rentableDeposit')}
                            value={formData.depositAmount || ''}
                            onChange={(e) => updateFormData('depositAmount', e.target.value)}
                            required
                            error={errors.depositAmount}
                            inputMode="decimal"
                            step="0.00001"
                        />
                        <p className={styles.helpText}>{t('add_popup_fieldDescHelp')}</p>
                    </div>

                    <div className={styles.priceInputContainer}>
                        <FloatingLabelInput
                            id="lendingPeriod"
                            name="lendingPeriod"
                            label={t('add_popup_lendingPeriod')}
                            value={formData.lendingPeriod}
                            onChange={(e) => updateFormData('lendingPeriod', e.target.value)}
                            required
                            error={errors.lendingPeriod}
                            inputMode="text"
                            min="1"
                            max="365"
                        />
                    </div>
                </>
            )}

            {/* Sellable form input */}
            {formData.bookType === 'sellable' && (
                <div className={styles.priceInputContainer}>
                    <FloatingLabelInput
                        id="price"
                        name="price"
                        label={t('add_popup_priceTitle')}
                        value={formData.price || ''}
                        onChange={(e) => updateFormData('price', e.target.value)}
                        required
                        error={errors.price}
                        inputMode="decimal"
                        step="0.00001"
                    />
                    <p className={styles.helpText}>{t('add_popup_fieldDescHelp')}</p>
                </div>
            )}
        </div>
    );
};

export default BookTypeStep;
