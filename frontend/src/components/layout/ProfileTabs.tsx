import styles from './styles/ProfileTabs.module.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext.tsx';

type ProfileTab = 'books' | 'transactions' | 'settings' | 'admin';

interface ProfileTabsProps {
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
}
/**
 * ProfileTabs component
 * Renders navigation tabs for user profile sections
 * Includes an admin tab if the user has admin privileges
 */
const ProfileTabs = ({ activeTab, onTabChange } :ProfileTabsProps) => {
    const { t } = useTranslation();
    const { isAdmin } = useAuth();

    const tabs: { id: ProfileTab, label: string }[] = [
        { id: 'books', label: t("profile_tab_book") },
        { id: 'transactions', label: t("profile_tab_transaction") },
        { id: 'settings', label: t("profile_tab_settings") }
    ];

    if (isAdmin) {
        tabs.push({ id: 'admin', label: 'Admin' });
    }

    return (
        <div className={styles.tabs}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default ProfileTabs;