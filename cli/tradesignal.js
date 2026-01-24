#!/usr/bin/env node

const { program } = require("commander");
const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");
const { ethers } = require("ethers");
const config = require("./config");

// Setup provider and contract
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.privateKey, provider);
const contract = new ethers.Contract(
  config.contractAddress,
  config.contractABI,
  wallet
);

// CLI info
program
  .name("tradesignal")
  .description("CLI tool for TradeSignal marketplace")
  .version("1.0.0");

// CREATE command
program
  .command("create")
  .description("Create a new signal")
  .action(async () => {
    try {
      console.log(chalk.blue("\nCreate New Signal\n"));

      // Prompt for signal details
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "asset",
          message: "Asset (e.g., ETH, BTC):",
          default: "ETH"
        },
        {
          type: "number",
          name: "targetPrice",
          message: "Target price (in USD):",
          validate: (val) => val > 0 || "Must be positive"
        },
        {
          type: "list",
          name: "direction",
          message: "Direction:",
          choices: ["Bullish", "Bearish"]
        },
        {
          type: "number",
          name: "days",
          message: "Days until deadline:",
          default: 7,
          validate: (val) => val > 0 || "Must be at least 1 day"
        },
        {
          type: "input",
          name: "fee",
          message: "Signal fee (in ETH):",
          default: "0.01",
          validate: (val) => !isNaN(val) && parseFloat(val) > 0 || "Must be valid number"
        },
        {
          type: "input",
          name: "analysis",
          message: "Your analysis:",
          validate: (val) => val.length > 10 || "Analysis must be at least 10 characters"
        }
      ]);

      // Calculate deadline
      const deadline = Math.floor(Date.now() / 1000) + (answers.days * 24 * 60 * 60);
      const direction = answers.direction == "Bullish" ? 0 : 1;

      // Show spinner
      const spinner = ora("Creating signal...").start();

      // Create signal
      const tx = await contract.createSignal(
        answers.asset,
        answers.targetPrice,
        deadline,
        direction,
        ethers.parseEther(answers.fee),
        answers.analysis,
        {
          value: ethers.parseEther("0.001"),
          gasLimit: 500000
        }
      );

      spinner.text = "Waiting for confirmation...";
      await tx.wait();

      const signalId = await contract.nextSignalId() - 1n;

      spinner.succeed(chalk.green("Signal created!"));
      console.log(chalk.cyan("\nSignal ID:"), signalId.toString());
      console.log(chalk.cyan("Listing fee:"), "0.001 ETH");
      console.log(chalk.cyan("Transaction:"), `https://sepolia.etherscan.io/tx/${tx.hash}`);

    } catch (error) {
      console.error(chalk.red("\nError:"), error.message);
    }
  });

// LIST command
program
  .command("list_actives")
  .description("List all active signals")
  .action(async () => {
    try {
      console.log(chalk.blue("\Active Signals\n"));

      const nextId = await contract.nextSignalId();
      
      if (nextId === 0n) {
        console.log(chalk.yellow("No signals yet!"));
        return;
      }

      console.log(chalk.gray("─".repeat(80)));
      
      for (let i = 0n; i < nextId; i++) {
        const signal = await contract.signals(i);
        
        // Only show active signals
        if (signal.status !== 0n) continue;

        const direction = signal.direction == 0 ? "Bullish" : "Bearish";
        const deadline = new Date(Number(signal.deadline) * 1000).toLocaleDateString();
        
        console.log(
            chalk.cyan(`ID ${i}:`),
            chalk.white(signal.asset),
            "→",
            chalk.yellow(`$${signal.targetPrice}`),
            direction,
            chalk.gray(`| Trader: ${signal.trader.slice(0,6)}...${signal.trader.slice(-4)}`),
            chalk.gray(`| Fee: ${ethers.formatEther(signal.fee)} ETH`)
        );
      }
      
      console.log(chalk.gray("─".repeat(80)));

    } catch (error) {
      console.error(chalk.red("\Error:"), error.message);
    }
  });

// BUY command
program
  .command("buy")
  .description("Purchase a signal")
  .requiredOption("-i, --id <number>", "Signal ID")
  .action(async (options) => {
    try {
      const signalId = parseInt(options.id);
      
      console.log(chalk.blue(`\nPurchasing Signal #${signalId}\n`));

      // Get signal details
      const signal = await contract.signals(signalId);
      
      if (signal.status !== 0n) {
        console.log(chalk.red("Signal is not active!"));
        return;
      }

      // Check if already purchased
      const hasAccess = await contract.signalAccess(signalId, wallet.address);
      if (hasAccess) {
        console.log(chalk.yellow("You already own this signal!"));
        return;
      }

      const fee = ethers.formatEther(signal.fee);
      
      console.log(chalk.cyan("Asset:"), signal.asset);
      console.log(chalk.cyan("Target:"), `$${signal.targetPrice}`);
      console.log(chalk.cyan("Direction:"), signal.direction == 0 ? "Bullish" : "Bearish");
      console.log(chalk.cyan("Fee:"), `${fee} ETH\n`);

      // Confirm purchase
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Purchase for ${fee} ETH?`,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow("Purchase cancelled"));
        return;
      }

      const spinner = ora("Processing purchase...").start();

      const tx = await contract.purchaseSignal(signalId, {
        value: signal.fee,
        gasLimit: 300000
      });

      spinner.text = "Waiting for confirmation...";
      await tx.wait();

      spinner.succeed(chalk.green("Signal purchased!"));
      console.log(chalk.cyan("Access granted to analysis"));
      console.log(chalk.cyan("Transaction:"), `https://sepolia.etherscan.io/tx/${tx.hash}`);

    } catch (error) {
      console.error(chalk.red("\nError:"), error.message);
    }
  });

