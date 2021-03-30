// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";

interface IGEX is IERC1155, IERC1155Receiver {
    /**
     * @dev Emitted when an Owner Token is minted.
     */
    event Mint(
        address indexed to,
        uint256 ownerTokenId,
        uint256 licenseQty,
        uint256 ethCostPerLicense,
        bool isGame,
        string ipfsHash
    );

    /**
     * Mints an Owner Token corresponding to the `_ipfsHash` for the caller, and the license information will be stored.
     * `_isGame` is true if minting a game token, or false for an asset token.
     * `_isGame` will not be stored, but will be emitted in a Mint event.
     * `_ipfsHash` must be non-empty and not previously used for minting.
     * `_licenseQty` and `_ethCostPerLicense` must both be positive.
     */
    function mint(
        bool _isGame,
        string memory _ipfsHash,
        uint256 _licenseQty,
        uint256 _ethCostPerLicense
    ) external;

    /**
     * Purchases (mints) a License Token with id `_licenseTokenId` for the caller.
     * `GEX_WALLET` will receive `PROTOCOL_FEE`% of the ETH amount, and the remainder is sent to `_ownerTokenOwner`.
     * The exact ETH amount (`licenseTokenIdToEthCost(_licenseTokenId)`) must be sent with the function call.
     * There must be enough licenses remaining (`licenseTokenIdToRemainingLicenses(_licenseTokenId)`).
     * The owner of the Owner Token corresponding to `_licenseTokenId` must be found by the client via emitted events,
     * since it isn't stored on-chain.
     */
    function purchaseLicense(uint256 _licenseTokenId, address payable _ownerTokenOwner)
        external
        payable;

    /**
     * The protocol fee for license purchases.
     * Needs to be divided by 10,000.
     * E.g. if the value is 123, this is a 123 / 10000 = 0.0123 = 1.23% protocol fee.
     */
    // solhint-disable-next-line func-name-mixedcase
    function PROTOCOL_FEE() external view returns (uint256);

    /**
     * The recipient address for the `PROTOCOL_FEE`.
     */
    // solhint-disable-next-line func-name-mixedcase
    function GEX_WALLET() external view returns (address payable);

    /**
     * The number of Owner Tokens that have been minted.
     */
    function ownerTokenCount() external view returns (uint256);

    /**
     * Checks whether `_ipfsHash` has been used in `mint()` yet.
     */
    function isUnmintedIpfsHash(string memory _ipfsHash) external view returns (bool);

    /**
     * Checks whether `_tokenId` is a License Token id.
     * If it isn't a License Token, it's an Owner Token.
     */
    function isLicenseTokenId(uint256 _tokenId) external view returns (bool);

    /**
     * Gets the License Token id corresponding to `_ownerTokenId`.
     * The Owner Token must already be minted.
     */
    function ownerTokenIdToLicenseTokenId(uint256 _ownerTokenId) external view returns (uint256);

    /**
     * Gets the Owner Token id corresponding to `_licenseTokenId`.
     * The Owner Token must already be minted.
     */
    function licenseTokenIdToOwnerTokenId(uint256 _licenseTokenId) external view returns (uint256);

    /**
     * Gets the Owner Token id corresponding to `_ipfsHash`.
     * The Owner Token must already be minted.
     */
    function ipfsHashToOwnerTokenId(string memory _ipfsHash) external view returns (uint256);

    /**
     * Gets the IPFS hash corresponding to `_ownerTokenId`.
     * The Owner Token must already be minted.
     */
    function ownerTokenIdToIpfsHash(uint256 _ownerTokenId) external view returns (string memory);

    /**
     * Gets the number of remaining licenses for `_licenseTokenId`.
     * The corresponding Owner Token must already be minted.
     */
    function licenseTokenIdToRemainingLicenses(uint256 _licenseTokenId)
        external
        view
        returns (uint256);

    /**
     * Gets the ETH cost per license for `_licenseTokenId`.
     * The corresponding Owner Token must already be minted.
     */
    function licenseTokenIdToEthCost(uint256 _licenseTokenId) external view returns (uint256);
}
