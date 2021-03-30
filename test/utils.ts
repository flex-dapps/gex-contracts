import { BigNumber, providers } from 'ethers'

export const AddressZero = '0x0000000000000000000000000000000000000000'
export const JunkAddress = '0x0000000000000000000000000000000000000001'

export function expandToDecimals(n: number, decimals: number): BigNumber {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(decimals))
}

export function expandTo6Decimals(n: number): BigNumber {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(6))
}

export function expandTo18Decimals(n: number): BigNumber {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

export async function mineBlocks(provider: providers.Web3Provider, blocks: number): Promise<void> {
    for (let i = 0; i < blocks; i++) {
        await provider.send('evm_mine', [])
    }
}

export async function mineBlock(
    provider: providers.Web3Provider,
    timestamp: number
): Promise<void> {
    return provider.send('evm_mine', [timestamp])
}
