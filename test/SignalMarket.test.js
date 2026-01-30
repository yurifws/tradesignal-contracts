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
});
