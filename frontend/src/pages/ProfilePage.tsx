import { useState } from 'react'
import styles from './styles/ProfilePage.module.css'
import ProfileHeader from '../components/layout/ProfileHeader.tsx'
import ProfileTabs from '../components/layout/ProfileTabs.tsx'
import BooksTab from '../components/features/books/BooksTab.tsx'
import TransactionsTab from '../components/features/transaction/TransactionsTab.tsx'
import SettingsTab from '../components/features/profile/SettingsTab.tsx'
import AdminDashboard from '../components/features/profile/AdminDashboard.tsx'
import AddBookModal from '../components/features/books/AddBookModal.tsx'
import { ProfileProvider } from '../contexts/ProfileContext.tsx'
import { BookFormProvider } from '../contexts/BookFormContext.tsx'
import { useAuth } from '../contexts/AuthContext.tsx'
import { AdminProvider } from "../contexts/AdminContext.tsx"
import ServiceUnavailableModal from "../components/common/ServiceUnavailbleModal.tsx"
import { useServiceStatus } from "../hooks/utils/useServiceStatus.ts"
import { OperationType } from "../types/interfaces.ts"

type ProfileTab = 'books' | 'transactions' | 'settings' | 'admin'
/**
 * ProfilePage is the main profile view shown to authenticated users
 * It displays tabs for books, transactions, settings, and (if admin) admin tools
 * @returns JSX element representing the profile page layout
 */
export default function ProfilePage() {
    const { isAdmin } = useAuth()
    const [activeTab, setActiveTab] = useState<ProfileTab>('books')
    const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false)
    const [showServiceUnavailable, setShowServiceUnavailable] = useState(false)

    const { isPaused: isRentablePaused } = useServiceStatus(OperationType.Rentable)
    const { isPaused: isSellablePaused } = useServiceStatus(OperationType.Sellable)

    const isNewDisabled = isRentablePaused || isSellablePaused

    const handleTabChange = (tab: ProfileTab) => {
        setActiveTab(tab)
    }

    const openAddBookModal = () => setIsAddBookModalOpen(true)
    const closeAddBookModal = () => setIsAddBookModalOpen(false)

    const handleAddBookSuccess = () => {
        closeAddBookModal()
    }

    return (
        <ProfileProvider>
            <div className={styles.profilePage}>
                <div className={styles.container}>
                    {/* Profile header */}
                    <ProfileHeader />

                    {/* Tabs navigation */}
                    <div className={styles.tabsContainer}>
                        <ProfileTabs
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                        />

                        <div className={styles.tabContent}>
                            {activeTab === 'books' && (
                                <BooksTab
                                    onAddNewBook={isNewDisabled ? () => setShowServiceUnavailable(true) : openAddBookModal}
                                />
                            )}

                            {activeTab === 'transactions' && (
                                <TransactionsTab />
                            )}

                            {activeTab === 'settings' && (
                                <SettingsTab />
                            )}

                            {activeTab === 'admin' && isAdmin && (
                                <AdminProvider>
                                    <AdminDashboard />
                                </AdminProvider>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Book Modal */}
                {isAddBookModalOpen && (
                    <BookFormProvider onSuccess={handleAddBookSuccess} onClose={closeAddBookModal}>
                        <AddBookModal onClose={closeAddBookModal} />
                    </BookFormProvider>
                )}

                {/* Service Unavailable Modal */}
                {showServiceUnavailable && (
                    <ServiceUnavailableModal
                        operationType={OperationType.Returning}
                        onClose={() => setShowServiceUnavailable(false)}
                        bookTitle={''}
                    />
                )}
            </div>
        </ProfileProvider>
    )
}
