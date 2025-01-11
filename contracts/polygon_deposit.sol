// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// USDC-Like Token on Polygon Amoy
contract AmoyUSDC is ERC20 {
    // Total Supply set to 1,000,000 USDC (with 6 decimals)
    constructor() ERC20("Amoy USDC", "AUSDC") {
        _mint(msg.sender, 1000000 * (10 ** uint256(decimals())));
    }

    // Overriding decimals to return 6, since USDC uses 6 decimals
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
