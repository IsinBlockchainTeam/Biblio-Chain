import styles from './styles/ServiceUnavailableModal.module.css';
import Button from './Button.tsx';
import { useTranslation } from 'react-i18next';
import { OperationType } from '../../types/interfaces.ts';

/**
 * Props for ServiceUnavailableModal
 */
interface ServiceUnavailableModalProps {
    operationType: OperationType;
    onClose: () => void;
    bookTitle?: string;
}

/**
 * ServiceUnavailableModal
 *
 * Displays a warning modal when a blockchain-related service is temporarily disabled.
 */
const ServiceUnavailableModal = ({
                                                                       operationType,
                                                                       onClose,
                                                                       bookTitle
                                                                   } : ServiceUnavailableModalProps) => {
    const { t } = useTranslation();

    /**
     * Returns the localized name of the affected service based on the operation type.
     */
    const getServiceName = () => {
        switch (operationType) {
            case OperationType.Borrowing:
                return t('service_borrowing');
            case OperationType.Returning:
                return t('service_returning');
            case OperationType.Purchasing:
                return t('service_purchasing');
            case OperationType.Rentable:
                return t('service_rentable');
            case OperationType.Sellable:
                return t('service_sellable');
            default:
                return t('service_generic');
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.iconContainer}>
                    <div className={styles.icon}>⚠️</div>
                </div>

                <h2 className={styles.title}>{t('service_unavailable_title')}</h2>

                {bookTitle && (
                    <p className={styles.bookTitle}>"{bookTitle}"</p>
                )}

                <p className={styles.message}>
                    {t('service_unavailable_message', { service: getServiceName() })}
                </p>

                <p className={styles.submessage}>
                    {t('service_unavailable_submessage')}
                </p>

                <div className={styles.buttonsContainer}>
                    <Button variant="fill" onClick={onClose}>
                        {t('service_unavailable_button')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ServiceUnavailableModal;
