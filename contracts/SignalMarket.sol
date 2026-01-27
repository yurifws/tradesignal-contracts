// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SignalMarket is Ownable {
    enum Direction {
        Bullish,
        Bearish
    }

    enum SignalStatus {
        Active,
        Resolved,
        Expired,
        Cancelled
    }

    struct Signal {
        address trader;
        Direction direction;
        SignalStatus status;
        bool isCorrect;
        uint256 id;
        uint256 targetPrice;
        uint256 deadline;
        uint256 fee;
        string asset;
        string analysis;
    }

    mapping(uint256 => Signal) public signals;
    uint256 public nextSignalId;

    struct TraderStats {
        uint256 totalSignals;
        uint256 correctSignals;
    }

    mapping(address => TraderStats) public traderStats;

    mapping(uint256 => mapping(address => bool)) public signalAccess;

    uint256 public listingFee;
    uint256 public protocolFeePercent;

    AggregatorV3Interface public priceFeed;

    event SignalCreated(
        uint256 indexed signalId,
        address indexed trader,
        string asset,
        uint256 targetPrice,
        uint256 deadline
    );

    event SignalPurchased(
        uint256 indexed signalId,
        address indexed buyer,
        uint256 amount
    );

    event SignalResolved(
        uint256 indexed signalId,
        bool isCorrect,
        uint256 finalPrice
    );

    event SignalCancelled(uint256 indexed signalId, address indexed trader);

    event ProtocolFeesWithdrawn(address indexed owner, uint256 amount);

    constructor(address _priceFeed) Ownable(msg.sender) {
        listingFee = 0.001 ether;
        protocolFeePercent = 5;
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    modifier onlyActive(uint256 signalId) {
        require(
            signals[signalId].status == SignalStatus.Active,
            "Signal is not active"
        );
        _;
    }

    function createSignal(
        string memory _asset,
        uint256 _targetPrice,
        uint256 _deadline,
        Direction _direction,
        uint256 _fee,
        string memory _analysis
    ) public payable {
        require(msg.value >= listingFee, "Must pay listing fee");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        signals[nextSignalId] = Signal({
            trader: msg.sender,
            direction: _direction,
            status: SignalStatus.Active,
            isCorrect: false,
            id: nextSignalId,
            targetPrice: _targetPrice,
            deadline: _deadline,
            fee: _fee,
            asset: _asset,
            analysis: _analysis
        });
        emit SignalCreated(
            nextSignalId,
            msg.sender,
            _asset,
            _targetPrice,
            _deadline
        );

        nextSignalId++;
        traderStats[msg.sender].totalSignals++;
    }

    function purchaseSignal(
        uint256 signalId
    ) public payable onlyActive(signalId) {
        require(signalId < nextSignalId, "Signal does not exist");
        require(
            signalAccess[signalId][msg.sender] == false,
            "Already purchased"
        );
        require(msg.value >= signals[signalId].fee, "Incorrect payment amount");

        uint256 protocolCut = (msg.value * protocolFeePercent) / 100;
        uint256 traderCut = msg.value - protocolCut;

        signalAccess[signalId][msg.sender] = true;
        payable(signals[signalId].trader).transfer(traderCut);

        emit SignalPurchased(signalId, msg.sender, msg.value);
    }

    function getSignalAnalysis(
        uint256 signalId
    ) public view returns (string memory) {
        require(
            signalAccess[signalId][msg.sender] == true,
            "Must purchase signal first"
        );

        return signals[signalId].analysis;
    }

    function resolveSignal(uint256 signalId) public onlyActive(signalId) {
        require(
            signals[signalId].deadline <= block.timestamp,
            "Deadline not passed yet"
        );

        (, int price, , , ) = priceFeed.latestRoundData();
        uint256 currentPrice = uint256(price) / 1e8;

        bool isCorrect;
        if (signals[signalId].direction == Direction.Bullish) {
            isCorrect = currentPrice >= signals[signalId].targetPrice;
        } else {
            isCorrect = currentPrice <= signals[signalId].targetPrice;
        }

        signals[signalId].status = SignalStatus.Resolved;
        signals[signalId].isCorrect = isCorrect;

        if (isCorrect) {
            traderStats[signals[signalId].trader].correctSignals++;
        }
        emit SignalResolved(signalId, isCorrect, currentPrice);
    }

    function cancelSignal(uint256 signalId) public onlyActive(signalId) {
        require(
            msg.sender == signals[signalId].trader,
            "Only trader can cancel"
        );

        signals[signalId].status = SignalStatus.Cancelled;

        emit SignalCancelled(signalId, msg.sender);
    }

    function withdrawProtocolFees() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);

        emit ProtocolFeesWithdrawn(msg.sender, balance);
    }
}
