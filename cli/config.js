require("dotenv").config();

module.exports = {
  contractAddress: "0x029BcD216154cD5B488548CC21CC766E01f80db4",
  contractABI:
    require("../artifacts/contracts/SignalMarket.sol/SignalMarket.json").abi,
  network: "sepolia",
  rpcUrl: process.env.SEPOLIA_RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
};
