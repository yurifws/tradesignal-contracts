pragma solidity ^0.8.20;

contract SignalMarket {

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
    address public owner;

    constructor() {
        owner = msg.sender;
        listingFee = 0.001 ether;
        protocolFeePercent = 5;
    }

    

}