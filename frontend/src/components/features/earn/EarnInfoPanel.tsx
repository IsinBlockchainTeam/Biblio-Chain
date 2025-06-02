import styles from './styles/EarnInfoPanel.module.css';
import { useTranslation } from 'react-i18next';

/**
 * Displays informational panel about how earning works and reward percentage
 */
const EarnInfoPanel = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.infoPanel}>
            <h2 className={styles.panelTitle}>{t("earn_your_stats")}</h2>

            <div className={styles.infoSection}>
                <h3 className={styles.infoTitle}>{t("earn_how_it_works")}</h3>

                <div className={styles.infoContent}>
                    <div className={styles.infoStep}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepText}>{t("earn_step_1")}</div>
                    </div>

                    <div className={styles.infoStep}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepText}>{t("earn_step_2")}</div>
                    </div>

                    <div className={styles.infoStep}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepText}>{t("earn_step_3")}</div>
                    </div>
                </div>
            </div>

            <div className={styles.rewardInfo}>
                <h3 className={styles.rewardTitle}>{t("earn_rewards")}</h3>
                <p className={styles.rewardText}>{t("earn_reward_explanation")}</p>
                <div className={styles.rewardPercentage}>30%</div>
                <p className={styles.rewardNote}>{t("earn_reward_note")}</p>
            </div>
        </div>
    );
};

export default EarnInfoPanel;
