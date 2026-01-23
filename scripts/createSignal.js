const hre = require("hardhat");

async function main() {
  const contractAddress = "0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47";
  
  const SignalMarket = await hre.ethers.getContractAt("SignalMarket", contractAddress);
  
  console.log("Creating signal...");
  
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
  
  const tx = await SignalMarket.createSignal(
    "ETH",                                    
    3500,                                     
    deadline,                                
    0,                                       
    hre.ethers.parseEther("0.01"),           
    "ETH is looking bullish! Expecting breakout above 3500.", 
    { 
      value: hre.ethers.parseEther("0.001"),  
      gasLimit: 500000                        
    }
  );
  
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  
  console.log("Signal created!");
  console.log("Transaction:", tx.hash);
  console.log(`View: https://sepolia.etherscan.io/tx/${tx.hash}`);
  
  // Get the signal ID
  const signalId = await SignalMarket.nextSignalId() - 1n;
  console.log("\nSignal ID:", signalId.toString());
  
  // Get signal details
  const signal = await SignalMarket.signals(signalId);
  console.log("Trader:", signal.trader);
  console.log("Asset:", signal.asset);
  console.log("Target Price:", signal.targetPrice.toString());
  console.log("Fee:", hre.ethers.formatEther(signal.fee), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });