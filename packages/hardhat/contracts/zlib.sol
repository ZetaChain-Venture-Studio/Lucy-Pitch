
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title Message Structures and Universal Contract Interface
/// @notice This section defines data structures used for messaging and interactions
/// between contracts, as well as the interface for the UniversalContract.
/// @dev Represents the context of a message being sent across chains.
struct MessageContext {
    /// @notice The origin of the message, typically representing the source chain or contract.
    bytes origin;

    /// @notice The address of the sender initiating the message.
    address sender;

    /// @notice The ID of the chain from which the message originates.
    uint256 chainID;
}

/// @dev Options for calling functions across contracts.
struct CallOptions {
    /// @notice The maximum amount of gas that can be used for the call.
    uint256 gasLimit;

    /// @notice Indicates if the call is an arbitrary call or not.
    bool isArbitraryCall;
}

/// @dev Options for handling revert scenarios.
struct RevertOptions {
    /// @notice The address to call in case of a revert.
    address revertAddress;

    /// @notice Indicates if a call should be made upon a revert.
    bool callOnRevert;

    /// @notice The address to abort the operation.
    address abortAddress;

    /// @notice The message to be returned upon revert.
    bytes revertMessage;

    /// @notice The gas limit for the revert operation.
    uint256 onRevertGasLimit;
}

/// @dev Context for handling revert situations.
struct RevertContext {
    /// @notice The address of the sender involved in the revert.
    address sender;

    /// @notice The asset related to the revert operation.
    address asset;

    /// @notice The amount involved in the revert.
    uint256 amount;

    /// @notice The message explaining the reason for the revert.
    bytes revertMessage;
}

/// @title Universal Contract Interface
/// @notice This interface defines a method for handling incoming calls.
/// Contracts implementing this interface must define the onCall function.
interface UniversalContract {
    /// @notice Handles a call from another contract or chain.
    /// @dev This function is triggered when a message is received across chains.
    /// @param context The context of the incoming message.
    /// @param zrc20 The address of the ZRC20 token involved.
    /// @param amount The amount of tokens being transferred or referenced.
    /// @param message Additional data related to the call.
    function onCall(MessageContext calldata context, address zrc20, uint256 amount, bytes calldata message) external;
}

interface IGatewayZEVMEvents {
    /// @notice Emitted when a cross-chain call is made.
    /// @param sender The address of the sender.
    /// @param zrc20 Address of zrc20 to pay fees.
    /// @param receiver The receiver address on the external chain.
    /// @param message The calldata passed to the contract call.
    /// @param callOptions Call options including gas limit and arbirtrary call flag.
    /// @param revertOptions Revert options.
    event Called(
        address indexed sender,
        address indexed zrc20,
        bytes receiver,
        bytes message,
        CallOptions callOptions,
        RevertOptions revertOptions
    );

    /// @notice Emitted when a withdrawal is made.
    /// @param sender The address from which the tokens are withdrawn.
    /// @param chainId Chain id of external chain.
    /// @param receiver The receiver address on the external chain.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param value The amount of tokens withdrawn.
    /// @param gasfee The gas fee for the withdrawal.
    /// @param protocolFlatFee The protocol flat fee for the withdrawal.
    /// @param message The calldata passed with the withdraw. No longer used. Kept to maintain compatibility.
    /// @param callOptions Call options including gas limit and arbirtrary call flag.
    /// @param revertOptions Revert options.
    event Withdrawn(
        address indexed sender,
        uint256 indexed chainId,
        bytes receiver,
        address zrc20,
        uint256 value,
        uint256 gasfee,
        uint256 protocolFlatFee,
        bytes message,
        CallOptions callOptions,
        RevertOptions revertOptions
    );

    /// @notice Emitted when a withdraw and call is made.
    /// @param sender The address from which the tokens are withdrawn.
    /// @param chainId Chain id of external chain.
    /// @param receiver The receiver address on the external chain.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param value The amount of tokens withdrawn.
    /// @param gasfee The gas fee for the withdrawal.
    /// @param protocolFlatFee The protocol flat fee for the withdrawal.
    /// @param message The calldata passed to the contract call.
    /// @param callOptions Call options including gas limit and arbirtrary call flag.
    /// @param revertOptions Revert options.
    event WithdrawnAndCalled(
        address indexed sender,
        uint256 indexed chainId,
        bytes receiver,
        address zrc20,
        uint256 value,
        uint256 gasfee,
        uint256 protocolFlatFee,
        bytes message,
        CallOptions callOptions,
        RevertOptions revertOptions
    );
}

