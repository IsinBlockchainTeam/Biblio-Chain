// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RentableBook.sol";
import "./SellableBook.sol";
import "./User.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BookFactory
 * @dev Factory contract for creating and tracking books
 */
contract BookFactory is Ownable {

    enum BookType { Rentable, Sellable }

    RentableBook public rentableBookContract;
    SellableBook public sellableBookContract;
    UserTrustSystem public userSystem;

    struct BookInfo {
        BookType bookType;
        bool exists;
    }

    mapping(uint256 => BookInfo) private _bookRegistry;
    uint256[] private _allBookIds;

    event BookCreated(uint256 indexed tokenId, BookType bookType, address indexed owner);
    event FactoryInitialized(address rentableContract, address sellableContract, address userSystemContract);

    constructor(address _userSystemAddress) Ownable(msg.sender) {
        userSystem = UserTrustSystem(_userSystemAddress);
        rentableBookContract = new RentableBook(_userSystemAddress);
        sellableBookContract = new SellableBook(_userSystemAddress);

        emit FactoryInitialized(address(rentableBookContract), address(sellableBookContract), _userSystemAddress);
    }

    /**
     * @dev Get the addresses of the rentable and sellable book contracts
     * @return rentable Address of the rentable book contract
     * @return sellable Address of the sellable book contract
     */
    function getBookContractAddresses() public onlyOwner view returns (address rentable, address sellable) {
        return (address(rentableBookContract), address(sellableBookContract));
    }

    /**
     * @dev Creates a new rentable book
     * @param creator Address of the user creating the book
     * @param ipfsMetadata IPFS CID containing book metadata
     * @param depositAmount The deposit amount required to borrow the book (in wei)
     * @param lendingPeriod The lending period in days
     * @return tokenId The token ID of the newly created book
     */
    function createRentableBook(
        address creator,
        string memory ipfsMetadata,
        uint256 depositAmount,
        uint256 lendingPeriod
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = rentableBookContract.createRentableBook(
            creator,
            ipfsMetadata,
            depositAmount,
            lendingPeriod
        );

        _bookRegistry[tokenId] = BookInfo({
            bookType: BookType.Rentable,
            exists: true
        });

        _allBookIds.push(tokenId);

        emit BookCreated(tokenId, BookType.Rentable, creator);

        return tokenId;
    }

    /**
     * @dev Creates a new sellable book
     * @param creator Address of the user creating the book
     * @param ipfsMetadata IPFS CID containing book metadata
     * @param price The sale price (in wei)
     * @return tokenId The token ID of the newly created book
     */
    function createSellableBook(
        address creator,
        string memory ipfsMetadata,
        uint256 price
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = sellableBookContract.createSellableBook(
            creator,
            ipfsMetadata,
            price
        );

        _bookRegistry[tokenId] = BookInfo({
            bookType: BookType.Sellable,
            exists: true
        });

        _allBookIds.push(tokenId);

        emit BookCreated(tokenId, BookType.Sellable, creator);

        return tokenId;
    }

    /**
     * @dev Check if a book exists by token ID
     * @param tokenId The token ID to check
     * @return exists Whether the book exists
     * @return bookType The type of book if it exists
     */
    function getBookInfo(uint256 tokenId) external onlyOwner view returns (
        bool exists,
        BookType bookType
    ) {
        BookInfo memory info = _bookRegistry[tokenId];
        return (info.exists, info.bookType);
    }

    /**
     * @dev Get a book's contract address and book type
     * @param tokenId The token ID of the book
     * @return contractAddress The address of the contract managing this book
     * @return bookType The type of book
     */
    function getBookContract(uint256 tokenId) external onlyOwner view returns (
        address contractAddress,
        BookType bookType
    ) {
        bookType = _bookRegistry[tokenId].bookType;

        if (bookType == BookType.Rentable) {
            return (address(rentableBookContract), bookType);
        } else {
            return (address(sellableBookContract), bookType);
        }
    }

    /**
     * @dev Get all book IDs
     * @return Array of all book token IDs
     */
    function getAllBookIds() external onlyOwner view returns (uint256[] memory) {
        return _allBookIds;
    }

    /**
     * @dev Get a paginated list of book IDs
     * @param offset The starting index
     * @param limit The maximum number of books to return
     * @return Array of book token IDs
     */
    function getBookIdsPaginated(uint256 offset, uint256 limit) external onlyOwner view returns (uint256[] memory) {
        if (offset >= _allBookIds.length) {
            return new uint256[](0);
        }

        uint256 endIndex = offset + limit;
        if (endIndex > _allBookIds.length) {
            endIndex = _allBookIds.length;
        }

        uint256 resultCount = endIndex - offset;
        uint256[] memory result = new uint256[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = _allBookIds[offset + i];
        }

        return result;
    }

    /**
     * @dev Get total number of books
     * @return Total number of books registered
     */
    function totalBooks() onlyOwner external view returns (uint256) {
        return _allBookIds.length;
    }
}