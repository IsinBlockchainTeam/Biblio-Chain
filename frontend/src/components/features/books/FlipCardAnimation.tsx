import {ReactNode, useEffect, useState } from 'react';
import styles from './styles/FlipCardAnimation.module.css';
import { Book } from '../../../types/interfaces.ts';

/**
 * Props for the FlipCardAnimation component
 */
interface FlipCardAnimationProps {
    book: Book;
    onClose: () => void;
    coverPosition: { top: number; left: number; width: number; height: number } | null;
    children: ReactNode;
    title: string;
}

/**
 * Animated 3D flip card modal that opens from a book cover's position.
 * Displays custom modal content and optional book details on the back side.
 */
const FlipCardAnimation = ({
                                                           book,
                                                           onClose,
                                                           coverPosition,
                                                           children,
                                                           title
                                                       }: FlipCardAnimationProps) => {
    const [animation, setAnimation] = useState<'initial' | 'centering' | 'flipping'>('initial');
    const [backdropVisible, setBackdropVisible] = useState(false);

    /**
     * Starts the animation sequence on mount
     */
    useEffect(() => {
        setBackdropVisible(true);

        const centeringTimer = setTimeout(() => {
            setAnimation('centering');

            const flippingTimer = setTimeout(() => {
                setAnimation('flipping');
            }, 700); // Duration for centering

            return () => clearTimeout(flippingTimer);
        }, 150); // Delay before centering

        return () => clearTimeout(centeringTimer);
    }, []);

    /**
     * Gets dynamic styles for the animated card wrapper
     */
    const getWrapperStyles = () => {
        if (!coverPosition) {
            return {
                top: '50%',
                left: '50%',
                width: '480px',
                height: '690px',
                transform:
                    animation === 'flipping'
                        ? 'translate(-50%, -50%) rotateY(180deg)'
                        : 'translate(-50%, -50%)'
            };
        }

        return {
            top: `${coverPosition.top}px`,
            left: `${coverPosition.left}px`,
            width: `${coverPosition.width}px`,
            height: `${coverPosition.height}px`,
            transform: 'none',
            transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1)'
        };
    };

    /**
     * Gets class list for the animated wrapper
     */
    const getWrapperClasses = () => {
        const classes = [styles.flipCardWrapper];

        if (animation === 'centering' || animation === 'flipping') {
            classes.push(styles.flipCardCentering);
        }

        if (animation === 'flipping') {
            classes.push(styles.flipCardRotating);
        }

        return classes.join(' ');
    };

    return (
        <div className={styles.animationContainer} onClick={onClose}>
            {/* Backdrop overlay */}
            <div
                className={`${styles.backdropOverlay} ${
                    backdropVisible ? styles.backdropVisible : ''
                }`}
            />

            {/* Flip card container */}
            <div
                className={getWrapperClasses()}
                style={getWrapperStyles()}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Front side (book cover) */}
                <div
                    className={styles.flipCardFront}
                    style={{
                        backgroundImage: book.coverImage ? `url(${book.coverImage})` : 'none',
                        backgroundColor: book.coverColor
                    }}
                >
                    {!book.coverImage && (
                        <div className={styles.placeholderCover}>
                            <div className={styles.placeholderTitle}>{book.title}</div>
                            <div className={styles.placeholderAuthor}>{book.author}</div>
                        </div>
                    )}
                </div>

                {/* Back side (modal content) */}
                <div className={styles.flipCardBack}>
                    <div className={styles.modalHeader}>
                        <h2 className={styles.modalTitle}>{title}</h2>
                        <button onClick={onClose} className={styles.closeButton}>×</button>
                    </div>

                    <div className={styles.modalBody}>
                        {title !== 'Return Book' && title !== 'Rate this book' && (
                            <div className={styles.bookDetails}>
                                <div
                                    className={styles.bookCover}
                                    style={{
                                        backgroundColor: book.coverColor,
                                        backgroundImage: book.coverImage
                                            ? `url(${book.coverImage})`
                                            : 'none'
                                    }}
                                />
                                <div className={styles.bookInfo}>
                                    <h3 className={styles.bookTitle}>{book.title}</h3>
                                    <p className={styles.bookAuthor}>{book.author}</p>
                                </div>
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlipCardAnimation;
