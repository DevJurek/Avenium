// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IAveniumFeeToken is IERC20 {
    function feeBps() external view returns (uint16);
}

/// @title Avenium Claim
/// @notice Merkle-based claim contract for user-paid airdrops.
contract AveniumClaim {
    IAveniumFeeToken public immutable avenium;
    bytes32 public merkleRoot;
    address public owner;

    mapping(address => bool) public claimed;

    event Claimed(address indexed account, uint256 amount);
    event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    error NotOwner();
    error AlreadyClaimed();
    error InvalidProof();
    error ZeroAddress();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address tokenAddress, bytes32 root) {
        if (tokenAddress == address(0)) revert ZeroAddress();
        avenium = IAveniumFeeToken(tokenAddress);
        merkleRoot = root;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {
        if (claimed[msg.sender]) revert AlreadyClaimed();

        bytes32 leaf = keccak256(abi.encode(msg.sender, amount));
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert InvalidProof();

        claimed[msg.sender] = true;

        uint256 grossAmount = _grossUp(amount);
        if (!avenium.transfer(msg.sender, grossAmount)) revert TransferFailed();

        emit Claimed(msg.sender, amount);
    }

    function updateMerkleRoot(bytes32 newRoot) external onlyOwner {
        emit MerkleRootUpdated(merkleRoot, newRoot);
        merkleRoot = newRoot;
    }

    function recoverTokens(address to, uint256 amount) external onlyOwner {
        if (!avenium.transfer(to, amount)) revert TransferFailed();
    }

    function _grossUp(uint256 netAmount) internal view returns (uint256) {
        uint256 bps = avenium.feeBps();
        if (bps == 0) return netAmount;

        uint256 denominator = 10_000 - bps;
        return ((netAmount * 10_000) + denominator - 1) / denominator;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
