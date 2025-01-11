// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SepoliaNFTMarketplace is Ownable, ReentrancyGuard {
    struct NFTListing {
        uint256 price;
        address payable seller;
        bool isListed;
    }

    mapping(uint256 => NFTListing) public listings;
    ERC721URIStorage private nftContract;

    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event NFTListingCancelled(uint256 indexed tokenId);

    constructor(address nftContractAddress) {
        nftContract = ERC721URIStorage(nftContractAddress);
    }

    function listNFT(uint256 tokenId, uint256 price) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");

        nftContract.transferFrom(msg.sender, address(this), tokenId);
        listings[tokenId] = NFTListing(price, payable(msg.sender), true);

        emit NFTListed(tokenId, msg.sender, price);
    }

    function cancelListing(uint256 tokenId) external {
        NFTListing memory listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isListed, "NFT not listed");

        nftContract.transferFrom(address(this), msg.sender, tokenId);
        listings[tokenId].isListed = false;

        emit NFTListingCancelled(tokenId);
    }

    function buyNFT(uint256 tokenId) external payable nonReentrant {
        NFTListing memory listing = listings[tokenId];
        require(listing.isListed, "NFT not listed");
        require(msg.value >= listing.price, "Insufficient funds");

        listings[tokenId].isListed = false;
        listing.seller.transfer(listing.price);
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        emit NFTSold(tokenId, msg.sender, listing.price);
    }

    function withdrawFunds() external onlyOwner nonReentrant {
        payable(owner()).transfer(address(this).balance);
    }
}
