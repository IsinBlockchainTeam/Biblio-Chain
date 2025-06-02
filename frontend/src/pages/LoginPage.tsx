import { useState } from 'react'
import styles from './styles/LoginPage.module.css'
import Button from "../components/common/Button.tsx"
import StarryBackground from "../components/common/StarryBackground.tsx"
import Title from "../components/common/Title.tsx"
import { useAuth } from "../contexts/AuthContext.tsx"
import { Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

/**
 * LoginPage is the entry point for user authentication
 * It allows users to connect using MetaMask or WalletConnect
 * If already connected, the user is redirected to the profile page
 */
export default function LoginPage() {
    const { t } = useTranslation()
    const [error] = useState<string | null>(null)
    const { isConnected, connectMetamask, connectWalletConnect } = useAuth()

    if (isConnected) {
        return <Navigate to="/profile" />
    }

    return (
        <div className={styles.loginPage}>
            <StarryBackground starsCount={400} coloredStarsPercentage={10} />

            <div className={styles.loginContainer}>
                <div className={styles.loginBox}>
                    <div className={styles.loginHeader}>
                        <Title
                            size="small"
                            bottomPadding={1.5}
                            showUnderline={true}
                        >
                            {t("login_title")}
                        </Title>
                    </div>

                    <div className={styles.walletOptions}>
                        <Button
                            variant="fill"
                            onClick={connectMetamask}
                            className={styles.walletButton}
                        >
                            <img src="/icons/metamask.svg" alt="MetaMask" className={styles.walletIcon} />
                            {t("login_metamaskButton")}
                        </Button>

                        <Button
                            variant="border"
                            onClick={connectWalletConnect}
                            className={styles.walletButton}
                        >
                            <img src="/icons/wallet-connect.svg" alt="WalletConnect" className={styles.walletIcon} />
                            {t("login_walletConnectButton")}
                        </Button>
                    </div>

                    {error && <p className={styles.errorMessage}>{error}</p>}

                    <div className={styles.infoText}>
                        <p>{t("login_newUserText")}</p>
                        <a
                            href="https://metamask.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                        >
                            {t("login_createWalletText")}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