// VIEW command
program
  .command("view")
  .description("View signal analysis (requires purchase)")
  .requiredOption("-i, --id <number>", "Signal ID")
  .action(async (options) => {
    try {
      const signalId = parseInt(options.id);
      
      console.log(chalk.blue(`\nSignal #${signalId} Analysis\n`));

      // Check if has access
      const hasAccess = await contract.signalAccess(signalId, wallet.address);
      
      if (!hasAccess) {
        console.log(chalk.red("Access denied! You need to purchase this signal first."));
        console.log(chalk.yellow(`\nRun: tradesignal buy --id ${signalId}`));
        return;
      }

      const spinner = ora("Loading analysis...").start();
      
      const analysis = await contract.getSignalAnalysis(signalId);
      const signal = await contract.signals(signalId);
      
      spinner.stop();

      console.log(chalk.gray("─".repeat(80)));
      console.log(chalk.cyan("Asset:"), signal.asset);
      console.log(chalk.cyan("Target:"), `$${signal.targetPrice}`);
      console.log(chalk.cyan("Direction:"), signal.direction == 0 ? "Bullish" : "Bearish");
      console.log(chalk.cyan("Trader:"), signal.trader);
      console.log(chalk.gray("─".repeat(80)));
      console.log(chalk.white("\nAnalysis:\n"));
      console.log(chalk.green(analysis));
      console.log(chalk.gray("\n" + "─".repeat(80)));

    } catch (error) {
      console.error(chalk.red("\nError:"), error.message);
    }
  });

// STATS command
program
  .command("stats")
  .description("View trader statistics")
  .option("-a, --address <address>", "Trader address (default: yours)")
  .action(async (options) => {
    try {
      const address = options.address || wallet.address;
    
      const stats = await contract.traderStats(address);
      
      const total = Number(stats.totalSignals);
      const correct = Number(stats.correctSignals);
      const winRate = total > 0 ? ((correct / total) * 100).toFixed(2) : 0;

      console.log(chalk.gray("─".repeat(50)));
      console.log(chalk.cyan("Address:"), wallet.address);
      console.log(chalk.cyan("Total Signals:"), total);
      console.log(chalk.cyan("Correct Signals:"), correct);
      console.log(chalk.cyan("Win Rate:"), `${winRate}%`);
      console.log(chalk.gray("─".repeat(50)));

      if (winRate >= 70) {
        console.log(chalk.green("\nExcellent trader!"));
      } else if (winRate >= 50) {
        console.log(chalk.yellow("\nGood performance!"));
      } else if (total > 0) {
        console.log(chalk.red("\nNeed improvement!"));
      } else {
        console.log(chalk.blue("\nCreate your first signal!"));
      }

    } catch (error) {
      console.error(chalk.red("\nError:"), error.message);
    }
  });

  // RESOLVE command
program
  .command("resolve")
  .description("Resolve a signal using Chainlink oracle")
  .requiredOption("-i, --id <number>", "Signal ID")
  .action(async (options) => {
    try {
      const signalId = parseInt(options.id);
      
      console.log(chalk.blue(`\nResolving Signal #${signalId}\n`));

      const signal = await contract.signals(signalId);
      
      // Check if already resolved
      if (signal.status !== 0n) {
        console.log(chalk.yellow("Signal is not active!"));
        console.log(chalk.gray(`Status: ${["Active", "Resolved", "Expired", "Cancelled"][Number(signal.status)]}`));
        return;
      }

      // Check if deadline passed
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (signal.deadline > now) {
        const remaining = Number(signal.deadline - now);
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        let timeMsg;
        if (hours > 0) {
            timeMsg = `${hours}h ${minutes}m remaining`;
        } else if (minutes > 0) {
            timeMsg = `${minutes}m ${seconds}s remaining`;
        } else {
            timeMsg = `${seconds}s remaining`;
        }

        console.log(chalk.yellow(`Deadline not passed yet! ${timeMsg}`));
        return;
      }

      console.log(chalk.cyan("Asset:"), signal.asset);
      console.log(chalk.cyan("Target:"), `$${signal.targetPrice}`);
      console.log(chalk.cyan("Direction:"), signal.direction == 0 ? "Bullish" : "Bearish");

      const spinner = ora("Checking price with Chainlink oracle...").start();

      const tx = await contract.resolveSignal(signalId, {
        gasLimit: 300000
      });

      spinner.text = "Waiting for confirmation...";
      await tx.wait();

      // Get updated signal
      const updatedSignal = await contract.signals(signalId);
      
      spinner.succeed(chalk.green("Signal resolved!"));
      
      console.log(chalk.cyan("\nResult:"));
      console.log(chalk.cyan("Status:"), "Resolved");
      console.log(
        updatedSignal.isCorrect 
          ? chalk.green("Prediction was CORRECT!") 
          : chalk.red("Prediction was INCORRECT")
      );
      console.log(chalk.cyan("Transaction:"), `https://sepolia.etherscan.io/tx/${tx.hash}`);

      // Show updated trader stats
      const stats = await contract.traderStats(signal.trader);
      const winRate = ((Number(stats.correctSignals) / Number(stats.totalSignals)) * 100).toFixed(2);
      console.log(chalk.cyan("\nTrader Stats Updated:"));
      console.log(chalk.cyan("Win Rate:"), `${winRate}%`);

    } catch (error) {
      console.error(chalk.red("\nError:"), error.message);
    }
  });

program.parse();