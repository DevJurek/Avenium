// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Skybit (SKY)
/// @notice Fixed-supply ERC-20 token: 21,000,000 SKY minted once to the deployer.
contract Skybit is ERC20 {
    // Całkowita podaż: 21 mln tokenów z 18 miejscami po przecinku (standard ERC-20).
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10 ** 18;

    constructor() ERC20("Skybit", "SKY") {
        // Mint całej puli do adresu wdrażającego kontrakt (msg.sender).
        // Po deployment nie ma dodatkowych funkcji mint/burn, więc podaż jest stała.
        _mint(msg.sender, MAX_SUPPLY);
    }
}
