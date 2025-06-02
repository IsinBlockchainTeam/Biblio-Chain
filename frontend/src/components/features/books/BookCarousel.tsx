import {useState} from 'react';
import Title from '../../common/Title.tsx';
import HomeBookCard from './HomeBookCard.tsx';
import styles from './styles/BookCarousel.module.css';
import Button from '../../common/Button.tsx';
import { useTranslation } from 'react-i18next';
import { useAutoPlay } from '../../../hooks/utils/useAutoPlay.ts';

/**
 * Covers and data for carousel book cards
 */
const BOOK_COVERS = [
    '/images/cover8.jpg',
    '/images/cover9.jpg',
    '/images/cover10.jpg',
    '/images/cover11.jpg',
    '/images/cover12.jpg',
    '/images/cover13.jpg',
    '/images/cover14.jpg'
];

const BOOKS = [
    {
        id: 1,
        title: 'The sweetest obsession',
        author: 'Danielle Lori',
        color: '#004E9A',
        coverImage: BOOK_COVERS[0]
    },
    {
        id: 2,
        title: 'On breathing',
        author: 'Jemieson Webster',
        color: '#428CD4',
        coverImage: BOOK_COVERS[1]
    },
    {
        id: 3,
        title: 'Heir to the gift',
        author: 'Jhonatan Sud',
        color: '#EA4492',
        coverImage: BOOK_COVERS[2]
    },
    {
        id: 4,
        title: 'Star Bringer',
        author: 'Tracy Wolff',
        color: '#FF9CDA',
        coverImage: BOOK_COVERS[3]
    },
    {
        id: 5,
        title: 'Hexed',
        author: 'Emily McEntire',
        color: '#004E9A',
        coverImage: BOOK_COVERS[4]
    },
    {
        id: 6,
        title: 'Radio silence',
        author: 'Alice Oseman',
        color: '#428CD4',
        coverImage: BOOK_COVERS[5]
    },
    {
        id: 7,
        title: 'War Cross',
        author: 'Marie Lu',
        color: '#EA4492',
        coverImage: BOOK_COVERS[6]
    }
];

/**
 * Props for BookCarousel
 */
interface BookCarouselProps {
    onExploreAllClick: () => void;
}

/**
 * Displays a 3D-like animated carousel of featured books.
 * Autoplays every 4 seconds, pauses on hover or manual interaction.
 */
const BookCarousel  = ({ onExploreAllClick } :BookCarouselProps) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useAutoPlay(() => {
        setCurrentIndex((prev) => (prev + 1) % BOOKS.length);
    }, 4000, isPaused);

    /**
     * Handles when a book is manually selected
     */
    const handleBookClick = (index: number) => {
        setCurrentIndex(index);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 5000);
    };

    /**
     * Calculates transform for a given book index (position and scale)
     */
    const getBookTransform = (index: number) => {
        let distance = index - currentIndex;

        if (Math.abs(distance) > BOOKS.length / 2) {
            distance = distance > 0 ? distance - BOOKS.length : distance + BOOKS.length;
        }

        const translateX = distance * 140;
        const scale = 1 - Math.min(0.25, Math.abs(distance) * 0.1);

        return `translateX(${translateX}px) scale(${scale})`;
    };

    /**
     * Calculates z-index based on proximity to center
     */
    const getZIndex = (index: number) => {
        let distance = Math.abs(index - currentIndex);

        if (distance > BOOKS.length / 2) {
            distance = BOOKS.length - distance;
        }

        return 1000 - distance * 100;
    };

    return (
        <section className={styles.discoverSection}>
            <Title>{t('home_carousel_title')}</Title>

            <div
                className={styles.carouselWrapper}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className={styles.carouselContainer}>
                    {BOOKS.map((book, index) => (
                        <HomeBookCard
                            key={book.id}
                            book={book}
                            isActive={index === currentIndex}
                            onClick={() => handleBookClick(index)}
                            style={{
                                transform: getBookTransform(index),
                                zIndex: getZIndex(index)
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.discoverCta}>
                <Button variant="fill" onClick={onExploreAllClick}>
                    {t('home_carousel_button')}
                </Button>
            </div>
        </section>
    );
};

export default BookCarousel;
