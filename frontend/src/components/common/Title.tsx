import styles from './styles/Title.module.css';

type TitleAlignment = 'left' | 'center' | 'right';
type TitleSize = 'small' | 'medium' | 'large';

interface TitleProps {
    /** Text or elements to display inside the title */
    children: React.ReactNode;
    /** Text alignment (default: center) */
    alignment?: TitleAlignment;
    /** Additional custom class */
    className?: string;
    /** Font size (default: medium) */
    size?: TitleSize;
    /** Optional spacing below the title (in rem) */
    bottomPadding?: number;
    /** Whether to show the underline below the title (default: true) */
    showUnderline?: boolean;
}

/**
 * Title
 *
 * Displays a styled heading with optional alignment, size, underline and padding.
 */
function Title({
                   children,
                   alignment = 'center',
                   className = '',
                   size = 'medium',
                   bottomPadding,
                   showUnderline = true
               }: TitleProps) {
    const paddingStyle = bottomPadding !== undefined ? { marginBottom: `${bottomPadding}rem` } : {};

    const containerClass = `
        ${styles.titleContainer}
        ${styles[`align${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`]}
        ${className}
    `.trim();

    const titleClass = `
        ${styles.title}
        ${styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`]}
    `.trim();

    return (
        <div className={containerClass} style={paddingStyle}>
            <h2 className={titleClass}>{children}</h2>
            {showUnderline && <div className={styles.underline} />}
        </div>
    );
}

export default Title;
