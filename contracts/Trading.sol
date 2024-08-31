// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./wormhole/IWormholeRelayer.sol";
import "./wormhole/IWormholeReceiver.sol";

contract Trading is IWormholeReceiver {
    struct Listing {
        uint256 price;
        address seller;
        address nftAddress;
        uint256 tokenId;
    }

    struct ListingHistory {
        address nftAddress;
        uint256 tokenId;
        address seller;
        uint256 price;
        address buyer;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        uint16 buyerChain,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    IWormholeRelayer private immutable _wormholeRelayer;
    mapping(address => mapping(uint256 => Listing)) private _listings;
    mapping(address => uint256) private balances; // Ensure this is declared
    Listing[] private activeListings;
    ListingHistory[] private _histories;

    constructor(address wormholeRelayer) {
        _wormholeRelayer = IWormholeRelayer(wormholeRelayer);
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) public {
        require(price > 0, "Price must be above zero");
        IERC721 nft = IERC721(nftAddress);
        require(
            nft.ownerOf(tokenId) == msg.sender,
            "Only the owner can list the item"
        );
        require(
            nft.getApproved(tokenId) == address(this),
            "Trading contract is not approved"
        );

        Listing memory listing = Listing(price, msg.sender, nftAddress, tokenId);
        _listings[nftAddress][tokenId] = listing;
        activeListings.push(listing);

        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        uint16 targetChain,
        address targetAddress,
        address nftAddress,
        uint256 tokenId,
        uint256 itemPrice,
        address itemSeller
    ) public payable {
        uint256 cost = getWormholeCost(targetChain);
        require(msg.value == cost + itemPrice, "Incorrect value");

        balances[itemSeller] += itemPrice;

        // Find the listing and remove it from active listings
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i].nftAddress == nftAddress && activeListings[i].tokenId == tokenId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }

        _wormholeRelayer.sendPayloadToEvm{value: cost}(
            targetChain,
            targetAddress,
            abi.encode(nftAddress, tokenId, msg.sender, itemPrice, itemSeller),
            0,
            200_000 // Custom gas limit
        );

        // Transfer the NFT to the buyer
        IERC721(nftAddress).safeTransferFrom(itemSeller, msg.sender, tokenId);

        // Add to history
        _histories.push(ListingHistory({
            nftAddress: nftAddress,
            tokenId: tokenId,
            seller: itemSeller,
            price: itemPrice,
            buyer: msg.sender
        }));

        emit ItemBought(msg.sender, targetChain, nftAddress, tokenId, itemPrice);
    }

    function getWormholeCost(uint16 targetChain) public view returns (uint256) {
        (uint256 cost, ) = _wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            0,
            200_000
        );
        return cost;
    }

    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory,
        bytes32,
        uint16,
        bytes32
    ) public payable override {
        require(
            msg.sender == address(_wormholeRelayer),
            "Only the relayer can call this"
        );

        (address nftAddress, uint256 tokenId, address buyer, uint256 price, address seller) = abi.decode(
            payload,
            (address, uint256, address, uint256, address)
        );

        Listing memory listing = _listings[nftAddress][tokenId];
        require(
            listing.price == price && listing.seller == seller,
            "Invalid listing"
        );

        // Find the listing and remove it from active listings
        for (uint256 i = 0; i < activeListings.length; i++) {
            if (activeListings[i].nftAddress == nftAddress && activeListings[i].tokenId == tokenId) {
                activeListings[i] = activeListings[activeListings.length - 1];
                activeListings.pop();
                break;
            }
        }

        delete _listings[nftAddress][tokenId];
        IERC721(nftAddress).safeTransferFrom(seller, buyer, tokenId);
    }

    function getAllActiveListings() public view returns (Listing[] memory) {
        return activeListings;
    }

    function withdrawBalance() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        balances[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Transfer failed");
    }
}
