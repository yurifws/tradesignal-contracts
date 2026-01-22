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
    }

    mapping(uint256 => Signal) public signals;
    uint256 public nextSignalId;

}