import styles from './styles/AddBookModal.module.css';
import { useBookForm } from '../../../contexts/BookFormContext.tsx';
import { useTranslation } from 'react-i18next';
import {
    FloatingLabelInput,
    FloatingLabelSelect
} from '../../common/FloatingLabel.tsx';
import { ALL_GENRES } from '../../../types/interfaces.ts';

/**
 * Step for entering book metadata: title, author, genre, year
 */
const BookDetailsStep = () => {
    const { t } = useTranslation();
    const { formData, updateFormData, errors } = useBookForm();

    return (
        <div className={styles.formStep}>
            <div className={styles.fullHeightForm}>
                <FloatingLabelInput
                    id="title"
                    name="title"
                    label={t('add_popup_titleField')}
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    required
                    error={errors.title}
                />

                <FloatingLabelInput
                    id="author"
                    name="author"
                    label={t('add_popup_authorField')}
                    value={formData.author}
                    onChange={(e) => updateFormData('author', e.target.value)}
                    required
                    error={errors.author}
                />

                <FloatingLabelSelect
                    id="genre"
                    name="genre"
                    label={t('add_popup_genreField')}
                    value={formData.genre}
                    onChange={(e) => updateFormData('genre', e.target.value)}
                    required
                    error={errors.genre}
                >
                    <option value="">{t('add_popup_selectGenre')}</option>
                    {ALL_GENRES.map((genre) => (
                        <option key={genre} value={genre}>
                            {genre}
                        </option>
                    ))}
                </FloatingLabelSelect>

                <FloatingLabelInput
                    id="publishedYear"
                    name="publishedYear"
                    label={t('add_popup_publishYear')}
                    value={formData.publishedYear}
                    onChange={(e) => updateFormData('publishedYear', e.target.value)}
                    required
                    error={errors.publishedYear}
                    inputMode="numeric"
                    pattern="\d*"
                />
            </div>
        </div>
    );
};

export default BookDetailsStep;
