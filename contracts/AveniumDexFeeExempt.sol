// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Avenium (AVEN) with DEX fee exemption
/// @notice Charges 0.5% on regular wallet transfers, while configured DEX
///         pair addresses can be exempted from the token fee.
contract AveniumDexFeeExempt is ERC20, Ownable {
    uint16 public constant feeBps = 50;
    uint256 public constant INITIAL_SUPPLY = 21_000_000 ether;
    address public constant feeRecipient = 0x2eb17e0C5E8e5b4fD85768695E2aC37927A84270;

    mapping(address => bool) public feeExempt;

    event FeeExemptionUpdated(address indexed account, bool exempt);

    constructor() ERC20("Avenium", "AVEN") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function setFeeExempt(address account, bool exempt) external onlyOwner {
        feeExempt[account] = exempt;
        emit FeeExemptionUpdated(account, exempt);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0) || to == address(0) || feeExempt[from] || feeExempt[to]) {
            super._update(from, to, value);
            return;
        }

        uint256 fee = (value * feeBps) / 10_000;
        super._update(from, to, value - fee);
        if (fee != 0) super._update(from, feeRecipient, fee);
    }
}
