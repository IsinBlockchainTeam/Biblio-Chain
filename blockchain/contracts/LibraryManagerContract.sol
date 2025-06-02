// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./User.sol";
import "./OwnerGovernance.sol";
import "./BookFactory.sol";
import "./PausableController.sol";

/**
 * @title LibraryManagerContract
 * @dev Single point of entry for the library system. Initializes and manages all other contracts.
 * Now includes pausable functionality for emergency situations and enhanced governance.
 */
contract LibraryManagerContract {
    UserTrustSystem public userSystem;
    OwnerGovernance public governance;
    BookFactory public bookFactory;
    PausableController public pausableController;

    event UserRegistered(address indexed user);
    event BookCreated(uint256 indexed tokenId, BookFactory.BookType bookType);
    event BookBorrowed(uint256 indexed tokenId, address indexed borrower);
    event BookReturned(uint256 indexed tokenId, address indexed borrower);
    event BookReturnedByThirdParty(uint256 indexed tokenId, address indexed returner, address indexed borrower);
    event BookPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller);
    event BookRated(uint256 indexed tokenId, address indexed rater, uint256 rating);
    event ProposalRejected(uint256 indexed proposalId, address indexed rejecter);

    constructor() {
    }

    function initialize(
        address userSystemAddress,
        address governanceAddress,
        address bookFactoryAddress,
        address pausableControllerAddress
    ) public {
        userSystem = UserTrustSystem(userSystemAddress);
        governance = OwnerGovernance(governanceAddress);
        bookFactory = BookFactory(bookFactoryAddress);
        pausableController = PausableController(pausableControllerAddress);

        (address rentable, address sellable) = bookFactory.getBookContractAddresses();

        userSystem.registerUser(msg.sender);
        userSystem.addSystemOwner(msg.sender);

        userSystem.addAuthorizedContract(address(this));
        userSystem.addAuthorizedContract(address(governance));
        userSystem.addAuthorizedContract(address(rentable));
        userSystem.addAuthorizedContract(address(sellable));
        userSystem.addAuthorizedContract(address(pausableController));
    }

    // Modifiers
    modifier onlyRegistered() {
        require(userSystem.isRegistered(msg.sender), "LibraryManager: user not registered");
        _;
    }

    modifier notBanned() {
        require(!userSystem.isBanned(msg.sender), "LibraryManager: user is banned");
        _;
    }

    modifier bookExists(uint256 tokenId) {
        (bool exists, ) = bookFactory.getBookInfo(tokenId);
        require(exists, "LibraryManager: book does not exist");
        _;
    }

    modifier onlySystemOwner() {
        require(userSystem.isSystemOwner(msg.sender), "LibraryManager: not a system owner");
        _;
    }

    // New modifier for pause functionality
    modifier whenNotPaused(PausableController.OperationType operationType) {
        require(!pausableController.isOperationPaused(operationType), "LibraryManager: operation is paused");
        _;
    }

    /**
     * @dev Register a new user in the system
     */
    function registerUser() external {
        require(!userSystem.isRegistered(msg.sender), "LibraryManager: already registered");
        userSystem.registerUser(msg.sender);
        emit UserRegistered(msg.sender);
    }

    /**
     * @dev Create a new rentable book
     * @param ipfsMetadata IPFS CID containing book metadata
     * @param depositAmount The deposit amount required to borrow the book (in wei)
     * @param lendingPeriod The lending period in days
     * @return tokenId The token ID of the newly created book
     */
    function createRentableBook(
        string memory ipfsMetadata,
        uint256 depositAmount,
        uint256 lendingPeriod
    ) external onlyRegistered notBanned whenNotPaused(PausableController.OperationType.Rentable) returns (uint256) {
        userSystem.checkIfSpam(msg.sender);
        uint256 tokenId = bookFactory.createRentableBook(msg.sender, ipfsMetadata, depositAmount, lendingPeriod);
        emit BookCreated(tokenId, BookFactory.BookType.Rentable);
        return tokenId;
    }

    /**
     * @dev Create a new sellable book
     * @param ipfsMetadata IPFS CID containing book metadata
     * @param price The sale price (in wei)
     * @return tokenId The token ID of the newly created book
     */
    function createSellableBook(
        string memory ipfsMetadata,
        uint256 price
    ) external onlyRegistered notBanned whenNotPaused(PausableController.OperationType.Sellable) returns (uint256) {
        userSystem.checkIfSpam(msg.sender);
        uint256 tokenId = bookFactory.createSellableBook(msg.sender, ipfsMetadata, price);
        emit BookCreated(tokenId, BookFactory.BookType.Sellable);
        return tokenId;
    }

    /**
     * @dev Borrow a book
     * @param tokenId The token ID of the book to borrow
     */
    function borrowBook(uint256 tokenId) external payable onlyRegistered notBanned bookExists(tokenId) whenNotPaused(PausableController.OperationType.Borrowing) {
        userSystem.checkIfSpam(msg.sender);
        (address contractAddress, BookFactory.BookType bookType) = bookFactory.getBookContract(tokenId);

        require(bookType == BookFactory.BookType.Rentable, "LibraryManager: book is not rentable");

        RentableBook rentable = RentableBook(contractAddress);
        rentable.borrowBook{value: msg.value}(msg.sender, tokenId);

        emit BookBorrowed(tokenId, msg.sender);
    }

    /**
     * @dev Return a borrowed book (handles both normal and overdue returns)
     * @param tokenId The token ID of the book to return
     */
    function returnBook(uint256 tokenId) external onlyRegistered bookExists(tokenId) whenNotPaused(PausableController.OperationType.Returning) {
        userSystem.checkIfSpam(msg.sender);
        (address contractAddress, BookFactory.BookType bookType) = bookFactory.getBookContract(tokenId);

        require(bookType == BookFactory.BookType.Rentable, "LibraryManager: book is not rentable");

        RentableBook rentable = RentableBook(contractAddress);
        (Book.BookData memory baseData, RentableBook.RentalData memory rentalData) = rentable.getFullBookData(tokenId);

        if (rentalData.borrower == msg.sender) {
            rentable.returnBook(msg.sender, tokenId);
            emit BookReturned(tokenId, msg.sender);
        } else {
            uint256 dueDate = rentalData.startDate + (rentalData.lendingPeriod * 1 days);
            require(block.timestamp > dueDate, "LibraryManager: only borrower can return this book");

            address borrower = rentalData.borrower;

            rentable.returnOverdueBook(msg.sender, tokenId);
            emit BookReturnedByThirdParty(tokenId, msg.sender, borrower);
        }
    }

    /**
     * @dev Buy a book
     * @param tokenId The token ID of the book to buy
     */
    function buyBook(uint256 tokenId) external payable onlyRegistered notBanned bookExists(tokenId) whenNotPaused(PausableController.OperationType.Purchasing) {
        userSystem.checkIfSpam(msg.sender);
        (address contractAddress, BookFactory.BookType bookType) = bookFactory.getBookContract(tokenId);

        address seller = IERC721(contractAddress).ownerOf(tokenId);
        require(bookType == BookFactory.BookType.Sellable, "LibraryManager: book is not for sale");

        SellableBook sellable = SellableBook(contractAddress);
        sellable.buyBook{value: msg.value}(msg.sender, tokenId);

        emit BookPurchased(tokenId, msg.sender, seller);
    }

    /**
     * @dev Rate a rentable book (can only be called by someone who has borrowed it)
     * @param tokenId The token ID of the book to rate
     * @param rating The rating value (0-500, representing 0-5 with 2 decimal places)
     */
    function rateRentableBook(uint256 tokenId, uint256 rating) external onlyRegistered notBanned bookExists(tokenId) {
        userSystem.checkIfSpam(msg.sender);
        (address contractAddress, BookFactory.BookType bookType) = bookFactory.getBookContract(tokenId);

        require(bookType == BookFactory.BookType.Rentable, "LibraryManager: book is not rentable");

        RentableBook rentable = RentableBook(contractAddress);
        rentable.rateBook(msg.sender, tokenId, rating);

        emit BookRated(tokenId, msg.sender, rating);
    }

    /**
     * @dev Rate a sellable book (can only be called by someone who has purchased it)
     * @param tokenId The token ID of the book to rate
     * @param rating The rating value (0-500, representing 0-5 with 2 decimal places)
     */
    function rateSellableBook(uint256 tokenId, uint256 rating) external onlyRegistered notBanned bookExists(tokenId) {
        userSystem.checkIfSpam(msg.sender);
        (address contractAddress, BookFactory.BookType bookType) = bookFactory.getBookContract(tokenId);

        require(bookType == BookFactory.BookType.Sellable, "LibraryManager: book is not sellable");

        SellableBook sellable = SellableBook(contractAddress);
        sellable.rateBook(msg.sender, tokenId, rating);

        emit BookRated(tokenId, msg.sender, rating);
    }

    /**
     * @dev Get the rating of a book
     * @param tokenId The token ID of the book
     * @return avgRating The average rating (0-500, representing 0-5 with 2 decimal places)
     * @return count The number of ratings
     */
    function getBookRating(uint256 tokenId) external view bookExists(tokenId) returns (uint256 avgRating, uint256 count) {
        (address contractAddress, ) = bookFactory.getBookContract(tokenId);

        Book bookContract = Book(contractAddress);

        return bookContract.getBookRating(tokenId);
    }

    /**
     * @dev Check if a user has already rated a book
     * @param tokenId The token ID of the book
     * @param user The address of the user
     * @return Whether the user has rated the book
     */
    function hasUserRatedBook(uint256 tokenId, address user) external view bookExists(tokenId) returns (bool) {
        (address contractAddress, ) = bookFactory.getBookContract(tokenId);
        Book bookContract = Book(contractAddress);
        return bookContract.hasRatedBook(tokenId, user);
    }

    // Funzioni di controllo per il PausableController

    /**
     * @dev Pause a specific operation type
     * @param operationType The type of operation to pause
     */
    function pauseOperation(PausableController.OperationType operationType) external onlySystemOwner {
        pausableController.pauseOperation(operationType);
    }

    /**
     * @dev Unpause a specific operation type
     * @param operationType The type of operation to unpause
     */
    function unpauseOperation(PausableController.OperationType operationType) external onlySystemOwner {
        pausableController.unpauseOperation(operationType);
    }

    /**
     * @dev Pause all operations
     */
    function pauseAll() external onlySystemOwner {
        pausableController.pauseAll();
    }

    /**
     * @dev Unpause all operations
     */
    function unpauseAll() external onlySystemOwner {
        pausableController.unpauseAll();
    }

    /**
     * @dev Check if an operation is paused
     * @param operationType The type of operation to check
     * @return True if the operation is paused
     */
    function isOperationPaused(PausableController.OperationType operationType) external view returns (bool) {
        return pausableController.isOperationPaused(operationType);
    }

    /**
     * @dev Check if all operations are paused
     * @return True if all operations are paused
     */
    function areAllPaused() external view returns (bool) {
        return pausableController.areAllPaused();
    }

    /**
     * @dev Get book details
     * @param tokenId The token ID of the book
     * @return contractAddress The contract address
     * @return bookType The book type (rentable/sellable)
     * @return bookData The book data
     */
    function getBookDetails(uint256 tokenId) external view bookExists(tokenId) returns (
        address contractAddress,
        BookFactory.BookType bookType,
        bytes memory bookData
    ) {
        (contractAddress, bookType) = bookFactory.getBookContract(tokenId);

        if (bookType == BookFactory.BookType.Rentable) {
            RentableBook rentable = RentableBook(contractAddress);
            (Book.BookData memory baseData, RentableBook.RentalData memory rentalData) =
                                rentable.getFullBookData(tokenId);

            bookData = abi.encode(baseData, rentalData);
        } else {
            SellableBook sellable = SellableBook(contractAddress);
            (Book.BookData memory baseData, SellableBook.SaleData memory saleData) =
                                sellable.getFullBookData(tokenId);

            bookData = abi.encode(baseData, saleData);
        }

        return (contractAddress, bookType, bookData);
    }

    /**
     * @dev Get all book IDs
     * @return Array of all book token IDs
     */
    function getAllBookIds() external view returns (uint256[] memory) {
        return bookFactory.getAllBookIds();
    }

    /**
     * @dev Get a paginated list of book IDs
     * @param offset The starting index
     * @param limit The maximum number of books to return
     * @return Array of book token IDs
     */
    function getBookIdsPaginated(uint256 offset, uint256 limit) external view returns (uint256[] memory) {
        return bookFactory.getBookIdsPaginated(offset, limit);
    }

    /**
     * @dev Set the reward percentage for returning overdue books
     * @param percentage The new percentage (0-100)
     */
    function setReturnerRewardPercentage(uint256 percentage) external onlySystemOwner {
        (address rentableAddress, ) = bookFactory.getBookContractAddresses();
        RentableBook rentable = RentableBook(rentableAddress);
        rentable.setReturnerRewardPercentage(percentage);
    }

    /**
     * @dev Governance: propose adding a new system owner
     * @param newOwner Address to add as system owner
     */
    function proposeAddOwner(address newOwner) external onlySystemOwner returns (uint256) {
        return governance.proposeAddOwner(msg.sender, newOwner);
    }

    /**
     * @dev Governance: propose removing a system owner
     * @param owner Address to remove as system owner
     */
    function proposeRemoveOwner(address owner) external onlySystemOwner returns (uint256) {
        return governance.proposeRemoveOwner(msg.sender, owner);
    }

    /**
     * @dev Governance: approve a proposal
     * @param proposalId ID of the proposal
     */
    function approveProposal(uint256 proposalId) external onlySystemOwner {
        governance.approveProposal(msg.sender, proposalId);
    }

    function hasVoted(uint proposalId) external view onlySystemOwner returns(bool){
        return governance.hasVoted(proposalId, msg.sender);
    }


    function getProposalInfo(uint256 proposalId) onlySystemOwner external view returns (
        uint256 id,
        uint proposalType,
        address target,
        address proposer,
        uint256 approvalCount,
        uint256 rejectionCount
    ) {
        return governance.getProposalInfo(proposalId);
    }

    /**
     * @dev Governance: reject a proposal
     * @param proposalId ID of the proposal
     */
    function rejectProposal(uint256 proposalId) external onlySystemOwner {
        governance.rejectProposal(msg.sender, proposalId);
    }

    /**
     * @dev Governance: check if can execute a proposal if it meets criteria
     * @param proposalId ID of the proposal
     */
    function canExecuteProposal(uint256 proposalId) external view onlySystemOwner returns(bool){
        return governance.canExecute(proposalId);
    }

    /**
     * @dev Get all pending governance proposals
     * @return Array of pending proposal IDs
     */
    function getPendingProposals() external view onlySystemOwner returns (uint256[] memory) {
        return governance.getPendingProposals();
    }


    /**
     * @dev Admin: unban a user
     * @param user Address of the user to unban
     */
    function unbanUser(address user) external onlySystemOwner {
        userSystem.unbanUser(user);
    }

    /**
     * @dev Admin: ban a user
     * @param user Address of the user to ban
     */
    function banUser(address user) external onlySystemOwner {
        userSystem.banUser(user);
    }

    /**
     * @dev Get user information
     * @param user Address to check
     * @return isRegistered If the user is registered
     * @return isBanned If the user is banned
     * @return trustLevel The trust level of the user (0-5)
     * @return isSystemOwner If the user is a system owner
     */
    function getUserInfo(address user) external view returns (
        bool isRegistered,
        bool isBanned,
        uint8 trustLevel,
        bool isSystemOwner
    ) {
        isRegistered = userSystem.isRegistered(user);
        if (isRegistered) {
            isBanned = userSystem.isBanned(user);
            trustLevel = userSystem.getTrustLevel(user);
            isSystemOwner = userSystem.isSystemOwner(user);
        }

        return (isRegistered, isBanned, trustLevel, isSystemOwner);
    }

    /**
     * @dev Get total number of books in the system
     * @return Total number of books
     */
    function getTotalBooks() public view returns(uint) {
        return bookFactory.totalBooks();
    }
    /**
 * @dev Get all registered users
     * @return Array of all registered user addresses
     */
    function getAllUsers() external view onlySystemOwner returns (address[] memory) {
        return userSystem.getAllUsers();
    }

/**
 * @dev Get total number of registered users
     * @return Total number of users
     */
    function getTotalUsers() external view returns (uint256) {
        return userSystem.totalUsers();
    }
}
