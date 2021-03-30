import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@nomiclabs/buidler-etherscan");
usePlugin("buidler-typechain");
usePlugin("buidler-contract-sizer");
usePlugin("buidler-gas-reporter");
usePlugin("solidity-coverage");

const INFURA_API_KEY = "20d6fd8ba3b24137bc329559f5ed022d";
const GOERLI_PRIVATE_KEY = "0xaa1ad593bc79ab24c01fa657c5e88d8ac03c28e1c31ecdba50944245aeffcc09";

const config: BuidlerConfig = {
  defaultNetwork: 'buidlerevm',
  solc: {
    version: '0.6.12',
    optimizer: {
      enabled: true,
      runs: 9999
    }
  },
  paths: {
    artifacts: './build',
  },
  networks: {
    buidlerevm: {
      blockGasLimit: 9000000,
      gasPrice: 0,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY],
    },
    coverage: {
      url: 'http://127.0.0.1:8555', // Coverage launches its own ganache-cli client
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  contractSizer: {
    alphasort: true,
    runOnCompile: false,
  },
}

export default config;
