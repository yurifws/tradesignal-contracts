require('dotenv').config();

module.exports = {
  contractAddress: "0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47",
  contractABI: require("../artifacts/contracts/SignalMarket.sol/SignalMarket.json").abi,
  network: "sepolia",
  rpcUrl: process.env.SEPOLIA_RPC_URL,
  privateKey: process.env.PRIVATE_KEY
};