interface IGatewayZEVMErrors {
    /// @notice Error indicating a withdrawal failure.
    error WithdrawalFailed();

    /// @notice Error indicating an insufficient ZRC20 token amount.
    error InsufficientZRC20Amount();

    /// @notice Error indicating an insufficient zeta amount.
    error InsufficientZetaAmount();

    /// @notice Error indicating a failure to burn ZRC20 tokens.
    error ZRC20BurnFailed();

    /// @notice Error indicating a failure to transfer ZRC20 tokens.
    error ZRC20TransferFailed();

    /// @notice Error indicating a failure to deposit ZRC20 tokens.
    error ZRC20DepositFailed();

    /// @notice Error indicating a failure to transfer gas fee.
    error GasFeeTransferFailed();

    /// @notice Error indicating that the caller is not the protocol account.
    error CallerIsNotProtocol();

    /// @notice Error indicating an invalid target address.
    error InvalidTarget();

    /// @notice Error indicating a failure to send ZETA tokens.
    error FailedZetaSent();

    /// @notice Error indicating that only WZETA or the protocol address can call the function.
    error OnlyWZETAOrProtocol();

    /// @notice Error indicating an insufficient gas limit.
    error InsufficientGasLimit();

    /// @notice Error indicating message size exceeded in external functions.
    error MessageSizeExceeded();
}

interface IGatewayZEVM is IGatewayZEVMErrors, IGatewayZEVMEvents {
    /// @notice Withdraw ZRC20 tokens to an external chain.
    /// @param receiver The receiver address on the external chain.
    /// @param amount The amount of tokens to withdraw.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param revertOptions Revert options.
    function withdraw(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        RevertOptions calldata revertOptions
    )
        external;

    /// @notice Withdraw ZETA tokens to an external chain.
    /// @param receiver The receiver address on the external chain.
    /// @param amount The amount of tokens to withdraw.
    /// @param revertOptions Revert options.
    function withdraw(
        bytes memory receiver,
        uint256 amount,
        uint256 chainId,
        RevertOptions calldata revertOptions
    )
        external;

    /// @notice Withdraw ZRC20 tokens and call a smart contract on an external chain.
    /// @param receiver The receiver address on the external chain.
    /// @param amount The amount of tokens to withdraw.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param message The calldata to pass to the contract call.
    /// @param callOptions Call options including gas limit and arbirtrary call flag.
    /// @param revertOptions Revert options.
    function withdrawAndCall(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    )
        external;

    /// @notice Withdraw ZETA tokens and call a smart contract on an external chain.
    /// @param receiver The receiver address on the external chain.
    /// @param amount The amount of tokens to withdraw.
    /// @param chainId Chain id of the external chain.
    /// @param message The calldata to pass to the contract call.
    /// @param callOptions Call options including gas limit and arbirtrary call flag.
    /// @param revertOptions Revert options.
    function withdrawAndCall(
        bytes memory receiver,
        uint256 amount,
        uint256 chainId,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    )
        external;

    /// @notice Call a smart contract on an external chain without asset transfer.
    /// @param receiver The receiver address on the external chain.
    /// @param zrc20 Address of zrc20 to pay fees.
    /// @param message The calldata to pass to the contract call.
    /// @param callOptions Call options including gas limit and arbirtrary call flag.
    /// @param revertOptions Revert options.
    function call(
        bytes memory receiver,
        address zrc20,
        bytes calldata message,
        CallOptions calldata callOptions,
        RevertOptions calldata revertOptions
    )
        external;

    /// @notice Deposit foreign coins into ZRC20.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param amount The amount of tokens to deposit.
    /// @param target The target address to receive the deposited tokens.
    function deposit(address zrc20, uint256 amount, address target) external;

    /// @notice Execute a user-specified contract on ZEVM.
    /// @param context The context of the cross-chain call.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param amount The amount of tokens to transfer.
    /// @param target The target contract to call.
    /// @param message The calldata to pass to the contract call.
    function execute(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        address target,
        bytes calldata message
    )
        external;

