// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Avenium (AVEN)
/// @notice Minimal fixed-supply ERC-20 with 0.5% transfer fee.
contract Avenium {
    string public constant name = "Avenium";
    string public constant symbol = "AVEN";
    uint8 public constant decimals = 18;

    uint256 public immutable totalSupply;
    address public constant feeRecipient = 0x2eb17e0C5E8e5b4fD85768695E2aC37927A84270;
    uint16 public constant feeBps = 50;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InsufficientBalance();
    error InsufficientAllowance();
    error InvalidRecipient();

    constructor() {
        uint256 supply = 21_000_000 * 10 ** uint256(decimals);
        totalSupply = supply;
        balanceOf[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        if (currentAllowance < amount) revert InsufficientAllowance();
        if (currentAllowance != type(uint256).max) {
            unchecked {
                allowance[from][msg.sender] = currentAllowance - amount;
            }
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert InvalidRecipient();

        uint256 fromBalance = balanceOf[from];
        if (fromBalance < amount) revert InsufficientBalance();

        uint256 fee = (amount * feeBps) / 10_000;
        uint256 net = amount - fee;

        unchecked {
            balanceOf[from] = fromBalance - amount;
            balanceOf[to] += net;
            if (fee != 0) {
                balanceOf[feeRecipient] += fee;
            }
        }

        emit Transfer(from, to, net);
        if (fee != 0) {
            emit Transfer(from, feeRecipient, fee);
        }
    }
}
