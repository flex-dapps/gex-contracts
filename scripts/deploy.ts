import { ethers } from '@nomiclabs/buidler'

async function main() {
    const GEX = await ethers.getContractFactory('GEX')
    // goerli GEX wallet address. if deploying on different network, need to change this
    const gexWalletAddress = '0x7709Ecf6c079afa400C82f554fA24216a53D9a87'
    const gex = await GEX.deploy(gexWalletAddress)
    await gex.deployed()
    console.log('GEX deployed to: ', gex.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
