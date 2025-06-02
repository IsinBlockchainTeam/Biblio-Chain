// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Book
 * @dev Abstract base contract for book NFTs in BiblioChain
 */
abstract contract Book is ERC721URIStorage {

    struct BookData {
        string ipfsMetadata;
        uint256 ratingSum;
        uint256 ratingCount;
    }

    mapping(uint256 => BookData) private _books;
    mapping(uint256 => mapping(address => bool)) private _hasRated;


    event BookRegistered(uint256 indexed tokenId, address indexed owner, string ipfsMetadata);
    event BookRated(uint256 indexed tokenId, address indexed rater, uint256 rating);

    constructor() ERC721("BiblioChain Book", "BOOK") {}


    function _registerBook(uint256 tokenId, address creator, string memory ipfsMetadata) internal {
        _mint(creator, tokenId);
        _setTokenURI(tokenId, ipfsMetadata);

        _books[tokenId] = BookData({
            ipfsMetadata: ipfsMetadata,
            ratingSum: 0,
            ratingCount: 0
        });

        emit BookRegistered(tokenId, creator, ipfsMetadata);
    }


    function getBookData(uint256 tokenId) public view returns (BookData memory) {
        return _books[tokenId];
    }


    function getBookRating(uint256 tokenId) public view returns (uint256 avgRating, uint256 count) {
        BookData memory bookData = _books[tokenId];

        if (bookData.ratingCount == 0) {
            return (0, 0);
        }

        return (bookData.ratingSum / bookData.ratingCount, bookData.ratingCount);
    }

    function hasRatedBook(uint256 tokenId, address user) public view returns (bool) {
        return _hasRated[tokenId][user];
    }


    function _addRating(uint256 tokenId, address user, uint256 rating) internal {
        require(rating <= 500, "Book: rating must be between 0-500 (0-5 with 2 decimals)");
        require(!_hasRated[tokenId][user], "Book: user has already rated this book");

        BookData storage bookData = _books[tokenId];
        bookData.ratingSum += rating;
        bookData.ratingCount++;
        _hasRated[tokenId][user] = true;

        emit BookRated(tokenId, user, rating);
    }
}