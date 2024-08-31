// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(string => bool) private _mintedHashes;

    // Pass msg.sender as the initial owner to the Ownable constructor
    constructor() ERC721("Wrapped NFT", "WNFT") Ownable(msg.sender) {}

    function mint(string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function mintFromBridge(address recipient, string memory uri) public onlyOwner returns (uint256) {
        require(!_mintedHashes[uri], "NFT already minted");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, uri);

        _mintedHashes[uri] = true;
        return tokenId;
    }

    // Add in future to alter the burning behavior??
    // function _burn(uint256 tokenId) internal override {
    //     string memory tokenUri = tokenURI(tokenId);
    //     _mintedHashes[tokenUri] = false;
    //     super._burn(tokenId);
    // }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
