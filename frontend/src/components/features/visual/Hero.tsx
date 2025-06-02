import styles from './styles/Hero.module.css';
import Button from "../../common/Button.tsx";
import { useTranslation } from 'react-i18next';

interface HeroTextProps {
    onExploreClick: () => void;
    onLearnMoreClick: () => void;
}

/**
 * HeroText component
 * Displays the main marketing message and CTA buttons in the hero section
 */
function HeroText({ onExploreClick, onLearnMoreClick }: HeroTextProps) {
    const { t } = useTranslation();

    return (
        <div className={styles.heroContent}>
            <div className={styles.tagline}>{t('hero_tagline')}</div>
            <h1 className={styles.heroTitle}>
                {t("hero_title_start")}
                <span className={styles.highlight}>{t("hero_title_highlight")}</span>
                {t("hero_title_end")}
            </h1>
            <p className={styles.heroSubtitle}>{t("hero_subtitle")}</p>
            <div className={styles.buttonGroup}>
                <Button
                    variant="fill"
                    onClick={onExploreClick}
                >
                    {t("hero_primary_cta")} <span>→</span>
                </Button>

                <Button
                    variant="simple"
                    onClick={onLearnMoreClick}
                >
                    {t("hero_secondary_cta")}
                </Button>
            </div>
        </div>
    );
}

export default HeroText;
