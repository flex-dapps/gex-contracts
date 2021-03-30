import chai from 'chai'
import { deployContract, solidity } from 'ethereum-waffle'
import { Contract, Wallet } from 'ethers'
import GEX from '../build/GEX.json'

chai.use(solidity)

interface GexFixture {
    gex: Contract
}

export async function gexFixture([deployer, gexWallet]: Wallet[]): Promise<GexFixture> {
    const gex = await deployContract(deployer, GEX, [gexWallet.address])
    return { gex }
}
