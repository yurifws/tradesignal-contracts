# Trade Signal - Smart Contracts 📜

Solidity smart contracts for the Trade Signal decentralized trading signals marketplace.

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)
![Hardhat](https://img.shields.io/badge/Hardhat-2.19-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 About

Set of smart contracts that implement a decentralized marketplace where traders can:

- 📝 Create market signals (Bullish/Bearish)
- 💰 Monetize their analysis
- 🏆 Build on-chain reputation
- 🔮 Automatic resolution via Chainlink Oracle

## ✨ Features

- **Signal Creation** - Traders create signals by paying a listing fee
- **Purchase System** - Users buy access to analysis
- **Protocol Fee** - 5% goes to protocol, 95% to trader
- **Automatic Resolution** - Chainlink Price Feeds verify predictions
- **On-chain Reputation** - Immutable track record of accuracy
- **Management** - Owner can withdraw protocol fees

## 🛠️ Tech Stack

- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Libraries**:
  - OpenZeppelin Contracts (Ownable)
  - Chainlink Contracts (Price Feeds)
- **Tools**:
  - Ethers.js (interaction)
  - Hardhat Etherscan (verification)
  - Dotenv (environment variables)

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Wallet with Sepolia ETH

### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/tradesignal-contracts.git
cd tradesignal-contracts

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit the `.env` file:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🏗️ Contract Structure

### SignalMarket.sol

```solidity
struct Signal {
    address trader;          // Creator's address
    Direction direction;     // Bullish (0) or Bearish (1)
    SignalStatus status;     // Active, Resolved, Expired, Cancelled
    bool isCorrect;          // Was prediction correct?
    uint256 id;             // Unique ID
    uint256 targetPrice;    // Target price (USD)
    uint256 deadline;       // Deadline timestamp
    uint256 fee;            // Fee to access analysis
    string asset;           // Asset (ETH, BTC, etc)
    string analysis;        // Private analysis
}
```

### Main Functions

#### Public

```solidity
// Create a new signal
function createSignal(
    string memory _asset,
    uint256 _targetPrice,
    uint256 _deadline,
    Direction _direction,
    uint256 _fee,
    string memory _analysis
) public payable

// Purchase access to a signal
function purchaseSignal(uint256 signalId) public payable

// View analysis (only if purchased)
function getSignalAnalysis(uint256 signalId) public view returns (string memory)

// Resolve signal (after deadline)
function resolveSignal(uint256 signalId) public

// Cancel signal (creator only)
function cancelSignal(uint256 signalId) public
```

#### Owner Only

```solidity
// Withdraw protocol fees
function withdrawProtocolFees() public onlyOwner
```

### Events

```solidity
event SignalCreated(uint256 indexed signalId, address indexed trader, string asset, uint256 targetPrice, uint256 deadline);
event SignalPurchased(uint256 indexed signalId, address indexed buyer, uint256 amount);
event SignalResolved(uint256 indexed signalId, bool isCorrect, uint256 finalPrice);
event SignalCancelled(uint256 indexed signalId, address indexed trader);
event ProtocolFeesWithdrawn(address indexed owner, uint256 amount);
```

## 🚀 Deployment

### Testnet (Sepolia)

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS PRICE_FEED_ADDRESS
```

### Mainnet

⚠️ **WARNING**: Audit the contract before deploying to mainnet!

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

## 🧪 Testing

```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific tests
npx hardhat test test/SignalMarket.test.js
```

## 📝 Available Scripts

### Deploy Script

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Interact with Contract

```bash
# Create signal
npx hardhat run scripts/createSignal.js --network sepolia

# Purchase signal
npx hardhat run scripts/purchaseSignal.js --network sepolia

# Resolve signal
npx hardhat run scripts/resolveSignal.js --network sepolia
```

## 🔧 Configuration

### Chainlink Price Feeds

The contract uses Chainlink Price Feeds for automatic resolution.

**Sepolia Testnet:**

- ETH/USD: `0x694AA1769357215DE4FAC081bf1f309aDC325306`

**Mainnet:**

- See addresses at: https://docs.chain.link/data-feeds/price-feeds/addresses

### Fees

```solidity
uint256 public listingFee = 0.001 ether;      // Fee to create signal
uint256 public protocolFeePercent = 5;         // 5% of purchase value
```

To change:

```solidity
// Add functions in contract:
function setListingFee(uint256 _fee) public onlyOwner {
    listingFee = _fee;
}

function setProtocolFeePercent(uint256 _percent) public onlyOwner {
    protocolFeePercent = _percent;
}
```

## 🔐 Security

### Implemented Best Practices

- ✅ **Reentrancy Protection** - Checks-Effects-Interactions pattern
- ✅ **Access Control** - OpenZeppelin Ownable
- ✅ **Input Validation** - Requires in all critical functions
- ✅ **Integer Overflow** - Solidity 0.8.x built-in protection
- ✅ **External Calls** - Minimum external calls

### Audits

⚠️ **This contract has NOT been professionally audited**

For production, it's recommended to:

- Audit by specialized firm (OpenZeppelin, Trail of Bits, etc)
- Bug bounty program
- Extensive testing
- Gradual deployment with limits

## 📊 Gas Optimization

| Function       | Estimated Gas (Sepolia) |
| -------------- | ----------------------- |
| createSignal   | ~150,000 gas            |
| purchaseSignal | ~80,000 gas             |
| resolveSignal  | ~100,000 gas            |
| cancelSignal   | ~50,000 gas             |

## 🌐 Deployments

### Sepolia Testnet

- **Contract**: `0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47`
- **Etherscan**: https://sepolia.etherscan.io/address/0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47
- **Chainlink Price Feed**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`

### Mainnet

_Not yet deployed_

## 📖 Technical Documentation

### Usage Flow

1. **Trader creates signal**:

   ```
   createSignal() → pays 0.001 ETH → signal active
   ```

2. **User purchases**:

   ```
   purchaseSignal() → pays fee → access granted
   95% goes to trader, 5% to protocol
   ```

3. **After deadline**:

   ```
   resolveSignal() → Chainlink checks price → marks as correct/incorrect
   ```

4. **Reputation updated**:
   ```
   traderStats[trader].totalSignals++
   If correct: traderStats[trader].correctSignals++
   ```

### Signal States

```solidity
enum SignalStatus {
    Active,     // 0 - Active signal, can be purchased
    Resolved,   // 1 - Resolved after deadline
    Expired,    // 2 - Expired (not yet implemented)
    Cancelled   // 3 - Cancelled by creator
}
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a branch (`git checkout -b feature/MyFeature`)
3. Commit your changes (`git commit -m 'Add MyFeature'`)
4. Push to the branch (`git push origin feature/MyFeature`)
5. Open a Pull Request

## 📄 License

This project is under the MIT license. See the [LICENSE](LICENSE) file for more details.

## 🔗 Links

- **Web Interface**: [tradesignal-ui](https://github.com/your-username/tradesignal-ui)
- **Chainlink Docs**: https://docs.chain.link/
- **OpenZeppelin**: https://docs.openzeppelin.com/
- **Hardhat**: https://hardhat.org/

## 📞 Support

Have questions? Open an [issue](https://github.com/your-username/tradesignal-contracts/issues) or get in touch!

---

**Developed with ❤️ as a Web3 Bootcamp final project**
