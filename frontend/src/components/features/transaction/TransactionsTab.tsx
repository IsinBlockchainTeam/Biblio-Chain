import { useEffect } from 'react';
import styles from './styles/TransactionsTab.module.css';
import Title from '../../common/Title.tsx';
import LoadingIndicator from '../../common/LoadingIndicator.tsx';
import { useProfile } from '../../../contexts/ProfileContext.tsx';
import { useTranslation } from 'react-i18next';

/**
 * Displays a list of user transactions inside the profile section.
 * Shows a loading state, empty state, or a table of transactions.
 */
const TransactionsTab = () => {
    const { transactions, isTransactionsLoading, loadTransactions } = useProfile();
    const { t } = useTranslation();

    /**
     * Loads transactions when the component is mounted
     */
    useEffect(() => {
        loadTransactions().then();
    }, []);

    if (isTransactionsLoading) {
        return (
            <div className={styles.transactionsTab}>
                <Title size="small" alignment="left">
                    {t("profile_transaction_title")}
                </Title>
                <LoadingIndicator
                    item={t("profile_transaction_name")}
                    subMessage={t("profile_transaction_loading")}
                />
            </div>
        );
    }

    return (
        <div className={styles.transactionsTab}>
            <Title size="small" alignment="left">
                {t("profile_transaction_title")}
            </Title>

            {transactions.length > 0 ? (
                <div className={styles.transactionsTable}>
                    <div className={styles.tableHeader}>
                        <div className={styles.tableHeaderCell}>Transaction</div>
                        <div className={styles.tableHeaderCell}>Book</div>
                        <div className={styles.tableHeaderCell}>With</div>
                        <div className={styles.tableHeaderCell}>Date</div>
                    </div>

                    {transactions.map((tx) => (
                        <div key={tx.id} className={styles.tableRow}>
                            <div className={`${styles.tableCell} ${styles.transactionType} ${styles[tx.type.toLowerCase()]}`}>
                                {tx.type}
                            </div>
                            <div className={styles.tableCell}>{tx.bookTitle}</div>
                            <div className={styles.tableCell}>{tx.counterpartyAddress}</div>
                            <div className={styles.tableCell}>{tx.date}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p>{t("profile_transaction_noTransaction")}</p>
                </div>
            )}
        </div>
    );
};

export default TransactionsTab;
