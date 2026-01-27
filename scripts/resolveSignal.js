const hre = require("hardhat");

async function main() {
  const contractAddress = "0x029BcD216154cD5B488548CC21CC766E01f80db4";
  const signalId = 1;

  const SignalMarket = await hre.ethers.getContractAt(
    "SignalMarket",
    contractAddress,
  );

  console.log("Resolving signal", signalId);

  const signal = await SignalMarket.signals(signalId);
  console.log("Target Price:", signal.targetPrice.toString());
  console.log("Direction:", signal.direction === 0 ? "Bullish" : "Bearish");

  const tx = await SignalMarket.resolveSignal(signalId, {
    gasLimit: 300000,
  });

  console.log("Waiting for Chainlink to check price...");
  await tx.wait();

  console.log("Signal resolved!");
  console.log("Transaction:", tx.hash);
  console.log(`View: https://sepolia.etherscan.io/tx/${tx.hash}`);

  // Check result
  const updatedSignal = await SignalMarket.signals(signalId);
  console.log("\nRESULT:");
  console.log("Status:", updatedSignal.status); // Should be 1 (Resolved)
  console.log("Was Correct:", updatedSignal.isCorrect);

  // Check trader stats
  const traderStats = await SignalMarket.traderStats(signal.trader);
  console.log("\nTrader Stats:");
  console.log("Total Signals:", traderStats.totalSignals.toString());
  console.log("Correct Signals:", traderStats.correctSignals.toString());
  console.log(
    "Win Rate:",
    (
      (Number(traderStats.correctSignals) / Number(traderStats.totalSignals)) *
      100
    ).toFixed(2) + "%",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
