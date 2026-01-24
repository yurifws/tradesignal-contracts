const hre = require("hardhat");

async function main() {
  const contractAddress = "0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47";
  const signalId = 0; 
  
  const SignalMarket = await hre.ethers.getContractAt("SignalMarket", contractAddress);
  
  console.log("Purchasing signal", signalId);
  
  const signal = await SignalMarket.signals(signalId);
  const fee = signal.fee;
  
  console.log("Fee to pay:", hre.ethers.formatEther(fee), "ETH");
  
  const tx = await SignalMarket.purchaseSignal(signalId, {
    value: fee,
    gasLimit: 300000
  });
  
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  console.log("Signal purchased!");
  console.log("Transaction:", tx.hash);
  console.log(`View: https://sepolia.etherscan.io/tx/${tx.hash}`);
  
  // Check if we have access now
  const [signer] = await hre.ethers.getSigners();
  const hasAccess = await SignalMarket.signalAccess(signalId, signer.address);
  console.log("\nHas access:", hasAccess);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });