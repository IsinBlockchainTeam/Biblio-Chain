import  {useState, useEffect} from 'react';
import Title from '../../common/Title.tsx';
import Button from '../../common/Button.tsx';
import styles from './styles/AdminDashboard.module.css';
import {useTranslation} from 'react-i18next';
import {useAdmin} from '../../../contexts/AdminContext.tsx';
import LoadingIndicator from '../../common/LoadingIndicator.tsx';
import {blockchainAdminService} from '../../../services/blockchain/BlockchainAdminService.ts';
import {useAuth} from '../../../contexts/AuthContext.tsx';
import {serviceAvailabilityService} from "../../../services/library/AvailabilityService.ts";
import {OperationType} from "../../../types/interfaces.ts";

const AdminDashboard  = () => {
    const {t} = useTranslation();
    const {walletAddress} = useAuth();
    const {
        services,
        adminUsers,
        blacklistedAddresses,
        proposals,
        pauseAllServices,
        unpauseAllServices,
        pauseOperation,
        unpauseOperation,
        revokeAdminPermissions,
        removeFromBlacklist,
        addToBlacklist,
        addNewAdmin,
        approveProposal,
        rejectProposal,
        refreshData,
        isLoading,
        error
    } = useAdmin();

    const [newAdminAddress, setNewAdminAddress] = useState('');
    const [registeredUsers, setRegisteredUsers] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<string[]>([]);
    const [newBlacklistAddress, setNewBlacklistAddress] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [allServicesPaused, setAllServicesPaused] = useState(false);


    useEffect(() => {
        const checkAllPaused = async () => {
            try {
                const paused = await serviceAvailabilityService.areAllPaused();
                setAllServicesPaused(paused);
            } catch (error) {
                console.error('Errore nel controllo dello stato globale dei servizi:', error);
            }
        };

        if (!isLoading) {
            checkAllPaused().then();
        }
    }, [isLoading, services]);


    useEffect(() => {
        const fetchRegisteredUsers = async () => {
            setLoadingUsers(true);
            try {
                const users = await blockchainAdminService.getAllUsers();
                setRegisteredUsers(users);

                const adminAddresses = adminUsers.map(admin => admin.address.toLowerCase());
                const blacklistedAddressesList = blacklistedAddresses.map(entry => entry.address.toLowerCase());

                const available = users.filter((user: string) =>
                    !adminAddresses.includes(user.toLowerCase()) &&
                    !blacklistedAddressesList.includes(user.toLowerCase())
                );

                setAvailableUsers(available);
            } catch (error) {
                console.error('Errore nel caricamento degli utenti registrati:', error);
            } finally {
                setLoadingUsers(false);
            }
        };

        if (!isLoading) {
            fetchRegisteredUsers();
        }
    }, [isLoading, adminUsers, blacklistedAddresses]);

    const handleAddToBlacklist = async () => {
        if (newBlacklistAddress) {
            await addToBlacklist(newBlacklistAddress);
            setNewBlacklistAddress('');
        }
    };

    const handleAddNewAdmin = async () => {
        if (newAdminAddress) {
            await addNewAdmin(newAdminAddress);
            setNewAdminAddress('');
        }
    };

    const getProposalTypeText = (type: string) => {
        switch (type) {
            case 'add_admin':
                return t("admin_add_admin_proposal");
            case 'remove_admin':
                return t("admin_remove_admin_proposal");
            default:
                return type;
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingIndicator message={t("admin_loading")}/>
            </div>
        );
    }

    return (
        <div>
            <Title size="small" alignment="left">
                {t("admin_dashboard_title")}
            </Title>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                    <Button variant="fill" onClick={refreshData}>
                        {t("admin_retry")}
                    </Button>
                </div>
            )}

            <div className={styles.adminDashboard}>
                {/* Proposals */}
                <section className={styles.dashboardSection}>
                    <h2 className={styles.sectionTitle}>
                        {t("admin_governance_proposals")}
                    </h2>
                    {proposals.length === 0 ? (
                        <p className={styles.emptyNotification}>
                            {t("admin_no_proposals")}
                        </p>
                    ) : (
                        <div className={styles.proposalList}>
                            {proposals.map(proposal => (
                                <div key={proposal.id} className={styles.proposalCard}>
                                    <div className={styles.proposalDetails}>
                                        <span className={styles.proposalType}>
                                            {getProposalTypeText(proposal.type)}
                                        </span>
                                        <div className={styles.proposalInfo}>
                                            <span className={styles.proposalLabel}>
                                                {t("admin_target")}:
                                            </span>
                                            <span className={styles.proposalValue}>
                                                {proposal.target}
                                            </span>
                                        </div>
                                        <div className={styles.proposalInfo}>
                                            <span className={styles.proposalLabel}>
                                                {t("admin_initiated_by")}:
                                            </span>
                                            <span className={styles.proposalValue}>
                                                {proposal.proposer}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.proposalVotes}>
                                        <div className={styles.votesContainer}>
                                            <div className={styles.voteCount}>
                                                <span
                                                    className={`${styles.approvalCount} ${styles.approval}`}>
                                                    {proposal.approvalCount}
                                                </span>
                                                <span className={styles.voteLabel}>
                                                    {t("admin_approval_votes")}
                                                </span>
                                            </div>
                                            <div className={styles.voteCount}>
                                                <span className={styles.rejectionCount}>
                                                    {proposal.rejectionCount}
                                                </span>
                                                <span className={styles.voteLabel}>
                                                    {t("admin_rejection_votes")}
                                                </span>
                                            </div>
                                        </div>

                                        {!proposal.hasVoted && (
                                            <div className={styles.voteActions}>
                                                <Button
                                                    variant="resume"
                                                    onClick={() => approveProposal(proposal.id)}
                                                    className={styles.approveButton}
                                                    maxWidth={"92px"}
                                                >
                                                    {t("admin_approve")}
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => rejectProposal(proposal.id)}
                                                    className={styles.rejectButton}
                                                    maxWidth={"92px"}
                                                >
                                                    {t("admin_reject")}
                                                </Button>
                                            </div>
                                        )}

                                        {proposal.hasVoted && (
                                            <div className={styles.votedMessage}>
                                                {t("admin_already_voted")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Services status */}
                <section className={styles.dashboardSection}>
                    <h2 className={styles.sectionTitle}>
                        {t("admin_services_status")}
                    </h2>

                    <div className={styles.servicesList}>
                        {/* Global status */}
                        <div className={`${styles.serviceCard} ${allServicesPaused ? styles.paused : styles.running}`}>
                            <div className={styles.serviceInfo}>
                                <span className={styles.serviceName}>{t("admin_global_system")}</span>
                                <span className={styles.description}>{t("admin_manage_all_status")}</span>
                            </div>
                            <div className={styles.serviceActions}>
                                <span className={styles.serviceStatus}>
                                </span>
                                {allServicesPaused ? (
                                    <Button
                                        variant="resume"
                                        onClick={unpauseAllServices}
                                        className={styles.serviceButton}
                                    >
                                        {t("admin_unpause_all")}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="danger"
                                        onClick={pauseAllServices}
                                        className={styles.serviceButton}
                                    >
                                        {t("admin_pause_all")}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Services */}
                        {services.map(service => (
                            <div
                                key={service.name}
                                className={`${styles.serviceCard} ${styles[service.status]}`}
                            >
                                <div className={styles.serviceInfo }>
                                    <span className={styles.serviceName}>{service.name}</span>
                                    <span className={styles.small}>
                                        {service.status === 'running' ? 'Running' : 'Paused'}
                                    </span>

                                </div>
                                <div  className={styles.serviceActions}>
                                    {service.status === 'running' ? (
                                        <Button
                                            variant="danger"
                                            onClick={() => {
                                                // Mappatura del nome del servizio al tipo di operazione
                                                if (service.name === 'Book Creation Service') {
                                                    pauseOperation(OperationType.Rentable);
                                                    pauseOperation(OperationType.Sellable);
                                                } else if (service.name === 'Book Borrowing Service') {
                                                    pauseOperation(OperationType.Borrowing);
                                                } else if (service.name === 'Book Return Service') {
                                                    pauseOperation(OperationType.Returning);
                                                } else if (service.name === 'Book Purchase Service') {
                                                    pauseOperation(OperationType.Purchasing);
                                                }
                                            }}
                                            className={styles.serviceButton}
                                        >
                                            {t("admin_pause_service")}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="resume"
                                            onClick={() => {
                                                if (service.name === 'Book Creation Service') {
                                                    unpauseOperation(OperationType.Rentable);
                                                    unpauseOperation(OperationType.Sellable);
                                                } else if (service.name === 'Book Borrowing Service') {
                                                    unpauseOperation(OperationType.Borrowing);
                                                } else if (service.name === 'Book Return Service') {
                                                    unpauseOperation(OperationType.Returning);
                                                } else if (service.name === 'Book Purchase Service') {
                                                    unpauseOperation(OperationType.Purchasing);
                                                }
                                            }}
                                            className={styles.serviceButton}
                                        >
                                            {t("admin_unpause_service")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* danger zone */}
                <section className={styles.dangerZoneSection}>
                    <h2 className={styles.dangerZoneTitle}>
                        {t("admin_danger_zone")}
                    </h2>
                    <div className={styles.dangerZoneContent}>
                        {/* revoke  */}
                        <div className={styles.dangerZoneItem}>
                            <div className={styles.dangerZoneItemContent}>
                                <h3>{t("admin_revoke_admin_permissions")}</h3>
                                <p>{t("admin_revoke_permissions_description")}</p>
                                {adminUsers.length === 0 ? (
                                    <p className={styles.emptyNotification}>
                                        {t("admin_no_other_admins")}
                                    </p>
                                ) : (
                                    <div className={styles.dangerZoneItemList}>
                                        {adminUsers
                                            .filter(admin => !admin.isCurrentUser)
                                            .map(admin => (
                                                <div key={admin.address} className={styles.dangerZoneListItem}>
                                                    <span className={styles.addressText}>{admin.address}</span>
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => revokeAdminPermissions(admin.address)}
                                                    >
                                                        {t("admin_initiate_revoke")}
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* add */}
                        <div className={styles.dangerZoneItem}>
                            <div className={styles.dangerZoneItemContent}>
                                <h3>{t("admin_add_new_admin")}</h3>
                                <p>{t("admin_add_new_admin_description")}</p>

                                {loadingUsers ? (
                                    <p className={styles.emptyNotification}>Caricamento utenti...</p>
                                ) : availableUsers.length === 0 ? (
                                    <p className={styles.emptyNotification}>
                                        {t("admin_no_available_users")}
                                    </p>
                                ) : (
                                    <div className={styles.newAdminInputContainer}>
                                        <select
                                            id="newAdminAddress"
                                            value={newAdminAddress}
                                            onChange={(e) => setNewAdminAddress(e.target.value)}
                                            className={styles.dangerSelect}
                                        >
                                            <option value="">{t("admin_select_user_to_promote")}</option>
                                            {availableUsers.map(user => (
                                                <option key={user} value={user}>
                                                    {user}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            variant="danger"
                                            onClick={handleAddNewAdmin}
                                            disabled={!newAdminAddress}
                                        >
                                            {t("admin_initiate_add_admin")}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* blacklist  */}
                        <div className={styles.dangerZoneItem}>
                            <div className={styles.dangerZoneItemContent}>
                                <h3>{t("admin_blacklist_management")}</h3>
                                <p>{t("admin_blacklist_description")}</p>

                                <div className={styles.newAdminInputContainer}>
                                <div className={styles.blacklistForm}>
                                    <select
                                        id="newBlacklistAddress"
                                        value={newBlacklistAddress}
                                        onChange={(e) => setNewBlacklistAddress(e.target.value)}
                                        className={styles.dangerSelect}
                                    >
                                        <option value="">{t("admin_blacklist_select_user") }</option>
                                        {registeredUsers
                                            .filter(user =>
                                                !blacklistedAddresses.some(entry => entry.address.toLowerCase() === user.toLowerCase()) &&
                                                !adminUsers.some(admin => admin.address.toLowerCase() === user.toLowerCase()) &&
                                                user.toLowerCase() !== walletAddress.toLowerCase()
                                            )
                                            .map(user => (
                                                <option key={user} value={user}>
                                                    {user}
                                                </option>
                                            ))
                                        }
                                    </select>

                                    <Button
                                        variant="danger"
                                        onClick={handleAddToBlacklist}
                                        disabled={!newBlacklistAddress}
                                    >
                                        {t("admin_add_to_blacklist")}
                                    </Button>
                                </div>
                                </div>

                                {/* blacklist addresses */}
                                <div className={styles.dangerZoneItemList}>
                                    {blacklistedAddresses.length > 0 ? (
                                        blacklistedAddresses.map(entry => (
                                            <div key={entry.address} className={styles.dangerZoneListItem}>
                                                <div>
                                                    <span className={styles.addressText}>{entry.address}</span>
                                                    <span className={styles.reasonText}>{entry.reason}</span>
                                                    <span className={styles.dateText}>{entry.addedAt}</span>
                                                </div>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => removeFromBlacklist(entry.address)}
                                                >
                                                    {t("admin_remove_from_blacklist")}
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.emptyNotification}>{t("admin_no_blacklisted_addresses")}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard;