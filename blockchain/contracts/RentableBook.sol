// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Book.sol";
import "./User.sol";

/**
 * @title RentableBook
 * @dev Extension of Book contract that supports borrowing functionality with escrow for deposits
 */
contract RentableBook is Book, Ownable {

    struct RentalData {
        address borrower;
        uint256 startDate;
        uint256 depositAmount;
        uint256 lendingPeriod;
    }

    UserTrustSystem public userSystem;

    mapping(uint256 => RentalData) private _rentals;
    mapping(uint256 => mapping(address => bool)) private _hasBorrowed;
    mapping(uint256 => uint256) private _deposits;


    uint256 private _nextTokenId = 0;
    uint256 public returnerRewardPercentage = 20;

    constructor(address _userSystemAddress) Ownable(msg.sender) {
        userSystem = UserTrustSystem(_userSystemAddress);
    }

    event RentableBookCreated(uint256 indexed tokenId, uint256 depositAmount, uint256 lendingPeriod);
    event BookBorrowed(uint256 indexed tokenId, address indexed borrower, uint256 endDate);
    event BookReturned(uint256 indexed tokenId, address indexed borrower);
    event BookReturnedByThirdParty(uint256 indexed tokenId, address indexed returner, address indexed borrower, uint256 rewardAmount);
    event DepositClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);


    modifier onlyAuthorized() {
        require(
            userSystem.isAuthorizedContract(msg.sender),
            "Not authorized"
        );
        _;
    }
    /**
     * @dev Creates a new rentable book
     * @param creator Address of the user creating the book
     * @param ipfsMetadata IPFS CID containing book metadata
     * @param depositAmount The deposit amount required to borrow the book (in wei)
     * @param lendingPeriod The lending period in days
     * @return The token ID of the newly created book
     */
    function createRentableBook(
        address creator,
        string memory ipfsMetadata,
        uint256 depositAmount,
        uint256 lendingPeriod
    ) public onlyOwner returns (uint256) {
        require(lendingPeriod > 0 && lendingPeriod <= 365, "RentableBook: invalid lending period");

        uint256 tokenId = _nextTokenId+2;
        _nextTokenId += 2;
        _registerBook(tokenId, creator, ipfsMetadata);

        _rentals[tokenId] = RentalData({
            borrower: address(0),
            startDate: 0,
            depositAmount: depositAmount,
            lendingPeriod: lendingPeriod
        });

        emit RentableBookCreated(tokenId, depositAmount, lendingPeriod);
        return tokenId;
    }

    /**
     * @dev Borrows a book. The borrower must send the deposit amount.
     * @param tokenId The ID of the book to borrow
     */
    function borrowBook(address borrower, uint256 tokenId) public payable onlyAuthorized {
        require(_rentals[tokenId].borrower == address(0), "RentableBook: book is already borrowed");
        require(ownerOf(tokenId) != borrower, "RentableBook: owner cannot borrow their own book");

        RentalData storage rental = _rentals[tokenId];

        require(msg.value >= rental.depositAmount, "RentableBook: insufficient deposit");

        uint256 endDate = block.timestamp + (rental.lendingPeriod * 1 days);

        _deposits[tokenId] = rental.depositAmount;
        rental.borrower = borrower;
        rental.startDate = block.timestamp;

        _hasBorrowed[tokenId][borrower] = true;

        if (msg.value > rental.depositAmount) {
            payable(borrower).transfer(msg.value - rental.depositAmount);
        }

        emit BookBorrowed(tokenId, borrower, endDate);
    }

    /**
     * @dev Returns a borrowed book. Only the borrower can return it.
     * @param tokenId The ID of the book to return
     */
    function returnBook(address borrower, uint256 tokenId) onlyAuthorized public {
        RentalData storage rental = _rentals[tokenId];

        uint256 depositAmount = _deposits[tokenId];

        bool isOverdue = false;

        uint256 dueDate = rental.startDate + (rental.lendingPeriod * 1 days);
        isOverdue = block.timestamp > dueDate;

        rental.borrower = address(0);
        rental.startDate = 0;

        _deposits[tokenId] = 0;

        if (isOverdue && address(userSystem) != address(0) && !userSystem.isSystemOwner(borrower) ) {
            userSystem.decreaseTrustLevel(borrower, UserTrustSystem.InfractionSeverity.Low);
        }

        if (depositAmount > 0) {
            payable(borrower).transfer(depositAmount);
        }

        emit BookReturned(tokenId, borrower);
    }

    /**
     * @dev Return an overdue book on behalf of someone else
     * @param tokenId The ID of the book to return
     */
    function returnOverdueBook(address person, uint256 tokenId) public onlyAuthorized {
        RentalData storage rental = _rentals[tokenId];
        require(rental.borrower != address(0), "RentableBook: book is not borrowed");

        uint256 dueDate = rental.startDate + (rental.lendingPeriod * 1 days);

        address borrower = rental.borrower;
        uint256 depositAmount = _deposits[tokenId];

        rental.borrower = address(0);
        rental.startDate = 0;
        _deposits[tokenId] = 0;

        if (!userSystem.isSystemOwner(borrower)) {
            userSystem.decreaseTrustLevel(borrower, UserTrustSystem.InfractionSeverity.Low);
        }

        if (depositAmount > 0) {
            uint256 rewardAmount = (depositAmount * returnerRewardPercentage) / 100;
            uint256 ownerAmount = depositAmount - rewardAmount;

            payable(person).transfer(rewardAmount);
            payable(ownerOf(tokenId)).transfer(ownerAmount);

            emit BookReturnedByThirdParty(tokenId, person, borrower, rewardAmount);
        }
    }

    /**
     * @dev Allows a borrower or past borrower to rate a book
     * @param rater Address of the user rating the book
     * @param tokenId The ID of the book to rate
     * @param rating The rating (0-500, representing 0-5 with 2 decimal points)
     */
    function rateBook(address rater, uint256 tokenId, uint256 rating) public onlyAuthorized {
        require(_hasBorrowed[tokenId][rater], "RentableBook: only borrowers can rate the book");
        _addRating(tokenId, rater, rating);
    }

    /**
     * @dev Sets the reward percentage for returning overdue books
     * @param percentage The new percentage (0-100)
     */
    function setReturnerRewardPercentage(uint256 percentage) onlyAuthorized public {
        require(percentage <= 100, "RentableBook: percentage must be between 0 and 100");
        returnerRewardPercentage = percentage;
    }

    /**
     * @dev Gets all data related to a rentable book
     * @param tokenId The ID of the book
     * @return bookData The base book data
     * @return rentalData The rental data
     */
    function getFullBookData(uint256 tokenId) public view returns (BookData memory bookData, RentalData memory rentalData) {
        bookData = getBookData(tokenId);
        rentalData = _rentals[tokenId];
        return (bookData, rentalData);
    }
}