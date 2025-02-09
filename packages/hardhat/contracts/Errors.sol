// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Errors Contract
/// @notice This contract defines custom error types used throughout the application.
/// These errors provide a more efficient way to handle exceptions and communicate issues
/// with the contract's execution.
contract Errors {
    
    /// @notice Error thrown when a user's balance is insufficient for a transaction.
    error InsufficientBalance();

    /// @notice Error thrown when an address provided is the zero address (0x0).
    error ZeroAddress();

    /// @notice Error thrown when a token transfer fails.
    error TransferFailed();

    /// @notice Error thrown when an action is attempted by an unauthorized user.
    error Unauthorized();

    /// @notice Error thrown when a user is not whitelisted for an operation.
    error NotWhitelisted();

    /// @notice Error thrown when an invalid chain ID is provided.
    error NotValidChainId();

    /// @notice Error thrown when a multiplier is outside the valid range.
    error InvalidMultiplier();

    /// @notice Error thrown when no bounty has been set for the operation.
    error NoBountySet();

    /// @notice Error thrown when no protocol wallet has been set.
    error NoProtocolSet();

    /// @notice Error thrown when an operation attempts to spend more tokens than the allowance
    /// set by the token holder for the spender.
    error InsufficientAllowance();

    /// @notice Error thrown when a function is called before the specified time.
    error RebalanceCallBlocked();

    /// @notice Error thrown when a function is called before the specified time.
    error NeedHigherBlockingTime();
}