const hre = require("hardhat");

async function main() {
  const contractAddress = "0x029BcD216154cD5B488548CC21CC766E01f80db4";

  const SignalMarket = await hre.ethers.getContractAt(
    "SignalMarket",
    contractAddress,
  );

  console.log("Step 1: Creating signal...");

  const deadline = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 1 day

  const tx1 = await SignalMarket.createSignal(
    "ETH",
    70000,
    deadline,
    0, // Bullish
    hre.ethers.parseEther("0.02"),
    "Testing cancellation",
    {
      value: hre.ethers.parseEther("0.001"),
      gasLimit: 500000,
    },
  );

  await tx1.wait();

  const signalId = (await SignalMarket.nextSignalId()) - 1n;
  console.log("Signal created! ID:", signalId.toString());

  // Check status before
  let signal = await SignalMarket.signals(signalId);
  console.log("Status before:", signal.status, "(0 = Active)");

  console.log("\nStep 2: Cancelling signal...");

  const tx2 = await SignalMarket.cancelSignal(signalId, {
    gasLimit: 200000,
  });

  await tx2.wait();

  console.log("Signal cancelled!");
  console.log("Transaction:", tx2.hash);
  console.log(`View: https://sepolia.etherscan.io/tx/${tx2.hash}`);

  // Check status after
  signal = await SignalMarket.signals(signalId);
  console.log("\nStatus after:", signal.status, "(3 = Cancelled)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
