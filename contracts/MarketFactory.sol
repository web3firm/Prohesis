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
    uint256 public minBet; // optional minimum bet for markets (enforced in UI)
    address public feeRecipient; // protocol fee recipient for all markets
    uint16 public feeBps; // e.g., 100 = 1%
    address[] public allMarkets;

    event MarketCreated(address indexed market, string title, uint256 endTime, address creator);
    event FeeUpdated(uint256 newFee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _feeRecipient, uint16 _feeBps, uint256 _minBet) {
        owner = msg.sender;
        creationFee = 0 ether; // set if you want to charge e.g. 0.01 ether
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
        minBet = _minBet;
    }

    // ============ Create Market ============
    function createMarket(string memory _title, uint256 _endTime) external payable {
        require(msg.value >= creationFee, "Insufficient creation fee");

        ProhesisPredictionMarket market = new ProhesisPredictionMarket();
        // pass sender as creator and propagate protocol fee params
        market.initialize(_title, _endTime, msg.sender, feeRecipient, feeBps);

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

    function updateFeeParams(address _recipient, uint16 _bps) external onlyOwner {
        feeRecipient = _recipient;
        feeBps = _bps;
    }

    function updateMinBet(uint256 _minBet) external onlyOwner {
        minBet = _minBet;
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
