const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SignalMarket", function () {
  let signalMarket;
  let mockPriceFeed;
  let owner;
  let trader;
  let buyer;

  const LISTING_FEE = ethers.parseEther("0.001");
  const SIGNAL_FEE = ethers.parseEther("0.05");
  const TARGET_PRICE = 3500;
  const ASSET = "ETH";
  const ANALYSIS = "My detailed analysis";

  beforeEach(async function () {
    [owner, trader, buyer] = await ethers.getSigners();

    // Deploy Mock Price Feed
    const MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
    mockPriceFeed = await MockPriceFeed.deploy(8, 3000_00000000); // $3000

    // Deploy SignalMarket
    const SignalMarket = await ethers.getContractFactory("SignalMarket");
    signalMarket = await SignalMarket.deploy(await mockPriceFeed.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await signalMarket.owner()).to.equal(owner.address);
    });

    it("Should set the price feed address", async function () {
      expect(await signalMarket.priceFeed()).to.equal(
        await mockPriceFeed.getAddress(),
      );
    });

    it("Should set listing fee correctly", async function () {
      expect(await signalMarket.listingFee()).to.equal(LISTING_FEE);
    });

    it("Should set protocol fee to 5%", async function () {
      expect(await signalMarket.protocolFeePercent()).to.equal(5);
    });
  });

  describe("Create Signal", function () {
    it("Should create a signal successfully", async function () {
      const deadline = (await time.latest()) + 86400; // +1 day

      await expect(
        signalMarket.connect(trader).createSignal(
          ASSET,
          TARGET_PRICE,
          deadline,
          0, // Bullish
          SIGNAL_FEE,
          ANALYSIS,
          { value: LISTING_FEE },
        ),
      )
        .to.emit(signalMarket, "SignalCreated")
        .withArgs(0, trader.address, ASSET, TARGET_PRICE, deadline);

      const signal = await signalMarket.signals(0);
      expect(signal.trader).to.equal(trader.address);
      expect(signal.asset).to.equal(ASSET);
      expect(signal.targetPrice).to.equal(TARGET_PRICE);
      expect(signal.direction).to.equal(0);
      expect(signal.status).to.equal(0); // Active
    });

    it("Should increment nextSignalId", async function () {
      const deadline = (await time.latest()) + 86400;

      await signalMarket
        .connect(trader)
        .createSignal(ASSET, TARGET_PRICE, deadline, 0, SIGNAL_FEE, ANALYSIS, {
          value: LISTING_FEE,
        });

      expect(await signalMarket.nextSignalId()).to.equal(1);
    });

    it("Should update trader stats", async function () {
      const deadline = (await time.latest()) + 86400;

      await signalMarket
        .connect(trader)
        .createSignal(ASSET, TARGET_PRICE, deadline, 0, SIGNAL_FEE, ANALYSIS, {
          value: LISTING_FEE,
        });

      const stats = await signalMarket.traderStats(trader.address);
      expect(stats.totalSignals).to.equal(1);
    });

    it("Should reject if listing fee is too low", async function () {
      const deadline = (await time.latest()) + 86400;

      await expect(
        signalMarket
          .connect(trader)
          .createSignal(
            ASSET,
            TARGET_PRICE,
            deadline,
            0,
            SIGNAL_FEE,
            ANALYSIS,
            { value: ethers.parseEther("0.0001") },
          ),
      ).to.be.revertedWith("Must pay listing fee");
    });

    it("Should reject if deadline is in the past", async function () {
      const pastDeadline = (await time.latest()) - 1;

      await expect(
        signalMarket
          .connect(trader)
          .createSignal(
            ASSET,
            TARGET_PRICE,
            pastDeadline,
            0,
            SIGNAL_FEE,
            ANALYSIS,
            { value: LISTING_FEE },
          ),
      ).to.be.revertedWith("Deadline must be in the future");
    });
  });
});
