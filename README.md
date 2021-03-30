# Gheedra GEX

These files contain the smart contract code and associated tests for Gheedra's GEX platform.

### Run Tests

`yarn t`

### Run Contract Tests & Get Callstacks

In one terminal run `yarn buidler node`

Then in another run `yarn t`

### Deploy Locally

First start up a server: `yarn buidler node`
Then run (in a different terminal tab): `yarn deploy`

### Deploy to Ethereum

Create/modify network config in `buidler.config.ts` and add API key and private key, then run:

`yarn buidler run --network goerli scripts/deploy.ts`

### Verify on Etherscan

Add Etherscan API key to `buidler.config.ts`, then run:

`yarn buidler verify-contract --contract-name <CONTRACT_NAME> --address <DEPLOYED_ADDRESS>`

### The Graph

1. https://thegraph.com/docs/deploy-a-subgraph#create-a-graph-explorer-account

2. https://thegraph.com/docs/deploy-a-subgraph#store-the-access-token

3. https://thegraph.com/docs/deploy-a-subgraph#create-the-subgraph (subgraph name could be `gex-goerli-v1`)

4. Update `repository`, `address` and `startBlock` (set to just before contract deployment block) in `subgraph.yaml`

5. Code generation (run after changes to GraphQL schema or contract ABIs): `yarn graph codegen`

6. Build (final step before deployment): `yarn graph build`

7. Run `graph deploy <SUBGRAPH_NAME> --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/`
