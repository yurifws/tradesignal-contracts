const hre = require("hardhat");

async function main() {
  const contractAddress = "0x23ae9ee257069cCcDa0157e2941D5D8ba4394B47";
  const signalId = 0;
  
  const SignalMarket = await hre.ethers.getContractAt("SignalMarket", contractAddress);
  
  console.log("Getting analysis for signal", signalId);
  
  try {
    const analysis = await SignalMarket.getSignalAnalysis(signalId);
    
    console.log("\nSUCCESS! You have access to the analysis:");
    console.log("─".repeat(60));
    console.log(analysis);
    console.log("─".repeat(60));
  } catch (error) {
    console.log("Access denied! You need to purchase first.");
    console.log("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });