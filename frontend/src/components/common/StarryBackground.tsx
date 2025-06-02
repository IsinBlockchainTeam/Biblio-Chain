import React from 'react';
import styles from './styles/StarryBackground.module.css';
import { useStarryBackground } from '../../hooks/utils/useStarryBackground.ts';

interface StarryBackgroundProps {
    /** Optional content to render above the starry background */
    children?: React.ReactNode;
    /** Total number of stars to render */
    starsCount?: number;
    /** Percentage of stars that should be colored instead of plain white */
    coloredStarsPercentage?: number;
}

/**
 * StarryBackground
 *
 * Renders an animated starry sky with optional colorful effects and children overlay.
 * Can be used in full-screen mode or within a component area.
 */
function StarryBackground({
                              children,
                              starsCount = 300,
                              coloredStarsPercentage = 5,
                          }: StarryBackgroundProps) {
    const stars = useStarryBackground(starsCount, coloredStarsPercentage);
    const isFullscreen = !children;

    const containerStyle: React.CSSProperties = isFullscreen
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
        }
        : {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
        };

    return (
        <div style={containerStyle}>
            {/* Glowing cosmic blur background */}
            <div className={styles.cosmicEffects}></div>

            {/* Stars layer */}
            {stars.map((star) => (
                <div
                    key={`star-${star.id}`}
                    className={`
                        ${styles.star}
                        ${styles[`star${star.size}`]}
                        ${star.isColored ? styles.starColored : ''}
                    `}
                    style={{
                        top: star.top,
                        left: star.left,
                        animationDelay: star.animationDelay,
                        animationDuration: star.animationDuration,
                        opacity: star.opacity,
                    }}
                />
            ))}

            {/* Content overlay */}
            {children && <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>}
        </div>
    );
}

export default StarryBackground;
