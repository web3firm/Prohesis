// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProhesisPredictionMarket
 * @notice Handles an individual market where users can bet YES or NO using ETH.
 * Creator can resolve it once the end time passes, and winners can claim their payouts.
 */

contract ProhesisPredictionMarket {
    // ============ State Variables ============
    address public creator;
    string public title;
    uint256 public endTime;

    uint256 public totalYesPool;
    uint256 public totalNoPool;
    bool public resolved;
    uint8 public winningOutcome; // 1 = YES, 0 = NO
    bool public initialized;

    mapping(address => uint256) public yesBets;
    mapping(address => uint256) public noBets;
    mapping(address => bool) public hasClaimed;

    // ============ Events ============
    event BetPlaced(address indexed user, bool choice, uint256 amount);
    event MarketResolved(uint8 outcome);
    event WinningsClaimed(address indexed user, uint256 amount);

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
    function initialize(string memory _title, uint256 _endTime, address _creator)
        external
        onlyUninitialized
    {
        require(_endTime > block.timestamp + 5 minutes, "Invalid end time");
        title = _title;
        endTime = _endTime;
        creator = _creator;
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
        require(_winningOutcome == 0 || _winningOutcome == 1, "Invalid outcome");

        resolved = true;
        winningOutcome = _winningOutcome;

        emit MarketResolved(_winningOutcome);
    }

    // ============ Claim Winnings ============
    function claimWinnings() external {
        require(resolved, "Not resolved yet");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 payout = 0;

        if (winningOutcome == 1 && yesBets[msg.sender] > 0) {
            payout = (yesBets[msg.sender] * getTotalPool()) / totalYesPool;
        } else if (winningOutcome == 0 && noBets[msg.sender] > 0) {
            payout = (noBets[msg.sender] * getTotalPool()) / totalNoPool;
        }

        require(payout > 0, "Not eligible");

        hasClaimed[msg.sender] = true;
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(msg.sender, payout);
    }

    // ============ Fallback ============
    receive() external payable {}
}