    /// @notice Deposit foreign coins into ZRC20 and call a user-specified contract on ZEVM.
    /// @param context The context of the cross-chain call.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param amount The amount of tokens to transfer.
    /// @param target The target contract to call.
    /// @param message The calldata to pass to the contract call.
    function depositAndCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        address target,
        bytes calldata message
    )
        external;

    /// @notice Deposit ZETA and call a user-specified contract on ZEVM.
    /// @param context The context of the cross-chain call.
    /// @param amount The amount of tokens to transfer.
    /// @param target The target contract to call.
    /// @param message The calldata to pass to the contract call.
    function depositAndCall(
        MessageContext calldata context,
        uint256 amount,
        address target,
        bytes calldata message
    )
        external;

    /// @notice Revert a user-specified contract on ZEVM.
    /// @param target The target contract to call.
    /// @param revertContext Revert context to pass to onRevert.
    function executeRevert(address target, RevertContext calldata revertContext) external;

    /// @notice Deposit foreign coins into ZRC20 and revert a user-specified contract on ZEVM.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param amount The amount of tokens to revert.
    /// @param target The target contract to call.
    /// @param revertContext Revert context to pass to onRevert.
    function depositAndRevert(
        address zrc20,
        uint256 amount,
        address target,
        RevertContext calldata revertContext
    )
        external;
}

/// @title IZRC20 Interface
/// @notice This interface defines the standard functions for a ZRC20 token contract.
/// It includes functions for token management, allowances, and gas fee handling.
interface IZRC20 {
    /// @notice Returns the total supply of tokens in existence.
    /// @return The total supply of the token.
    function totalSupply() external view returns (uint256);

    /// @notice Returns the balance of a specific account.
    /// @param account The address of the account to query.
    /// @return The amount of tokens held by the specified account.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Transfers tokens to a specified recipient.
    /// @param recipient The address of the recipient.
    /// @param amount The amount of tokens to transfer.
    /// @return True if the transfer was successful, otherwise false.
    function transfer(address recipient, uint256 amount) external returns (bool);

    /// @notice Returns the remaining number of tokens that a spender is allowed to spend
    /// on behalf of an owner.
    /// @param owner The address of the token owner.
    /// @param spender The address of the spender.
    /// @return The remaining allowance for the spender.
    function allowance(address owner, address spender) external view returns (uint256);

    /// @notice Approves a spender to spend a specified amount of tokens on behalf of the caller.
    /// @param spender The address of the spender.
    /// @param amount The amount of tokens to approve.
    /// @return True if the approval was successful, otherwise false.
    function approve(address spender, uint256 amount) external returns (bool);

    /// @notice Transfers tokens from one account to another using the allowance mechanism.
    /// @param sender The address of the token sender.
    /// @param recipient The address of the token recipient.
    /// @param amount The amount of tokens to transfer.
    /// @return True if the transfer was successful, otherwise false.
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /// @notice Deposits a specified amount of tokens into the contract.
    /// @param to The address to which the tokens will be deposited.
    /// @param amount The amount of tokens to deposit.
    /// @return True if the deposit was successful, otherwise false.
    function deposit(address to, uint256 amount) external returns (bool);

    /// @notice Burns a specified amount of tokens from the caller's account.
    /// @param amount The amount of tokens to burn.
    /// @return True if the burn was successful, otherwise false.
    function burn(uint256 amount) external returns (bool);

    /// @notice Withdraws a specified amount of tokens to a given address.
    /// @param to The address to which the tokens will be withdrawn.
    /// @param amount The amount of tokens to withdraw.
    /// @return True if the withdrawal was successful, otherwise false.
    function withdraw(bytes memory to, uint256 amount) external returns (bool);

    /// @notice Retrieves the gas fee withdrawal address and amount.
    /// @return The address for gas fee withdrawal and the amount.
    function withdrawGasFee() external view returns (address, uint256);

    /// @notice Retrieves the gas fee withdrawal address and amount with a specified gas limit.
    /// @param gasLimit The gas limit for the operation.
    /// @return The address for gas fee withdrawal and the amount.
    function withdrawGasFeeWithGasLimit(uint256 gasLimit) external view returns (address, uint256);

    /// @notice The protocol flat fee for token operations.
    /// @dev Name is in upper case to maintain compatibility with ZRC20.sol v1.
    /// @return The flat fee amount.
    function PROTOCOL_FLAT_FEE() external view returns (uint256);

    /// @notice The gas limit for token operations.
    /// @dev Name is in upper case to maintain compatibility with ZRC20.sol v1.
    /// @return The gas limit amount.
    function GAS_LIMIT() external view returns (uint256);

    /// @notice Sets a new name for the token.
    /// @param newName The new name to set for the token.
    function setName(string memory newName) external;

    /// @notice Sets a new symbol for the token.
    /// @param newSymbol The new symbol to set for the token.
    function setSymbol(string memory newSymbol) external;
}
