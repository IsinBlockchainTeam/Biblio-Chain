import { useNavigate } from 'react-router-dom'
import StarryBackground from '../components/common/StarryBackground.tsx'
import BookCarousel from '../components/features/books/BookCarousel.tsx'
import styles from './styles/HomePage.module.css'
import RoadmapSection from "../components/features/visual/Roadmap.tsx"
import BookModel3D from "../components/features/visual/BookModel3d.tsx"
import HeroText from "../components/features/visual/Hero.tsx"

/**
 * HomePage is the public landing screen for the app
 * It includes the hero section, 3D visual, roadmap, and book carousel
 */
function HomePage() {
    const navigate = useNavigate()

    const scrollToHowItWorks = () => {
        const section = document.getElementById('how-it-works')
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className={styles.homePage}>
            <StarryBackground starsCount={300} coloredStarsPercentage={5} />

            <section className={styles.hero}>
                <HeroText
                    onExploreClick={() => navigate('/catalog')}
                    onLearnMoreClick={scrollToHowItWorks}
                />

                <div className={styles.heroVisual}>
                    <BookModel3D />
                </div>
            </section>

            <RoadmapSection />

            <BookCarousel
                onExploreAllClick={() => navigate('/catalog')}
            />
        </div>
    )
}

export default HomePage
