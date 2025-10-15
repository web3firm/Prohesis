// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ProhesisPredictionMarket.sol";

/**
 * @title MarketFactory
 * @notice Deploys and tracks ProhesisPredictionMarket instances.
 * The owner (deployer) can create markets and optionally set fees.
 */

contract MarketFactory {
    address public owner;
    uint256 public creationFee; // optional ETH fee for creating a market
    address[] public allMarkets;

    event MarketCreated(address indexed market, string title, uint256 endTime, address creator);
    event FeeUpdated(uint256 newFee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        creationFee = 0 ether; // set if you want to charge e.g. 0.01 ether
    }

    // ============ Create Market ============
    function createMarket(string memory _title, uint256 _endTime) external payable {
        require(msg.value >= creationFee, "Insufficient creation fee");

    ProhesisPredictionMarket market = new ProhesisPredictionMarket();
    // pass the transaction sender as the market creator so they can resolve
    // and perform creator-only actions later.
    market.initialize(_title, _endTime, msg.sender);

        allMarkets.push(address(market));

        emit MarketCreated(address(market), _title, _endTime, msg.sender);

        // transfer fee to owner
        if (creationFee > 0) {
            (bool sent, ) = payable(owner).call{value: creationFee}("");
            require(sent, "Fee transfer failed");
        }
    }

    // ============ Owner Functions ============
    function updateCreationFee(uint256 _fee) external onlyOwner {
        creationFee = _fee;
        emit FeeUpdated(_fee);
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "No balance");
        (bool sent, ) = payable(owner).call{value: bal}("");
        require(sent, "Withdraw failed");
    }

    // ============ View ============
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    function totalMarkets() external view returns (uint256) {
        return allMarkets.length;
    }

    receive() external payable {}
}
