// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProhesisPredictionMarket
 * @notice Handles an individual market where users can bet YES or NO using ETH.
 * Creator can resolve it once the end time passes, and winners can claim their payouts.
 */

contract ProhesisPredictionMarket is ReentrancyGuard {
    // ============ State Variables ============
    address public creator;
    address public feeRecipient; // protocol fee recipient
    uint16 public feeBps; // e.g., 100 = 1%
    string public title;
    uint256 public endTime;

    uint256 public totalYesPool;
    uint256 public totalNoPool;
    bool public resolved;
    bool public canceled; // allow creator to cancel before end
    uint8 public winningOutcome; // 1 = YES, 0 = NO
    bool public initialized;

    mapping(address => uint256) public yesBets;
    mapping(address => uint256) public noBets;
    mapping(address => bool) public hasClaimed;

    // ============ Events ============
    event BetPlaced(address indexed user, bool choice, uint256 amount);
    event MarketResolved(uint8 outcome);
    event WinningsClaimed(address indexed user, uint256 amount, uint256 fee);
    event MarketCanceled();

    // ============ Modifiers ============
    modifier onlyCreator() {
        require(msg.sender == creator, "Not creator");
        _;
    }

    modifier marketActive() {
        require(block.timestamp < endTime, "Market ended");
        require(!resolved, "Market resolved");
        _;
    }

    modifier marketEnded() {
        require(block.timestamp >= endTime, "Market not ended");
        _;
    }

    modifier onlyUninitialized() {
        require(!initialized, "initialized");
        _;
    }

    // ============ Initialization ============
    // initialize now accepts an explicit creator address so the factory can set
    // the true human/owner as creator (previously the factory contract became
    // the creator which prevented creators from calling onlyCreator functions).
    function initialize(string memory _title, uint256 _endTime, address _creator, address _feeRecipient, uint16 _feeBps)
        external
        onlyUninitialized
    {
        require(_endTime > block.timestamp + 5 minutes, "Invalid end time");
        title = _title;
        endTime = _endTime;
        creator = _creator;
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
        initialized = true;
    }

    // ============ Betting ============
    function placeBet(bool _choice) external payable marketActive {
        require(msg.value > 0, "Zero bet not allowed");

        if (_choice) {
            yesBets[msg.sender] += msg.value;
            totalYesPool += msg.value;
        } else {
            noBets[msg.sender] += msg.value;
            totalNoPool += msg.value;
        }

        emit BetPlaced(msg.sender, _choice, msg.value);
    }

    // ============ View Functions ============
    function getPoolTotals() external view returns (uint256 yes, uint256 no) {
        return (totalYesPool, totalNoPool);
    }

    function getUserBet(address user)
        external
        view
        returns (uint256 yes, uint256 no)
    {
        return (yesBets[user], noBets[user]);
    }

    function getTotalPool() public view returns (uint256) {
        return totalYesPool + totalNoPool;
    }

    // ============ Resolve Market ============
    function resolve(uint8 _winningOutcome)
        external
        onlyCreator
        marketEnded
    {
        require(!resolved, "Already resolved");
        require(!canceled, "Market canceled");
        require(_winningOutcome == 0 || _winningOutcome == 1, "Invalid outcome");

        resolved = true;
        winningOutcome = _winningOutcome;

        emit MarketResolved(_winningOutcome);
    }

    // ============ Claim Winnings ============
    function claimWinnings() external nonReentrant {
        require(resolved, "Not resolved yet");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 payout = 0;

        if (winningOutcome == 1 && yesBets[msg.sender] > 0) {
            payout = (yesBets[msg.sender] * getTotalPool()) / totalYesPool;
        } else if (winningOutcome == 0 && noBets[msg.sender] > 0) {
            payout = (noBets[msg.sender] * getTotalPool()) / totalNoPool;
        }

        require(payout > 0, "Not eligible");

        // protocol fee
        uint256 fee = (payout * feeBps) / 10_000;
        uint256 sendAmount = payout - fee;

        hasClaimed[msg.sender] = true;
        if (fee > 0 && feeRecipient != address(0)) {
            (bool fs, ) = payable(feeRecipient).call{value: fee}("");
            require(fs, "Fee transfer failed");
        }
        (bool success, ) = payable(msg.sender).call{value: sendAmount}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(msg.sender, sendAmount, fee);
    }

    // Cancel market before end time; refunds both pools proportionally via manual claim path
    function cancel() external onlyCreator {
        require(!resolved, "Resolved");
        require(!canceled, "Canceled");
        require(block.timestamp < endTime, "Already ended");
        canceled = true;
        emit MarketCanceled();
    }

    // View helper: amount a user can claim now (post-resolution or cancel)
    function claimable(address user) external view returns (uint256) {
        if (hasClaimed[user]) return 0;
        if (canceled) {
            // full refund
            return yesBets[user] + noBets[user];
        }
        if (!resolved) return 0;
        if (winningOutcome == 1 && yesBets[user] > 0) {
            uint256 payout = (yesBets[user] * getTotalPool()) / totalYesPool;
            uint256 fee = (payout * feeBps) / 10_000;
            return payout - fee;
        } else if (winningOutcome == 0 && noBets[user] > 0) {
            uint256 payout = (noBets[user] * getTotalPool()) / totalNoPool;
            uint256 fee = (payout * feeBps) / 10_000;
            return payout - fee;
        }
        return 0;
    }

    // ============ Fallback ============
    receive() external payable {}
}
