import styles from './styles/Footer.module.css'
import AppTitle from '../common/AppTitle.tsx'

/**
 * Footer component displayed at the bottom of the page
 * Shows the current year and application title
 */
function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <p className={styles.copyright}>
                    &copy; {currentYear} <AppTitle />
                </p>
            </div>
        </footer>
    )
}

export default Footer
