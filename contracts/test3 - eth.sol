// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract EthereumNFTMinterX is ERC721Enumerable, Ownable {
    using Strings for uint256;

    // Variables
    uint256 public mintPrice = 0.01 ether;
    uint256 public maxSupply = 10000;
    uint256 public nextTokenId = 0;
    mapping(uint256 => string) private _tokenURIs;

    // Events
    event Mint(address indexed minter, uint256 tokenId, string tokenURI);

    constructor() ERC721("EthereumNFT", "ETHNFT") Ownable(msg.sender) {}

    // Public minting function with custom token URI
    function mint(uint256 quantity, string memory _tokenURI) public payable {
        require(quantity > 0, "Quantity cannot be zero");
        require(quantity <= 20, "Cannot mint more than 20 at a time");
        require(nextTokenId + quantity <= maxSupply, "Exceeds max supply");
        require(msg.value >= mintPrice * quantity, "Ether sent is not correct");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = nextTokenId;
            nextTokenId += 1;

            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, _tokenURI);

            emit Mint(msg.sender, tokenId, _tokenURI);
        }
    }

    // Internal function to set token-specific URIs
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }

    // Override tokenURI to return the correct URI for each token
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // Function to withdraw funds (only owner)
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    receive() external payable {}

    fallback() external payable {}
}
