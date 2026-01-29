const hre = require("hardhat");

async function main() {
  const contractAddress = "0x029BcD216154cD5B488548CC21CC766E01f80db4";

  const SignalMarket = await hre.ethers.getContractAt(
    "SignalMarket",
    contractAddress,
  );

  console.log("Creating signal with 2-minute deadline...");

  // Deadline 2 minutes from now
  const shortDeadline = Math.floor(Date.now() / 1000) + 120; // 2 minutes

  const tx = await SignalMarket.createSignal(
    "ETH",
    3000,
    shortDeadline,
    0,
    hre.ethers.parseEther("0.01"),
    "Short deadline test for resolve",
    {
      value: hre.ethers.parseEther("0.001"),
      gasLimit: 500000,
    },
  );

  await tx.wait();

  const signalId = (await SignalMarket.nextSignalId()) - 1n;

  console.log("Signal created!");
  console.log("Signal ID:", signalId.toString());
  console.log("Deadline:", new Date(shortDeadline * 1000).toLocaleString());
  console.log("\nWAIT 2 MINUTES, then run resolve script!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
