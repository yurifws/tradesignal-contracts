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

  describe("Purchase Signal", function () {
    let signalId;
    let deadline;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;

      await signalMarket
        .connect(trader)
        .createSignal(ASSET, TARGET_PRICE, deadline, 0, SIGNAL_FEE, ANALYSIS, {
          value: LISTING_FEE,
        });

      signalId = 0;
    });

    it("Should purchase signal successfully", async function () {
      await expect(
        signalMarket
          .connect(buyer)
          .purchaseSignal(signalId, { value: SIGNAL_FEE }),
      )
        .to.emit(signalMarket, "SignalPurchased")
        .withArgs(signalId, buyer.address, SIGNAL_FEE);

      expect(await signalMarket.signalAccess(signalId, buyer.address)).to.be
        .true;
    });

    it("Should transfer 95% to trader and keep 5% protocol fee", async function () {
      const traderBalanceBefore = await ethers.provider.getBalance(
        trader.address,
      );

      await signalMarket
        .connect(buyer)
        .purchaseSignal(signalId, { value: SIGNAL_FEE });

      const traderBalanceAfter = await ethers.provider.getBalance(
        trader.address,
      );
      const expectedCut = (SIGNAL_FEE * 95n) / 100n;

      expect(traderBalanceAfter - traderBalanceBefore).to.equal(expectedCut);
    });

    it("Should reject if fee is too low", async function () {
      await expect(
        signalMarket
          .connect(buyer)
          .purchaseSignal(signalId, { value: ethers.parseEther("0.01") }),
      ).to.be.revertedWith("Incorrect payment amount");
    });

    it("Should reject if already purchased", async function () {
      await signalMarket
        .connect(buyer)
        .purchaseSignal(signalId, { value: SIGNAL_FEE });

      await expect(
        signalMarket
          .connect(buyer)
          .purchaseSignal(signalId, { value: SIGNAL_FEE }),
      ).to.be.revertedWith("Already purchased");
    });

    it("Should reject if signal is not active", async function () {
      // Cancel the signal
      await signalMarket.connect(trader).cancelSignal(signalId);

      await expect(
        signalMarket
          .connect(buyer)
          .purchaseSignal(signalId, { value: SIGNAL_FEE }),
      ).to.be.revertedWith("Signal is not active");
    });
  });

  describe("Get Signal Analysis", function () {
    let signalId;

    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;

      await signalMarket
        .connect(trader)
        .createSignal(ASSET, TARGET_PRICE, deadline, 0, SIGNAL_FEE, ANALYSIS, {
          value: LISTING_FEE,
        });

      signalId = 0;
    });

    it("Should return analysis after purchase", async function () {
      await signalMarket
        .connect(buyer)
        .purchaseSignal(signalId, { value: SIGNAL_FEE });

      const analysis = await signalMarket
        .connect(buyer)
        .getSignalAnalysis(signalId);
      expect(analysis).to.equal(ANALYSIS);
    });

    it("Should reject if not purchased", async function () {
      await expect(
        signalMarket.connect(buyer).getSignalAnalysis(signalId),
      ).to.be.revertedWith("Must purchase signal first");
    });
  });

  describe("Resolve Signal", function () {
    let signalId;
    let deadline;

    beforeEach(async function () {
      deadline = (await time.latest()) + 86400;

      await signalMarket
        .connect(trader)
        .createSignal(ASSET, TARGET_PRICE, deadline, 0, SIGNAL_FEE, ANALYSIS, {
          value: LISTING_FEE,
        });

      signalId = 0;
    });

    it("Should resolve bullish signal as correct", async function () {
      // Price goes above target
      await mockPriceFeed.updateAnswer(3600_00000000);
      await time.increaseTo(deadline + 1);

      await expect(signalMarket.resolveSignal(signalId))
        .to.emit(signalMarket, "SignalResolved")
        .withArgs(signalId, true, 3600);

      const signal = await signalMarket.signals(signalId);
      expect(signal.status).to.equal(1); // Resolved
      expect(signal.isCorrect).to.be.true;
    });

    it("Should resolve bullish signal as incorrect", async function () {
      // Price stays below target
      await mockPriceFeed.updateAnswer(2900_00000000);
      await time.increaseTo(deadline + 1);

      await signalMarket.resolveSignal(signalId);

      const signal = await signalMarket.signals(signalId);
      expect(signal.isCorrect).to.be.false;
    });

    it("Should resolve bearish signal correctly", async function () {
      // Create bearish signal
      deadline = (await time.latest()) + 86400;
      await signalMarket
        .connect(trader)
        .createSignal(ASSET, TARGET_PRICE, deadline, 1, SIGNAL_FEE, ANALYSIS, {
          value: LISTING_FEE,
        });

      // Price goes down
      await mockPriceFeed.updateAnswer(2900_00000000);
      await time.increaseTo(deadline + 1);

      await signalMarket.resolveSignal(1);

      const signal = await signalMarket.signals(1);
      expect(signal.isCorrect).to.be.true;
    });

    it("Should update trader stats on correct prediction", async function () {
      await mockPriceFeed.updateAnswer(3600_00000000);
      await time.increaseTo(deadline + 1);
      await signalMarket.resolveSignal(signalId);

      const stats = await signalMarket.traderStats(trader.address);
      expect(stats.correctSignals).to.equal(1);
    });

    it("Should not update correct count on incorrect prediction", async function () {
      await mockPriceFeed.updateAnswer(2900_00000000);
      await time.increaseTo(deadline + 1);
      await signalMarket.resolveSignal(signalId);

      const stats = await signalMarket.traderStats(trader.address);
      expect(stats.correctSignals).to.equal(0);
    });

    it("Should reject if deadline not passed", async function () {
      await expect(signalMarket.resolveSignal(signalId)).to.be.revertedWith(
        "Deadline not passed yet",
      );
    });

    it("Should reject if already resolved", async function () {
      await time.increaseTo(deadline + 1);
      await signalMarket.resolveSignal(signalId);

      await expect(signalMarket.resolveSignal(signalId)).to.be.revertedWith(
        "Signal is not active",
      );
    });
  });

  describe("Cancel Signal", function () {
    let signalId;

    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;

      await signalMarket
        .connect(trader)
        .createSignal(ASSET, TARGET_PRICE, deadline, 0, SIGNAL_FEE, ANALYSIS, {
          value: LISTING_FEE,
        });

      signalId = 0;
    });

    it("Should allow trader to cancel their signal", async function () {
      await expect(signalMarket.connect(trader).cancelSignal(signalId))
        .to.emit(signalMarket, "SignalCancelled")
        .withArgs(signalId, trader.address);

      const signal = await signalMarket.signals(signalId);
      expect(signal.status).to.equal(3); // Cancelled
    });

    it("Should reject if not the trader", async function () {
      await expect(
        signalMarket.connect(buyer).cancelSignal(signalId),
      ).to.be.revertedWith("Only trader can cancel");
    });

    it("Should reject if already resolved", async function () {
      const deadline = (await time.latest()) + 86400;
      await time.increaseTo(deadline + 86401);
      await signalMarket.resolveSignal(signalId);

      await expect(
        signalMarket.connect(trader).cancelSignal(signalId),
      ).to.be.revertedWith("Signal is not active");
    });
  });

  describe("Withdraw Protocol Fees", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;

      // Create and purchase signal to generate fees
      await signalMarket
        .connect(trader)
        .createSignal(ASSET, TARGET_PRICE, deadline, 0, SIGNAL_FEE, ANALYSIS, {
          value: LISTING_FEE,
        });

      await signalMarket
        .connect(buyer)
        .purchaseSignal(0, { value: SIGNAL_FEE });
    });

    it("Should allow owner to withdraw fees", async function () {
      const contractBalance = await ethers.provider.getBalance(
        await signalMarket.getAddress(),
      );

      await expect(signalMarket.connect(owner).withdrawProtocolFees())
        .to.emit(signalMarket, "ProtocolFeesWithdrawn")
        .withArgs(owner.address, contractBalance);
    });

    it("Should reject non-owner", async function () {
      await expect(
        signalMarket.connect(trader).withdrawProtocolFees(),
      ).to.be.revertedWithCustomError(
        signalMarket,
        "OwnableUnauthorizedAccount",
      );
    });
  });
});
