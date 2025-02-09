// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Bounty Contract
/// @notice This contract allows the owner to withdraw ERC20 tokens and Ether from the contract.
/// It is designed to manage funds for a bounty program.
contract Bounty is Ownable {
    ///////////////////////////////// events /////////////////////////////////

    /// @notice Emitted when tokens are withdrawn from the contract.
    /// @param token The address of the ERC20 token being withdrawn.
    /// @param to The address receiving the withdrawn tokens.
    /// @param amount The amount of tokens withdrawn.
    event TokenWithdrawn(address indexed token, address indexed to, uint amount);

    /// @notice Emitted when Zeta is withdrawn from the contract.
    /// @param to The address receiving the withdrawn Zeta.
    /// @param amount The amount of Zeta withdrawn.
    event EtherWithdrawn(address indexed to, uint amount);

    // Constructor

    /// @notice Constructor that initializes the contract.
    /// @dev The contract is owned by the address that deploys it.    
    constructor() Ownable(msg.sender) {
        // Aquí puedes agregar cualquier inicialización adicional si es necesario
    }

    /// @notice Withdraws any ERC20 token from the contract.
    /// @dev Can only be called by the owner of the contract. Transfers the entire balance of the specified token.
    /// @param token The address of the ERC20 token to withdraw.
    /// @param to The address to which the tokens will be sent.
    function withdrawToken(IERC20 token, address to) external onlyOwner {
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "Amount must be greater than 0");

        // Transferir el token a la dirección especificada
        token.transfer(to, amount);

        // Emitir el evento correspondiente
        emit TokenWithdrawn(address(token), to, amount);
    }

    /// @notice Withdraws Zeta from the contract.
    /// @dev Can only be called by the owner of the contract. Transfers the specified amount of Zeta to the given address.
    /// @param to The address to which the Zeta will be sent.
    /// @param amount The amount of Zeta to withdraw.
    function withdrawEther(address payable to, uint amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient Ether balance");

        // Transferir Ether a la dirección especificada
        to.transfer(amount);

        // Emitir el evento correspondiente
        emit EtherWithdrawn(to, amount);
    }

    /// @notice Receives Zeta sent to the contract.
    /// @dev Allows the contract to accept Zeta.
    receive() external payable {}
}