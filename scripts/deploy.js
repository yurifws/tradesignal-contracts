const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Chainlink ETH/USD Price Feed on Sepolia
  const CHAINLINK_ETH_USD_SEPOLIA = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

  // Deploy
  const SignalMarket = await hre.ethers.getContractFactory("SignalMarket");
  const signalMarket = await SignalMarket.deploy(CHAINLINK_ETH_USD_SEPOLIA);

  await signalMarket.waitForDeployment();

  const address = await signalMarket.getAddress();

  console.log("SignalMarket deployed to:", address);
  console.log("Listing Fee:", await signalMarket.listingFee());
  console.log("Protocol Fee %:", await signalMarket.protocolFeePercent());
  console.log("Owner:", await signalMarket.owner());
  
  console.log("\nView on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${address}`);
  
  console.log("\nWait 30 seconds, then verify with:");
  console.log(`npx hardhat verify --network sepolia ${address} ${CHAINLINK_ETH_USD_SEPOLIA}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });