import styles from './styles/HomeBookCard.module.css';

/**
 * Props for HomeBookCard
 */
interface BookCardProps {
    book: {
        id: number;
        title: string;
        author: string;
        color: string;
        coverImage?: string;
    };
    isActive: boolean;
    onClick: () => void;
    style: React.CSSProperties;
}

/**
 * Displays a book card with 3D effect and hover animation for use in the home carousel.
 */
export default function HomeBookCard({ book, isActive, onClick, style }: BookCardProps) {
    const coverStyle = {
        backgroundColor: book.color,
        ...(book.coverImage
            ? {
                backgroundImage: `url("${book.coverImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }
            : {})
    };

    return (
        <div
            className={`${styles.bookCard} ${isActive ? styles.bookCardActive : ''}`}
            onClick={onClick}
            style={style}
        >
            <div className={styles.bookCover} style={coverStyle}>
                <div className={styles.bookSpine}></div>
                <div className={styles.bookInnerShadow}></div>
            </div>

            <div className={`${styles.bookInfo} ${isActive ? styles.bookInfoVisible : ''}`}>
                <h3 className={styles.bookTitle}>{book.title}</h3>
                <p className={styles.bookAuthor}>{book.author}</p>
            </div>
        </div>
    );
}
