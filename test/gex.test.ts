import chai, { assert, expect } from 'chai'
import { createFixtureLoader, MockProvider, solidity } from 'ethereum-waffle'
import { BigNumber } from 'ethers'
import { Gex } from '../typechain'
import { gexFixture } from './fixtures'
import { AddressZero, expandToDecimals } from './utils'

chai.use(solidity)

describe('GEX', () => {
    const provider = new MockProvider({
        ganacheOptions: {
            hardfork: 'istanbul',
            mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
            gasLimit: 9999999,
        },
    })
    const [deployer, player, player2, cc, dev, gexWallet] = provider.getWallets()
    const loadFixture = createFixtureLoader([deployer, gexWallet], provider)
    const ownerTokenId = BigNumber.from(1)
    const licenseTokenId = BigNumber.from(2)
    const licenseQty = BigNumber.from(2)
    const licenseCost = expandToDecimals(5, 16) // 0.05 ETH
    const protocolFee = licenseCost.mul(200).div(10000)
    const ownerTokenId2 = BigNumber.from(3)
    const licenseTokenId2 = BigNumber.from(4)
    const licenseQty2 = BigNumber.from(4)
    const licenseCost2 = expandToDecimals(2, 17) // 0.20 ETH

    let gex: Gex
    beforeEach(async () => {
        const fixture = await loadFixture(gexFixture)
        gex = fixture.gex as Gex
    })

    it('initial values', async () => {
        assert.deepEqual(await gex.PROTOCOL_FEE(), BigNumber.from(200))
        assert.deepEqual(await gex.GEX_WALLET(), gexWallet.address)
        assert.deepEqual(await gex.ownerTokenCount(), BigNumber.from(0))
    })

    describe('mint', async () => {
        it('license quantity = 0', async () => {
            await expect(gex.connect(dev).mint(true, '', 0, 0)).to.be.revertedWith(
                'license quantity = 0'
            )
        })
        it('ETH cost per license = 0', async () => {
            await expect(gex.connect(dev).mint(true, '', licenseQty, 0)).to.be.revertedWith(
                'ETH cost per license = 0'
            )
        })
        it('empty string', async () => {
            await expect(
                gex.connect(dev).mint(true, '', licenseQty, licenseCost)
            ).to.be.revertedWith('empty string')
        })
        it('success', async () => {
            await expect(gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost))
                .to.emit(gex, 'TransferSingle')
                .withArgs(dev.address, AddressZero, dev.address, ownerTokenId, 1)
                .to.emit(gex, 'Mint')
                .withArgs(dev.address, ownerTokenId, licenseQty, licenseCost, true, 'anIpfsHash')

            assert.deepEqual(await gex.ownerTokenCount(), BigNumber.from(1))
            assert.deepEqual(await gex.ipfsHashToOwnerTokenId('anIpfsHash'), ownerTokenId)
            assert.deepEqual(await gex.balanceOf(dev.address, ownerTokenId), BigNumber.from(1))
            assert.deepEqual(await gex.balanceOf(dev.address, licenseTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(gex.address, ownerTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(gex.address, licenseTokenId), BigNumber.from(0))
            assert.deepEqual(
                await gex.licenseTokenIdToRemainingLicenses(licenseTokenId),
                licenseQty
            )
            assert.deepEqual(await gex.licenseTokenIdToEthCost(licenseTokenId), licenseCost)
        })
        it('emits correct isGame bool', async () => {
            await expect(gex.connect(dev).mint(false, 'anIpfsHash', licenseQty, licenseCost))
                .to.emit(gex, 'Mint')
                .withArgs(dev.address, ownerTokenId, licenseQty, licenseCost, false, 'anIpfsHash')
        })
        it('already minted for IPFS hash', async () => {
            await gex.connect(dev).mint(true, 'sameHash', licenseQty, licenseCost)
            await expect(
                gex.connect(dev).mint(true, 'sameHash', licenseQty2, licenseCost2)
            ).to.be.revertedWith('already minted for IPFS hash')
        })
        it('already minted for IPFS hash (different isGame bool)', async () => {
            await gex.connect(dev).mint(true, 'sameHash', licenseQty, licenseCost)
            await expect(
                gex.connect(dev).mint(false, 'sameHash', licenseQty2, licenseCost2)
            ).to.be.revertedWith('already minted for IPFS hash')
        })
        it('already minted for IPFS hash (different user)', async () => {
            await gex.connect(dev).mint(true, 'sameHash', licenseQty, licenseCost)
            await expect(gex.mint(true, 'sameHash', licenseQty2, licenseCost2)).to.be.revertedWith(
                'already minted for IPFS hash'
            )
        })
        it('mint twice (different hashes)', async () => {
            await gex.connect(dev).mint(true, 'ipfsHash1', licenseQty, licenseCost)
            await gex.connect(dev).mint(true, 'ipfsHash2', licenseQty2, licenseCost2)

            assert.deepEqual(await gex.ownerTokenCount(), BigNumber.from(2))
            assert.deepEqual(await gex.ipfsHashToOwnerTokenId('ipfsHash1'), ownerTokenId)
            assert.deepEqual(await gex.ipfsHashToOwnerTokenId('ipfsHash2'), ownerTokenId2)
            assert.deepEqual(await gex.balanceOf(dev.address, ownerTokenId), BigNumber.from(1))
            assert.deepEqual(await gex.balanceOf(dev.address, ownerTokenId2), BigNumber.from(1))
            assert.deepEqual(await gex.balanceOf(dev.address, licenseTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(dev.address, licenseTokenId2), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(gex.address, ownerTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(gex.address, ownerTokenId2), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(gex.address, licenseTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(gex.address, licenseTokenId2), BigNumber.from(0))
            assert.deepEqual(
                await gex.licenseTokenIdToRemainingLicenses(licenseTokenId),
                licenseQty
            )
            assert.deepEqual(
                await gex.licenseTokenIdToRemainingLicenses(licenseTokenId2),
                licenseQty2
            )
            assert.deepEqual(await gex.licenseTokenIdToEthCost(licenseTokenId), licenseCost)
            assert.deepEqual(await gex.licenseTokenIdToEthCost(licenseTokenId2), licenseCost2)
        })
    })

    describe('purchaseLicense', async () => {
        it('invalid token id', async () => {
            try {
                await expect(gex.connect(player).purchaseLicense(licenseTokenId, dev.address)).to
                    .be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id')
            }
        })
        it('invalid token id (zero)', async () => {
            try {
                await expect(gex.connect(player).purchaseLicense(0, dev.address)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id (zero)')
            }
        })
        it('invalid token id (zero, after minting)', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            try {
                await expect(gex.connect(player).purchaseLicense(0, dev.address)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id (zero)')
            }
        })
        it('not a license token id', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await expect(
                gex.connect(player).purchaseLicense(ownerTokenId, dev.address)
            ).to.be.revertedWith('not a license token id')
        })
        it('incorrect owner address', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await expect(
                gex.connect(player).purchaseLicense(licenseTokenId, cc.address)
            ).to.be.revertedWith('incorrect owner address')
        })
        it('incorrect ETH payment amount (zero)', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await expect(
                gex.connect(player).purchaseLicense(licenseTokenId, dev.address)
            ).to.be.revertedWith('incorrect ETH payment amount')
        })
        it('incorrect ETH payment amount (not enough)', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await expect(
                gex
                    .connect(player)
                    .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost.sub(1) })
            ).to.be.revertedWith('incorrect ETH payment amount')
        })
        it('incorrect ETH payment amount (too much)', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await expect(
                gex
                    .connect(player)
                    .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost.add(1) })
            ).to.be.revertedWith('incorrect ETH payment amount')
        })
        it('all licenses sold', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', 1, licenseCost)
            await gex
                .connect(player)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost })
            await expect(
                gex
                    .connect(player)
                    .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost })
            ).to.be.revertedWith('all licenses sold')
        })
        it('already own license', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)

            await gex
                .connect(player)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost, gasPrice: 0 })
            await expect(
                gex.connect(player).purchaseLicense(licenseTokenId, dev.address, {
                    value: licenseCost,
                    gasPrice: 0,
                })
            ).to.be.revertedWith('already own license')
        })
        it('success', async () => {
            assert.deepEqual(
                await gex.balanceOf(player.address, licenseTokenId),
                BigNumber.from(0)
            )
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            const devInitialBalance = await dev.getBalance()
            const gexInitialBalance = await gexWallet.getBalance()
            const playerInitialBalance = await player.getBalance()

            await expect(
                gex.connect(player).purchaseLicense(licenseTokenId, dev.address, {
                    value: licenseCost,
                    gasPrice: 0,
                })
            )
                .to.emit(gex, 'TransferSingle')
                .withArgs(player.address, AddressZero, player.address, licenseTokenId, 1)

            assert.deepEqual(await gex.ownerTokenCount(), BigNumber.from(1))
            assert.deepEqual(await gex.balanceOf(dev.address, ownerTokenId), BigNumber.from(1))
            assert.deepEqual(await gex.balanceOf(dev.address, licenseTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(player.address, ownerTokenId), BigNumber.from(0))
            assert.deepEqual(
                await gex.balanceOf(player.address, licenseTokenId),
                BigNumber.from(1)
            )
            assert.deepEqual(await gex.balanceOf(gex.address, ownerTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(gex.address, licenseTokenId), BigNumber.from(0))
            assert.deepEqual(
                await gex.licenseTokenIdToRemainingLicenses(licenseTokenId),
                licenseQty.sub(1)
            )
            assert.deepEqual(await gex.licenseTokenIdToEthCost(licenseTokenId), licenseCost)
            assert.deepEqual(await player.getBalance(), playerInitialBalance.sub(licenseCost))
            assert.deepEqual(
                await dev.getBalance(),
                devInitialBalance.add(licenseCost).sub(protocolFee)
            )
            assert.deepEqual(await gexWallet.getBalance(), gexInitialBalance.add(protocolFee))
        })
        it('success (two different purchasers)', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            const devInitialBalance = await dev.getBalance()
            const gexInitialBalance = await gexWallet.getBalance()
            const playerInitialBalance = await player.getBalance()
            const player2InitialBalance = await player2.getBalance()

            await gex
                .connect(player)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost, gasPrice: 0 })
            await gex
                .connect(player2)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost, gasPrice: 0 })

            assert.deepEqual(await gex.ownerTokenCount(), BigNumber.from(1))
            assert.deepEqual(await gex.balanceOf(dev.address, ownerTokenId), BigNumber.from(1))
            assert.deepEqual(await gex.balanceOf(dev.address, licenseTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(player.address, ownerTokenId), BigNumber.from(0))
            assert.deepEqual(
                await gex.balanceOf(player.address, licenseTokenId),
                BigNumber.from(1)
            )
            assert.deepEqual(
                await gex.balanceOf(player2.address, licenseTokenId),
                BigNumber.from(1)
            )
            assert.deepEqual(await gex.balanceOf(gex.address, ownerTokenId), BigNumber.from(0))
            assert.deepEqual(await gex.balanceOf(gex.address, licenseTokenId), BigNumber.from(0))
            assert.deepEqual(
                await gex.licenseTokenIdToRemainingLicenses(licenseTokenId),
                licenseQty.sub(2)
            )
            assert.deepEqual(await gex.licenseTokenIdToEthCost(licenseTokenId), licenseCost)
            assert.deepEqual(await player.getBalance(), playerInitialBalance.sub(licenseCost))
            assert.deepEqual(await player.getBalance(), player2InitialBalance.sub(licenseCost))
            assert.deepEqual(
                await dev.getBalance(),
                devInitialBalance.add(licenseCost.mul(2)).sub(protocolFee.mul(2))
            )
            assert.deepEqual(
                await gexWallet.getBalance(),
                gexInitialBalance.add(protocolFee.mul(2))
            )
        })
    })

    describe('safeTransferFrom', async () => {
        it('not already owned by recipient', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await gex
                .connect(player)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost, gasPrice: 0 })

            await gex
                .connect(player)
                .safeTransferFrom(player.address, dev.address, licenseTokenId, 1, [])
        })
        it('already owned by recipient', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await gex
                .connect(player)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost, gasPrice: 0 })
            await gex
                .connect(dev)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost, gasPrice: 0 })

            await expect(
                gex
                    .connect(player)
                    .safeTransferFrom(player.address, dev.address, licenseTokenId, 1, [])
            ).to.be.revertedWith('token already owned')
        })
    })

    describe('safeBatchTransferFrom', async () => {
        it('not already owned by recipient', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash1', licenseQty, licenseCost)
            await gex.connect(dev).mint(true, 'anIpfsHash2', licenseQty2, licenseCost2)
            await gex
                .connect(player)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost, gasPrice: 0 })
            await gex.connect(player).purchaseLicense(licenseTokenId2, dev.address, {
                value: licenseCost2,
                gasPrice: 0,
            })

            await gex
                .connect(player)
                .safeBatchTransferFrom(
                    player.address,
                    dev.address,
                    [licenseTokenId, licenseTokenId2],
                    [1, 1],
                    []
                )
        })
        it('already owned by recipient', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash1', licenseQty, licenseCost)
            await gex.connect(dev).mint(true, 'anIpfsHash2', licenseQty2, licenseCost2)
            await gex
                .connect(player)
                .purchaseLicense(licenseTokenId, dev.address, { value: licenseCost, gasPrice: 0 })
            await gex.connect(player).purchaseLicense(licenseTokenId2, dev.address, {
                value: licenseCost2,
                gasPrice: 0,
            })
            await gex.connect(dev).purchaseLicense(licenseTokenId2, dev.address, {
                value: licenseCost2,
                gasPrice: 0,
            })

            await expect(
                gex
                    .connect(player)
                    .safeBatchTransferFrom(
                        player.address,
                        dev.address,
                        [licenseTokenId, licenseTokenId2],
                        [1, 1],
                        []
                    )
            ).to.be.revertedWith('token already owned')
        })
    })

    describe('isUnmintedIpfsHash', async () => {
        it('empty string', async () => {
            await expect(gex.isUnmintedIpfsHash('')).to.be.revertedWith('empty string')
        })
        it('unminted ipfs hash', async () => {
            assert.isTrue(await gex.isUnmintedIpfsHash('anIpfsHash'))
        })
        it('minted ipfs hash', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            assert.isFalse(await gex.isUnmintedIpfsHash('anIpfsHash'))
        })
    })

    describe('isLicenseTokenId', async () => {
        it('invalid token id (zero)', async () => {
            try {
                await expect(gex.isLicenseTokenId(0)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id (zero)')
            }
        })
        it('invalid token id (one)', async () => {
            try {
                await expect(gex.isLicenseTokenId(1)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id')
            }
        })
        it('invalid token id (zero, after minting)', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            try {
                await expect(gex.isLicenseTokenId(0)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id (zero)')
            }
        })
        it('owner token', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            assert.isFalse(await gex.isLicenseTokenId(1))
        })
        it('license token', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            assert.isTrue(await gex.isLicenseTokenId(2))
        })
    })

    describe('licenseTokenIdToOwnerTokenId', async () => {
        it('invalid token id', async () => {
            try {
                await expect(gex.licenseTokenIdToOwnerTokenId(licenseTokenId)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id')
            }
        })
        it('not a license token id', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await expect(gex.licenseTokenIdToOwnerTokenId(ownerTokenId)).to.be.revertedWith(
                'not a license token id'
            )
        })
        it('success', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            assert.deepEqual(await gex.licenseTokenIdToOwnerTokenId(licenseTokenId), ownerTokenId)
        })
    })

    describe('ipfsHashToOwnerTokenId', async () => {
        it('empty string', async () => {
            await expect(gex.ipfsHashToOwnerTokenId('')).to.be.revertedWith('empty string')
        })
        it('no owner token for hash', async () => {
            await expect(gex.ipfsHashToOwnerTokenId('anIpfsHash')).to.be.revertedWith(
                'no owner token for hash'
            )
        })
        it('success', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            assert.deepEqual(await gex.ipfsHashToOwnerTokenId('anIpfsHash'), ownerTokenId)
        })
    })

    describe('ownerTokenIdToIpfsHash', async () => {
        it('invalid token id', async () => {
            try {
                await expect(gex.ownerTokenIdToIpfsHash(ownerTokenId)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id')
            }
        })
        it('not an owner token id', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await expect(gex.ownerTokenIdToIpfsHash(licenseTokenId)).to.be.revertedWith(
                'not an owner token id'
            )
        })
        it('success', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            assert.equal(await gex.ownerTokenIdToIpfsHash(ownerTokenId), 'anIpfsHash')
        })
    })

    describe('licenseTokenIdToEthCost', async () => {
        it('invalid token id', async () => {
            try {
                await expect(gex.licenseTokenIdToEthCost(ownerTokenId)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id')
            }
        })
        it('success', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            assert.deepEqual(await gex.licenseTokenIdToEthCost(licenseTokenId), licenseCost)
        })
    })

    describe('ownerTokenIdToLicenseTokenId', async () => {
        it('invalid token id', async () => {
            try {
                await expect(gex.ownerTokenIdToLicenseTokenId(ownerTokenId)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id')
            }
        })
        it('invalid token id (zero)', async () => {
            try {
                await expect(gex.ownerTokenIdToLicenseTokenId(0)).to.be.reverted
            } catch (error) {
                expect(error).to.not.be.null
                expect(error.message).to.contain('invalid token id (zero)')
            }
        })
        it('not an owner token id', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            await expect(gex.ownerTokenIdToLicenseTokenId(licenseTokenId)).to.be.revertedWith(
                'not an owner token id'
            )
        })
        it('success', async () => {
            await gex.connect(dev).mint(true, 'anIpfsHash', licenseQty, licenseCost)
            assert.deepEqual(await gex.ownerTokenIdToLicenseTokenId(ownerTokenId), licenseTokenId)
        })
    })
})
