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

    function createSignal(
        string memory _asset,
        uint256 _targetPrice,
        uint256 _deadline,
        Direction _direction,
        uint256 _fee,
        string memory _analysis) public payable {
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
        })
    }

    function purchaseSignal(uint256 signalId) public payable {
        require(signalId < nextSignalId, "Signal does not exist");
        require(SignalStatus.Active == signals[signalId].status, "Signal is not active");
        require(signalAccess[signalId][msg.sender] == false, "Already purchased");
        require(msg.value >= signals[signalId].fee, "Incorrect payment amount");

        uint256 protocolCut = (msg.value * protocolFeePercent) / 100;
        uint256 traderCut = msg.value - protocolCut;
        
        signalAccess[signalId][msg.sender] = true;
        payable(signals[signalId].trader).transfer(traderCut);
    }

    function getSignalAnalysis(uint256 signalId) public view returns (string memory) {
        require(signalAccess[signalId][msg.sender] == true, "Must purchase signal first");

        return signals[signalId].analysis;
    }

    

}