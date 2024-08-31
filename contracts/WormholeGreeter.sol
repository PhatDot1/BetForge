// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./wormhole/IWormholeRelayer.sol";
import "./wormhole/IWormholeReceiver.sol";

contract WormholeGreeter is IWormholeReceiver {
    event GreetingReceived(string greeting, uint16 senderChain, address sender);

    IWormholeRelayer public immutable wormholeRelayer;
    string public latestGreeting;

    constructor(address _wormholeRelayer) {
        wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
    }

    function sendGreeting(
        uint16 targetChain,
        address targetAddress,
        string memory greeting
    ) public payable {
        (uint256 cost, ) = wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            0,
            200_000 // Custom gas limit
        );
        require(msg.value == cost, "Incorrect value");

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            targetChain,
            targetAddress,
            abi.encode(greeting, msg.sender),
            0,
            200_000
        );
    }

    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory,
        bytes32,
        uint16 sourceChain,
        bytes32
    ) public payable override {
        require(msg.sender == address(wormholeRelayer), "Only relayer allowed");

        (string memory greeting, address sender) = abi.decode(
            payload,
            (string, address)
        );
        latestGreeting = greeting;
        emit GreetingReceived(greeting, sourceChain, sender);
    }
}
