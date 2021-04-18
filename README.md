# Gheedra GEX

These files contain the smart contract code and associated tests for Gheedra's GEX platform.

## Contract Deployment

### Run Tests

1. In a terminal window run `yarn t`

### Run Contract Tests & Get Callstacks

1. In one terminal run `yarn buidler node`  
2. Then in another run `yarn t`

### Deploy Locally

1. First start up a server: `yarn buidler node`  
2. Then run (in a different terminal tab): `yarn deploy`

### Deploy to Ethereum

1. Create/modify network config in `buidler.config.ts` and add API key and private key  
2. Run `yarn buidler run --network goerli scripts/deploy.ts`

### Verify on Etherscan

1. Add Etherscan API key to `buidler.config.ts`  
2. Run `yarn buidler verify-contract --contract-name <CONTRACT_NAME> --address <DEPLOYED_ADDRESS>`  


## The Graph Deployment

This process deploys the GEX subgraph to The Graph

### 1. Update config
In `subgraph.yaml`, update the following

1. Set `repository` to your github repository (must be public for the deployment only)  
2. Set `address` to the address where the contract is deployed  
3. Set `startBlock` to 1 block before contract deployment

> Note: your subgraph github repository must be public for deployment, but can be set back to private once deployed

### 2. Build locally
1. Code generation (run after changes to GraphQL schema or contract ABIs): `yarn graph codegen`  
2. Build (final step before deployment): `yarn graph build`  

### 3. Set your access token
1. Login to [The Graph](https://thegraph.com) and retrieve your **access token**  
2. Run `graph auth https://api.thegraph.com/deploy/ <YOUR ACCESS TOKEN>` to **authorize deployment**  

### 4. Deploy
1. Run `graph deploy <SUBGRAPH_NAME> --ipfs https://api.thegraph.com/ipfs/ --node https://api.thegraph.com/deploy/` to deploy the graph  
 


> For more information about deploying the graph:  
> https://thegraph.com/docs/deploy-a-subgraph#create-a-graph-explorer-account   
> https://thegraph.com/docs/deploy-a-subgraph#store-the-access-token    
> https://thegraph.com/docs/deploy-a-subgraph#create-the-subgraph  