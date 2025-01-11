// SPDX-License-Identifier: MIT [FOLDER ON IPFS]
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ArbitrumNFTMinter is ERC721Enumerable, Ownable {
    using Strings for uint256;

    // Variables
    uint256 public mintPrice = 0.01 ether;
    uint256 public maxSupply = 10000;
    string private baseTokenURI;
    uint256 public nextTokenId = 0;

    // Events
    event Mint(address indexed minter, uint256 tokenId);

    constructor(string memory baseURI) ERC721("ArbitrumNFT", "ARBFT") Ownable(msg.sender) {
        baseTokenURI = baseURI;
    }

    // Public minting function
    function mint(uint256 quantity) public payable {
        require(quantity > 0, "Quantity cannot be zero");
        require(quantity <= 20, "Cannot mint more than 20 at a time");
        require(nextTokenId + quantity <= maxSupply, "Exceeds max supply");
        require(msg.value >= mintPrice * quantity, "Ether sent is not correct");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = nextTokenId;
            nextTokenId += 1;

            _safeMint(msg.sender, tokenId);
            emit Mint(msg.sender, tokenId);
        }
    }

    // Override baseURI to return the correct base URI
    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    // Function to set a new base URI (only owner)
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseTokenURI = newBaseURI;
    }

    // Function to withdraw funds (only owner)
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // Fallback and receive functions to accept ETH
    receive() external payable {}

    fallback() external payable {}
}
