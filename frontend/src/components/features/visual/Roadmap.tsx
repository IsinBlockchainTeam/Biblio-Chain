import { useRef, useEffect, useState } from 'react';
import Title from '../../common/Title.tsx';
import RoadmapStep from './RoadmapStep.tsx';
import styles from './styles/Roadmap.module.css';
import { useTranslation } from 'react-i18next';

type RoadmapPosition = 'left' | 'right';

const stepsData: { number: number; position: RoadmapPosition }[] = [
    { number: 1, position: 'right' },
    { number: 2, position: 'left' },
    { number: 3, position: 'right' },
    { number: 4, position: 'left' },
    { number: 5, position: 'right' },
    { number: 6, position: 'left' }
];

/**
 * RoadmapSection component
 * Displays the animated roadmap with sequential steps and vertical path
 * Uses IntersectionObserver to animate steps when they enter the viewport
 */
function RoadmapSection() {
    const { t } = useTranslation();
    const roadmapStepRefs = useRef<HTMLDivElement[]>([]);
    const [visibleSteps, setVisibleSteps] = useState<boolean[]>(Array(stepsData.length).fill(false));

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = roadmapStepRefs.current.findIndex(ref => ref === entry.target);
                        if (index !== -1) {
                            setVisibleSteps(prev => {
                                const newVisibleSteps = [...prev];
                                newVisibleSteps[index] = true;
                                return newVisibleSteps;
                            });
                        }
                    }
                });
            },
            {
                root: null, // observe the main viewport
                rootMargin: '0px', // no additional margin
                threshold: 0.3 // triggers when at least 30% of the element is visible
            }
        );

        roadmapStepRefs.current.forEach(step => {
            if (step) observer.observe(step);
        });

        return () => {
            roadmapStepRefs.current.forEach(step => {
                if (step) observer.unobserve(step);
            });
        };
    }, []);

    const addToRefs = (el: HTMLDivElement | null) => {
        if (el && !roadmapStepRefs.current.includes(el)) {
            roadmapStepRefs.current.push(el);
        }
    };

    return (
        <section id="how-it-works" className={styles.roadmapSection}>
            <Title>How BiblioChain Works</Title>

            <div className={styles.roadmapContainer}>
                <div className={styles.roadPathContainer}>
                    {/* SVG that visually represents the vertical "road" connecting steps */}
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 320 1500"
                        fill="none"
                        preserveAspectRatio="xMidYMin slice"
                        className={styles.roadSvg}
                    >
                        <path
                            d="M160 0 L160 1500"
                            stroke="#1a2e44"
                            strokeWidth="14"
                            strokeLinecap="round"
                            className={styles.roadPath}
                        />
                        <path
                            d="M160 0 L160 1500"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="10 20"
                            className={styles.roadDashes}
                        />
                    </svg>
                </div>

                {stepsData.map((step, index) => {
                    const title = t(`roadmap.steps.${index}.title`);
                    const description = t(`roadmap.steps.${index}.description`);

                    return (
                        <RoadmapStep
                            key={step.number}
                            ref={addToRefs}
                            position={step.position}
                            number={step.number}
                            title={title}
                            description={description}
                            isVisible={visibleSteps[index]}
                        />
                    );
                })}
            </div>
        </section>
    );
}

export default RoadmapSection;
