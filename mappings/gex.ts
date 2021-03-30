import { Address, BigDecimal, BigInt, store } from '@graphprotocol/graph-ts'
import { GEX, Mint, TransferBatch, TransferSingle } from '../generated/GEX/GEX'
import { Holder, HolderLicenseToken, LicenseToken, OwnerToken } from '../generated/schema'

export function handleMint(event: Mint): void {
    let toAddress = event.params.to.toHexString()
    let ownerTokenId = event.params.ownerTokenId.toString()
    let ownerToken = new OwnerToken(ownerTokenId)
    ownerToken.isGame = event.params.isGame
    ownerToken.ipfsHash = event.params.ipfsHash
    ownerToken.holder = toAddress
    ownerToken.save()
    let licenseToken = new LicenseToken(event.params.ownerTokenId.plus(oneBigInt()).toString())
    licenseToken.ownerToken = ownerTokenId
    licenseToken.price = convertEthToDecimal(event.params.ethCostPerLicense)
    licenseToken.remainingLicenses = event.params.licenseQty
    licenseToken.save()
    let holder = Holder.load(toAddress)
    if (holder == null) {
        holder = new Holder(toAddress)
        holder.save()
    }
}

export function handleTransferSingle(event: TransferSingle): void {
    updateHolder(event.params.id, event.params.from, event.params.to, event.address)
}

export function handleTransferBatch(event: TransferBatch): void {
    let tokenIds = event.params.ids
    for (let i = 0; i < tokenIds.length; i++) {
        updateHolder(tokenIds[i], event.params.from, event.params.to, event.address)
    }
}

function updateHolder(
    tokenId: BigInt,
    oldOwnerAddress: Address,
    newOwnerAddress: Address,
    contractAddress: Address
): void {
    if (oldOwnerAddress == newOwnerAddress) return
    if (isOwnerToken(tokenId)) {
        // handleMint() handles owner token minting
        if (isZeroAddress(oldOwnerAddress)) return
        let ownerToken = OwnerToken.load(tokenId.toString())
        ownerToken.holder = newOwnerAddress.toHexString()
        ownerToken.save()
    } else {
        // license token case
        // remove from old owner if exists
        let oldHolderLicenseTokenId = tokenId
            .toString()
            .concat('-')
            .concat(oldOwnerAddress.toHexString())
        if (HolderLicenseToken.load(oldHolderLicenseTokenId) != null) {
            store.remove('HolderLicenseToken', oldHolderLicenseTokenId)
        }
        // create for new owner
        let newHolderLicenseTokenId = tokenId
            .toString()
            .concat('-')
            .concat(newOwnerAddress.toHexString())
        let newHolderLicenseToken = new HolderLicenseToken(newHolderLicenseTokenId)
        newHolderLicenseToken.holder = newOwnerAddress.toHexString()
        newHolderLicenseToken.licenseToken = tokenId.toString()
        newHolderLicenseToken.save()
        // update number of remaining licenses
        let licenseToken = LicenseToken.load(tokenId.toString())
        let gexContract = GEX.bind(contractAddress)
        licenseToken.remainingLicenses = gexContract.licenseTokenIdToRemainingLicenses(tokenId)
        licenseToken.save()
    }
}

function isOwnerToken(tokenId: BigInt): boolean {
    // odd = owner token, even = license token
    return parseInt(tokenId.toString()) % 2 != 0
}

function isZeroAddress(value: Address): boolean {
    return value.toHexString() == '0x0000000000000000000000000000000000000000'
}

function exponentToBigDecimal(decimals: number): BigDecimal {
    let bd = BigDecimal.fromString('1')
    for (let i = 0; i < decimals; i++) {
        bd = bd.times(BigDecimal.fromString('10'))
    }
    return bd
}

function convertEthToDecimal(eth: BigInt): BigDecimal {
    return eth.toBigDecimal().div(exponentToBigDecimal(18))
}

function oneBigInt(): BigInt {
    return BigInt.fromI32(1)
}
