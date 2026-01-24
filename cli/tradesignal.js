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

program.parse();