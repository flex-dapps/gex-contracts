// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "./interfaces/IGEX.sol";

/**
 * Note: for non-demo scenarios, 'ERC1155Burnable' should be changed to 'ERC1155'.
 */
contract GEX is ERC1155Burnable, IGEX {
    uint256 public constant override PROTOCOL_FEE = 200; // 2% (divide by 10,000)
    // solhint-disable-next-line var-name-mixedcase
    address payable public immutable override GEX_WALLET;

    mapping(string => uint256) private _ipfsHashToOwnerTokenId;
    mapping(uint256 => string) private _ownerTokenIdToIpfsHash;
    mapping(uint256 => uint256) private _licenseTokenIdToEthCost;
    mapping(uint256 => uint256) private _licenseTokenIdToRemainingLicenses;
    uint256 private _nextId = 1;

    // Empty string argument is provided for ERC1155 because ID-substitution URIs do not exist for IPFS hashes.
    constructor(address payable _gexWallet) public ERC1155("") {
        require(_gexWallet != address(0), "zero address");
        GEX_WALLET = _gexWallet;
    }

    function mint(
        bool _isGame,
        string memory _ipfsHash,
        uint256 _licenseQty,
        uint256 _ethCostPerLicense
    ) external override {
        require(_licenseQty > 0, "license quantity = 0");
        require(_ethCostPerLicense > 0, "ETH cost per license = 0");
        require(isUnmintedIpfsHash(_ipfsHash), "already minted for IPFS hash");
        _ipfsHashToOwnerTokenId[_ipfsHash] = _nextId;
        _ownerTokenIdToIpfsHash[_nextId] = _ipfsHash;

        // Mint the owner token (owned by caller).
        _mint(_msgSender(), _nextId, 1, "");
        emit Mint(_msgSender(), _nextId, _licenseQty, _ethCostPerLicense, _isGame, _ipfsHash);
        _nextId = _nextId.add(1);

        // Store the license cost and quantity.
        _licenseTokenIdToEthCost[_nextId] = _ethCostPerLicense;
        _licenseTokenIdToRemainingLicenses[_nextId] = _licenseQty;
        _nextId = _nextId.add(1);
    }

    function purchaseLicense(uint256 _licenseTokenId, address payable _ownerTokenOwner)
        external
        payable
        override
    {
        require(isLicenseTokenId(_licenseTokenId), "not a license token id");
        require(
            balanceOf(_ownerTokenOwner, licenseTokenIdToOwnerTokenId(_licenseTokenId)) == 1,
            "incorrect owner address"
        );
        require(
            msg.value == _licenseTokenIdToEthCost[_licenseTokenId],
            "incorrect ETH payment amount"
        );
        require(_licenseTokenIdToRemainingLicenses[_licenseTokenId] > 0, "all licenses sold");
        require(balanceOf(_msgSender(), _licenseTokenId) == 0, "already own license");

        // Distribute ETH
        uint256 protocolFeeAmount = msg.value.mul(PROTOCOL_FEE).div(10000);
        GEX_WALLET.transfer(protocolFeeAmount);
        _ownerTokenOwner.transfer(msg.value.sub(protocolFeeAmount));

        // Mint License Token for Purchaser
        _licenseTokenIdToRemainingLicenses[_licenseTokenId] = _licenseTokenIdToRemainingLicenses[
            _licenseTokenId
        ]
            .sub(1);
        _mint(_msgSender(), _licenseTokenId, 1, "");
    }

    function ownerTokenCount() external view override returns (uint256) {
        // Id is incremented by two (one for owner id, one for license id) per mint.
        return _nextId.div(2);
    }

    function isUnmintedIpfsHash(string memory _ipfsHash) public view override returns (bool) {
        require(bytes(_ipfsHash).length > 0, "empty string");
        return _ipfsHashToOwnerTokenId[_ipfsHash] == 0;
    }

    function isLicenseTokenId(uint256 _tokenId) public view override returns (bool) {
        require(_tokenId > 0, "invalid token id (zero)");
        require(_tokenId < _nextId, "invalid token id");
        // The id number of a license token is always even.
        return _tokenId % 2 == 0;
    }

    function licenseTokenIdToOwnerTokenId(uint256 _licenseTokenId)
        public
        view
        override
        returns (uint256)
    {
        require(isLicenseTokenId(_licenseTokenId), "not a license token id");
        return _licenseTokenId.sub(1);
    }

    function ipfsHashToOwnerTokenId(string memory _ipfsHash)
        external
        view
        override
        returns (uint256)
    {
        require(bytes(_ipfsHash).length > 0, "empty string");
        require(_ipfsHashToOwnerTokenId[_ipfsHash] != 0, "no owner token for hash");
        return _ipfsHashToOwnerTokenId[_ipfsHash];
    }

    function ownerTokenIdToIpfsHash(uint256 _ownerTokenId)
        external
        view
        override
        returns (string memory)
    {
        require(!isLicenseTokenId(_ownerTokenId), "not an owner token id");
        return _ownerTokenIdToIpfsHash[_ownerTokenId];
    }

    function licenseTokenIdToEthCost(uint256 _licenseTokenId)
        external
        view
        override
        returns (uint256)
    {
        require(isLicenseTokenId(_licenseTokenId), "not a license token id");
        return _licenseTokenIdToEthCost[_licenseTokenId];
    }

    function licenseTokenIdToRemainingLicenses(uint256 _licenseTokenId)
        external
        view
        override
        returns (uint256)
    {
        require(isLicenseTokenId(_licenseTokenId), "not a license token id");
        return _licenseTokenIdToRemainingLicenses[_licenseTokenId];
    }

    function ownerTokenIdToLicenseTokenId(uint256 _ownerTokenId)
        external
        view
        override
        returns (uint256)
    {
        require(!isLicenseTokenId(_ownerTokenId), "not an owner token id");
        return _ownerTokenId.add(1);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external override returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external override returns (bytes4) {
        return
            bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
    }

    // Modified to add check that `_to` doesn't own the token yet.
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) public virtual override(ERC1155, IERC1155) {
        require(_amount == 0 || balanceOf(_to, _id) == 0, "token already owned");
        super.safeTransferFrom(_from, _to, _id, _amount, _data);
    }

    // Modified to add check that `_to` doesn't own the tokens yet.
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) public virtual override(ERC1155, IERC1155) {
        for (uint256 i = 0; i < _ids.length; ++i) {
            uint256 _id = _ids[i];
            uint256 _amount = _amounts[i];
            require(_amount == 0 || balanceOf(_to, _id) == 0, "token already owned");
        }
        super.safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
    }

    function _mint(
        address _account,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) internal override {
        require(balanceOf(_account, _id) == 0, "already own token");
        ERC1155._mint(_account, _id, _amount, _data);
    }
}
