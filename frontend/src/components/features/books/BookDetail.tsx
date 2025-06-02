import React, {useState, useRef } from 'react';
import styles from './styles/BookDetail.module.css';
import Button from '../../common/Button.tsx';
import {Book, OperationType, RentableBook} from '../../../types/interfaces.ts';
import RatingStars from "../../common/RatingStars.tsx";
import { useLibrary } from '../../../contexts/LibraryContext.tsx';
import { useTranslation } from "react-i18next";
import FlipCardAnimation from './FlipCardAnimation.tsx';
import BorrowTransactionContent from '../transaction/BorrowTransactionContent.tsx';
import BuyTransactionContent from '../transaction/BuyTransactionContent.tsx';
import ReturnTransactionContent from '../transaction/ReturnTransactionContent.tsx';
import RatingTransactionContent from "../transaction/RatingTransactionContent.tsx";
import ServiceUnavailableModal from "../../common/ServiceUnavailbleModal.tsx";
import { useServiceStatus, useAllServicesStatus } from '../../../hooks/utils/useServiceStatus.ts';
import {useAuth} from "../../../contexts/AuthContext.tsx";


interface CoverPosition {
    top: number;
    left: number;
    width: number;
    height: number;
}

type TransactionType = 'borrow' | 'buy' | 'return' | 'rate';

