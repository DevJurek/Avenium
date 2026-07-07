require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY, POLYGON_RPC_URL, POLYGON_AMOY_RPC_URL } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000000,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    polygon: {
      url: POLYGON_RPC_URL || "",
      chainId: 137,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    amoy: {
      url: POLYGON_AMOY_RPC_URL || "",
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
