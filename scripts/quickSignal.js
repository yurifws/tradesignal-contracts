const hre = require("hardhat");

async function main() {
  const contractAddress = "0x029BcD216154cD5B488548CC21CC766E01f80db4";
  const SignalMarket = await hre.ethers.getContractAt(
    "SignalMarket",
    contractAddress,
  );

  console.log("Creating signal with 2-minute deadline...");

  const deadline = Math.floor(Date.now() / 1000) + 120; // 2 minutes

  const tx = await SignalMarket.createSignal(
    "ETH",
    2500,
    deadline,
    0, // Bullish
    hre.ethers.parseEther("0.01"),
    "Quick test for resolve",
    {
      value: hre.ethers.parseEther("0.001"),
      gasLimit: 500000,
    },
  );

  await tx.wait();
  const signalId = (await SignalMarket.nextSignalId()) - 1n;

  console.log("Signal created! ID:", signalId.toString());
  console.log("Expires in 2 minutes");
}

main().catch(console.error);
