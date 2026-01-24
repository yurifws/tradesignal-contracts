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
      const direction = answers.direction === "Bullish" ? 0 : 1;

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

program.parse();