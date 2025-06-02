import { useState, useEffect } from 'react'
import Title from '../components/common/Title.tsx'
import StarryBackground from '../components/common/StarryBackground.tsx'
import OverdueBooksList from '../components/features/earn/OverdueBooksList.tsx'
import styles from './styles/EarnPage.module.css'
import BlockchainLoading from '../components/common/BlockchainLoading.tsx'
import { useEarn } from '../contexts/EarnContext.tsx'
import { useTranslation } from 'react-i18next'
import ServiceUnavailableModal from "../components/common/ServiceUnavailbleModal.tsx"
import { OperationType } from "../types/interfaces.ts"
import EarnInfoPanel from "../components/features/earn/EarnInfoPanel.tsx";

/**
 * EarnPage allows users to return overdue books and claim rewards
 * It fetches books from the blockchain and displays the earning interface
 */
export default function EarnPage() {
    const { t } = useTranslation()
    const {
        overdueBooks,
        isLoading,
        error,
        refreshOverdueBooks
    } = useEarn()

    const [showRewardModal, setShowRewardModal] = useState(false)
    const [rewardAmount, setRewardAmount] = useState(0)
    const [showServiceUnavailable, setShowServiceUnavailable] = useState(false)

    useEffect(() => {
        refreshOverdueBooks().then();
    }, [])

    const handleRewardEarned = (amount: number) => {
        setRewardAmount(amount)
        setShowRewardModal(true)
        refreshOverdueBooks()
    }

    const closeRewardModal = () => {
        setShowRewardModal(false)
    }

    if (isLoading) {
        return (
            <div className={styles.earnPage}>
                <StarryBackground starsCount={200} coloredStarsPercentage={5} />
                <div className={styles.container}>
                    <div className={styles.header}>
                        <Title>{t("earn_page_title")}</Title>
                    </div>
                    <BlockchainLoading message={t('earn_loading_books', 'Scanning blockchain for overdue books')} />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.earnPage}>
                <StarryBackground starsCount={200} coloredStarsPercentage={5} />
                <div className={styles.container}>
                    <div className={styles.header}>
                        <Title>{t("earn_page_title")}</Title>
                    </div>
                    <div className={styles.errorContainer}>
                        <p className={styles.errorMessage}>
                            {t('earn_error', 'Error loading overdue books: ')} {error}
                        </p>
                        <button
                            className={styles.retryButton}
                            onClick={() => refreshOverdueBooks()}
                        >
                            {t('earn_retry', 'Retry')}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.earnPage}>
            <StarryBackground starsCount={200} coloredStarsPercentage={5} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <Title>{t("earn_page_title")}</Title>
                </div>

                <div className={styles.contentGrid}>
                    <div className={styles.leftColumn}>
                        <OverdueBooksList
                            books={overdueBooks}
                            onRewardEarned={handleRewardEarned}
                            onPaused={() => setShowServiceUnavailable(true)}
                        />
                    </div>
                    <div className={styles.rightColumn}>
                        <EarnInfoPanel></EarnInfoPanel>
                    </div>
                </div>

                {showRewardModal && (
                    <div className={styles.rewardModalOverlay} onClick={closeRewardModal}>
                        <div className={styles.rewardModal} onClick={e => e.stopPropagation()}>
                            <div className={styles.rewardModalContent}>
                                <h3>{t("earn_reward_received")}</h3>
                                <div className={styles.rewardAmount}>
                                    {rewardAmount.toFixed(4)} ETH
                                </div>
                                <p>{t("earn_reward_thankyou")}</p>
                                <button className={styles.closeButton} onClick={closeRewardModal}>
                                    {t("earn_close")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showServiceUnavailable && (
                    <ServiceUnavailableModal
                        operationType={OperationType.Returning}
                        onClose={() => setShowServiceUnavailable(false)}
                        bookTitle={''}
                    />
                )}
            </div>
        </div>
    )
}
