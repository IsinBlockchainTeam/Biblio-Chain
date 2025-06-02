// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Book.sol";
import "./User.sol";

/**
 * @title SellableBook
 * @dev Extension of Book contract that supports selling functionality
 */
contract SellableBook is Book, Ownable {

    UserTrustSystem public userSystem;

    struct SaleData {
        uint256 price;
        bool isForSale;
    }

    uint256 private _nextTokenId = 1;

    mapping(uint256 => SaleData) private _sales;
    mapping(uint256 => mapping(address => bool)) private _hasPurchased;

    event SellableBookCreated(uint256 indexed tokenId, uint256 price);
    event BookSold(uint256 indexed tokenId, address indexed previousOwner, address indexed newOwner, uint256 price);
    event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);
    event BookListedForSale(uint256 indexed tokenId, bool isForSale);

    constructor(address _userSystemAddress) Ownable(msg.sender) {
        userSystem = UserTrustSystem(_userSystemAddress);
    }

    modifier onlyAuthorized() {
        require(
            userSystem.isAuthorizedContract(msg.sender),
            "Not authorized"
        );
        _;
    }

    /**
     * @dev Creates a new sellable book
     * @param creator Address of the user creating the book
     * @param ipfsMetadata IPFS CID containing book metadata
     * @param price The sale price (in wei)
     * @return The token ID of the newly created book
     */
    function createSellableBook(
        address creator,
        string memory ipfsMetadata,
        uint256 price
    ) public onlyOwner returns (uint256) {
        require(price > 0, "SellableBook: price must be greater than zero");


        uint256 tokenId = _nextTokenId+2;
        _nextTokenId += 2;
        _registerBook(tokenId, creator, ipfsMetadata);

        _sales[tokenId] = SaleData({
            price: price,
            isForSale: true
        });

        emit SellableBookCreated(tokenId, price);
        return tokenId;
    }

    /**
     * @dev Buys a book that is for sale
     * @param tokenId The ID of the book to buy
     */
    function buyBook(address buyer,uint256 tokenId) public payable onlyAuthorized {
        SaleData storage sale = _sales[tokenId];
        require(sale.isForSale, "SellableBook: book not for sale");
        require(msg.value >= sale.price, "SellableBook: insufficient payment");

        address seller = ownerOf(tokenId);
        require(seller != buyer, "SellableBook: owner cannot buy their own book");

        uint256 soldPrice = sale.price;

        sale.isForSale = false;
        _hasPurchased[tokenId][buyer] = true;

        _transfer(seller, buyer, tokenId);
        payable(seller).transfer(soldPrice);
        if (msg.value > soldPrice) {
            payable(buyer).transfer(msg.value - soldPrice);
        }

        emit BookSold(tokenId, seller, buyer, soldPrice);
    }

    /**
     * @dev Allows a buyer to rate a book
     * @param rater Address of the user rating the book
     * @param tokenId The ID of the book to rate
     * @param rating The rating (0-500, representing 0-5 with 2 decimal points)
     */
    function rateBook(address rater, uint256 tokenId, uint256 rating) public onlyAuthorized {
        require(_hasPurchased[tokenId][rater], "SellableBook: only buyers can rate the book");
        _addRating(tokenId, rater, rating);
    }


    /**
     * @dev Gets all data related to a sellable book
     * @param tokenId The ID of the book
     * @return bookData The base book data
     * @return saleData The sale data
     */
    function getFullBookData(uint256 tokenId) public view returns (BookData memory bookData, SaleData memory saleData)  {
        bookData = getBookData(tokenId);
        saleData = _sales[tokenId];
        return (bookData, saleData);
    }
}