const BookDetail = () => {
    const { t } = useTranslation();
    const {
        borrowBook,
        buyBook,
        returnBook,
        selectedBook,
        selectBook,
        isBookOwner,
        isBookBorrower,
        hasUserRatedBook
    } = useLibrary();
    const { isConnected } = useAuth();
    const [showTransaction, setShowTransaction] = useState(false);
    const [transactionType, setTransactionType] = useState<TransactionType>('borrow');
    const [coverPosition, setCoverPosition] = useState<CoverPosition | null>(null);
    const [showServiceUnavailable, setShowServiceUnavailable] = useState(false);
    const [currentOperationType, setCurrentOperationType] = useState<OperationType>(OperationType.Borrowing);

    const { isAllPaused } = useAllServicesStatus();
    const { isPaused: isBorrowingPaused } = useServiceStatus(OperationType.Borrowing);
    const { isPaused: isReturnPaused } = useServiceStatus(OperationType.Returning);
    const { isPaused: isPurchasePaused } = useServiceStatus(OperationType.Purchasing);

    const coverRef = useRef<HTMLDivElement | null>(null);


    const getCoverPosition = () => {
        if (coverRef.current) {
            const rect = coverRef.current.getBoundingClientRect();
            setCoverPosition({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        }
    };

    const handleBorrow = () => {
        getCoverPosition();
        setTransactionType('borrow');
        setShowTransaction(true);
    };

    const handleBuy = () => {
        getCoverPosition();
        setTransactionType('buy');
        setShowTransaction(true);
    };

    const handleReturn = () => {
        getCoverPosition();
        setTransactionType('return');
        setShowTransaction(true);
    };

    const handleRateBook = () => {
        getCoverPosition();
        setTransactionType('rate');
        setShowTransaction(true);
    };

    const handleServiceUnavailable = (operationType: OperationType) => {
        setCurrentOperationType(operationType);
        setShowServiceUnavailable(true);
    };

    const handleConfirmTransaction = async () => {
        if (!selectedBook) return;

        try {
            switch (transactionType) {
                case 'borrow':
                    await borrowBook(selectedBook.id);
                    break;
                case 'buy':
                    await buyBook(selectedBook.id);
                    break;
                case 'return':
                    await returnBook(selectedBook.id);
                    break;
            }
            closeTransaction();

        } catch (error) {
            console.error("transaction error:", error);
        }
    };

    const closeTransaction = () => {
        setShowTransaction(false);
        setCoverPosition(null);
    };

    const closeServiceUnavailable = () => {
        setShowServiceUnavailable(false);
    };

    const getBookActions = () => {
        if (!selectedBook) return [];

        // If user is not connected, don't show any actions
        if (!isConnected) return [];

        const actions = [];
        const isOwner = isBookOwner(selectedBook);
        const isBorrower = isBookBorrower(selectedBook);
        const hasRated = hasUserRatedBook(selectedBook);

        const createActionWithAvailabilityCheck = (
            label: string,
            action: () => void,
            isPaused: boolean,
            operationType: OperationType
        ) => {
            if (isPaused || isAllPaused) {
                return {
                    label: t("service_unavailable"),
                    action: () => handleServiceUnavailable(operationType),
                    disabled: false,
                    isServicePaused: true
                };
            }

            return {
                label,
                action,
                disabled: false,
                isHighlighted: true
            };
        };

        // For rating - show if user owns a sold book and hasn't rated it yet
        const isSellable = 'price' in selectedBook;

        if (isSellable && isOwner && selectedBook.status === 'Sold' && !hasRated) {
            actions.push({
                label: t("transaction_rating_title"),
                action: handleRateBook,
                disabled: false,
                isHighlighted: true
            });
            return actions;
        }

        // For borrowers - show return button
        const isRentable = 'depositAmount' in selectedBook;
        if (isRentable && isBorrower && selectedBook.status === 'Lent') {
            actions.push(createActionWithAvailabilityCheck(
                t("bookDetail_returnBook"),
                handleReturn,
                isReturnPaused,
                OperationType.Returning
            ));
            return actions;
        }

        // For available sellable books - show buy button
        if (isSellable && !isOwner && selectedBook.status === 'Available') {
            actions.push(createActionWithAvailabilityCheck(
                `${t("bookDetail_buyFor")} ${selectedBook.price} ETH`,
                handleBuy,
                isPurchasePaused,
                OperationType.Purchasing
            ));
        }

        // For available rentable books - show borrow button
        if (isRentable && !isOwner && selectedBook.status === 'ForRent') {
            actions.push(createActionWithAvailabilityCheck(
                `${t("bookDetail_borrowFor")} ${selectedBook.depositAmount} ETH`,
                handleBorrow,
                isBorrowingPaused,
                OperationType.Borrowing
            ));
        }

        // For lent books that user doesn't own - show not available
        if (selectedBook.status === 'Lent' && !isOwner && (!isRentable || !isBorrower)) {
            actions.push({
                label: t("bookDetail_notAvailable"),
                action: () => {},
                disabled: true,
                isHighlighted: false
            });
        }

        return actions;
    };

    if (!selectedBook) return null;
    const isRentable = (book: Book): book is RentableBook => {
        return 'depositAmount' in book;
    };

    const formatDueDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getFormattedStatus = () => {
        if (!selectedBook.status) {
            return 'Unknown';
        }
        switch (selectedBook.status) {
            case 'Available':
                return <span className={styles.availableStatus}>{t("bookDetail_available")}</span>;
            case 'ForRent':
                return <span className={styles.rentableStatus}>{t("bookDetail_forRent")}</span>;
            case 'Lent':
                return <span className={styles.lentStatus}>{t("bookDetail_lent")}</span>;
            case 'Sold':
                return <span className={styles.soldStatus}>{t("bookDetail_sold")}</span>;
            default:
                return selectedBook.status;
        }
    };

    const handleClose = () => {
        selectBook(null);
    };

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const getTransactionTitle = (): string => {
        switch (transactionType) {
            case 'borrow':
                return t('transaction_borrow_title');
            case 'buy':
                return t('transaction_buy_title');
            case 'return':
                return t('transaction_return_title');
            case 'rate':
                return t('transaction_rating_title');
            default:
                return '';
        }
    };

    function getDueDate(borrowDate: string, lendingPeriod: number): string {
        const date = new Date(borrowDate);
        date.setDate(date.getDate() + lendingPeriod);
        return date.toString();
    }


    const bookActions = getBookActions();

    const renderTransactionContent = () => {
        switch (transactionType) {
            case 'borrow':
                return (
                    <BorrowTransactionContent
                        book={selectedBook}
                        onClose={closeTransaction}
                        onConfirm={handleConfirmTransaction}
                    />
                );
            case 'buy':
                return (
                    <BuyTransactionContent
                        book={selectedBook}
                        onClose={closeTransaction}
                        onConfirm={handleConfirmTransaction}
                    />
                );
            case 'return':
                return (
                    <ReturnTransactionContent
                        book={selectedBook}
                        onClose={closeTransaction}
                        onConfirm={handleConfirmTransaction}
                    />
                );
            case 'rate':
                return (
                    <RatingTransactionContent
                        book={selectedBook}
                        onClose={() => {
                            closeTransaction();
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className={styles.overlay} onClick={handleClose}>
                <div className={styles.bookDetailContainer} onClick={handleCardClick}>
                    <div className={styles.bookDetailCard}>
                        <div
                            className={styles.coverColumn}
                            style={{ backgroundColor: selectedBook.coverColor }}
                        >
                            <button onClick={handleClose} className={styles.backButton}>
                                {t("bookDetail_back")}
                            </button>
                        </div>

                        <div className={styles.coverWrapper} ref={coverRef}>
                            {selectedBook.coverImage ? (
                                <img
                                    src={selectedBook.coverImage}
                                    alt={selectedBook.title}
                                    className={styles.coverImage}
                                />
                            ) : (
                                <div
                                    className={styles.coverPlaceholder}
                                    style={{ backgroundColor: selectedBook.coverColor }}
                                >
                                    <span className={styles.titleOnCover}>{selectedBook.title}</span>
                                    <span className={styles.authorOnCover}>{selectedBook.author}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.infoColumn}>
                            <div className={styles.indicator}></div>

                            <div className={styles.bookInfo}>
                                {selectedBook.publishedYear && (
                                    <div className={styles.year}>{selectedBook.publishedYear}</div>
                                )}

                                <h1 className={styles.title}>{selectedBook.title}</h1>
                                <h2 className={styles.author}>{selectedBook.author}</h2>

                                {selectedBook.rating !== undefined && (
                                    <RatingStars rating={selectedBook.rating} size="large" />
                                )}

                                <p className={styles.description}>
                                    {selectedBook.description ||
                                        t("bookDetail_descFallback")}
                                </p>

                                {selectedBook.owner && (
                                    <div className={styles.ownerInfo}>
                                        <div className={styles.ownerLabel}>{t("bookDetail_owner")}</div>
                                        <div className={styles.ownerAddress}>{selectedBook.owner}</div>
                                    </div>
                                )}

                                <div className={styles.statusInfo}>
                                    <div className={styles.infoLine}>
                                        <span className={styles.infoLabel}>{t("bookDetail_status")}</span>
                                        <span className={styles.infoValue}>{getFormattedStatus()}</span>
                                    </div>

                                    {selectedBook.status === 'Lent' && isRentable(selectedBook) && (
                                        <div className={styles.infoLine}>
                                            <span className={styles.infoLabel}>{t("bookDetail_availableFrom")}</span>
                                            <span className={styles.infoValue}>{formatDueDate(getDueDate(selectedBook.borrowDate!, selectedBook.lendingPeriod))}</span>
                                        </div>
                                    )}

                                    {isRentable(selectedBook) && selectedBook.status === 'ForRent' && (
                                        <div className={styles.infoLine}>
                                            <span className={styles.infoLabel}>{t("bookDetail_requiredDeposit")}</span>
                                            <span className={styles.infoValue}>{selectedBook.depositAmount} ETH</span>
                                        </div>
                                    )}

                                    {'price' in selectedBook && selectedBook.status === 'Available' && (
                                        <div className={styles.infoLine}>
                                            <span className={styles.infoLabel}>{t("bookDetail_price")}</span>
                                            <span className={styles.infoValue}>{selectedBook.price} ETH</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.actionSection}>
                                    <div className={styles.actionButtons}>
                                        {bookActions.map((action, index) => (
                                            <div key={index} onClick={action.disabled ? (e) => e.stopPropagation() : undefined}>
                                                <Button
                                                    variant={action.isServicePaused ? "danger" : "fill"}
                                                    onClick={action.disabled ? () => {} : action.action}
                                                    className={`${styles.actionButton} ${action.disabled ? styles.disabledButton : ''} ${action.isServicePaused ? styles.servicePausedButton : ''}`}
                                                    disabled={action.disabled}
                                                >
                                                    {action.label}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showTransaction && selectedBook && (
                <FlipCardAnimation
                    book={selectedBook}
                    onClose={closeTransaction}
                    coverPosition={coverPosition}
                    title={getTransactionTitle()}
                >
                    {renderTransactionContent()}
                </FlipCardAnimation>
            )}

            {showServiceUnavailable && selectedBook && (
                <ServiceUnavailableModal
                    operationType={currentOperationType}
                    onClose={closeServiceUnavailable}
                    bookTitle={selectedBook.title}
                />
            )}
        </>
    );
};

export default BookDetail;