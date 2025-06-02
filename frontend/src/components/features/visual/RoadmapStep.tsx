import { forwardRef } from 'react';
import styles from './styles/RoadmapStep.module.css';

interface RoadmapStepProps {
    position: 'left' | 'right';
    number: number;
    title: string;
    description: string;
    isVisible: boolean;
}

/**
 * RoadmapStep component
 * Displays a single step in the roadmap timeline.
 * Uses animation styles based on visibility and step position (left/right).
 */
const RoadmapStep = forwardRef<HTMLDivElement, RoadmapStepProps>(
    ({ position, number, title, description, isVisible }, ref) => {
        const stepPositionClass = position === 'left' ? styles.stepLeft : styles.stepRight;
        const visibilityStyle = {
            opacity: isVisible ? 1 : 0,
            transform: isVisible
                ? 'translateX(0)'
                : `translateX(${position === 'left' ? '50px' : '-50px'})`
        };

        return (
            <div
                ref={ref}
                className={`${styles.roadmapStep} ${stepPositionClass}`}
                style={visibilityStyle}
            >
                <div className={styles.stepNumber}>{number}</div>
                <div className={styles.stepContent}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
            </div>
        );
    }
);

export default RoadmapStep;
