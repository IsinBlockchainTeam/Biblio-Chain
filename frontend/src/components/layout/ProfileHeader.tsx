import styles from './styles/ProfileHeader.module.css'
import Button from '../common/Button.tsx'
import StarryBackground from '../common/StarryBackground.tsx'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { useTranslation } from 'react-i18next'

/**
 * ProfileHeader component
 * Displays the user's short wallet address, balance, and a disconnect button
 */
const ProfileHeader = () => {
    const { shortAddress, balance, disconnect } = useAuth()
    const { t } = useTranslation()

    return (
        <div className={styles.profileHeader}>
            <StarryBackground>
                <div className={styles.profileHeaderContent}>
                    <div className={styles.walletInfoContainer}>
                        <h1 className={styles.walletAddress}>{shortAddress}</h1>
                        <p className={styles.walletBalance}>{balance}</p>
                    </div>

                    <Button
                        variant="fill"
                        onClick={disconnect}
                        className={styles.disconnectButton}
                    >
                        {t('profile_header_disconnect')}
                    </Button>
                </div>
            </StarryBackground>
        </div>
    )
}

export default ProfileHeader
