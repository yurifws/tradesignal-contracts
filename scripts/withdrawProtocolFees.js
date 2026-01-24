const hre = require("hardhat");

async function main() {
  const contractAddress = "0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47";
  
  const SignalMarket = await hre.ethers.getContractAt("SignalMarket", contractAddress);
  
  // Check contract balance before
  const balanceBefore = await hre.ethers.provider.getBalance(contractAddress);
  console.log("Contract balance:", hre.ethers.formatEther(balanceBefore), "ETH");
  console.log("   (This is accumulated protocol fees!)");
  
  // Check owner balance before
  const [signer] = await hre.ethers.getSigners();
  const ownerBalanceBefore = await hre.ethers.provider.getBalance(signer.address);
  console.log("\nYour balance before:", hre.ethers.formatEther(ownerBalanceBefore), "ETH");
  
  console.log("\nWithdrawing protocol fees...");
  
  const tx = await SignalMarket.withdrawProtocolFees({
    gasLimit: 100000
  });
  
  await tx.wait();
  
  console.log("Fees withdrawn!");
  console.log("Transaction:", tx.hash);
  console.log(`View: https://sepolia.etherscan.io/tx/${tx.hash}`);
  
  // Check balances after
  const balanceAfter = await hre.ethers.provider.getBalance(contractAddress);
  const ownerBalanceAfter = await hre.ethers.provider.getBalance(signer.address);
  
  console.log("\nRESULT:");
  console.log("Contract balance after:", hre.ethers.formatEther(balanceAfter), "ETH");
  console.log("Your balance after:", hre.ethers.formatEther(ownerBalanceAfter), "ETH");
  console.log("\nYou withdrew:", hre.ethers.formatEther(balanceBefore - balanceAfter), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });