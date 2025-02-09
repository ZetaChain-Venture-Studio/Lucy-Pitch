// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Elibs.sol";
import "./Errors.sol";
import "./ISwap.sol";

abstract contract ConnectedBase is Initializable, AccessControlUpgradeable, Errors, UUPSUpgradeable {
    /// @notice The role identifier for the server role, used to grant permission to perform server actions.
    bytes32 public constant SERVER_ROLE = keccak256("SERVER_ROLE");

	/// @notice Role identifier for the treasure management role.
	bytes32 public constant TREASURE_ROLE = keccak256("TREASURE_ROLE");
	
    /// @notice The role identifier for the upgrader of the smart contract
    bytes32 internal constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

	/// @notice Gateway contract address for EVM cross-chain interactions. This is the Gateway of the connected chain.
	/// @dev This address is utilized for verifying and processing cross-chain calls.
	IGatewayEVM public constant gateway = IGatewayEVM(payable(address(0x48B9AACC350b20147001f88821d31731Ba4C30ed)));
	
	/// @notice USDC token contract address.
	/// @dev This variable holds the address of the USDC token in connected chain used for transactions.	
	IERC20 public constant usdcToken = IERC20(address(0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359));

	/// @notice Address of the universal contract for cross-chain operations.
	/// @dev This address is used for interacting with the universal contract and send payments.
	address public universal;

	/// @notice Swap interface for executing token swaps.
	/// @dev This variable holds the address of the swap contract used for token exchanges.
	ISwap public swap;

	/// @notice Context for messages received during cross-chain operations.
	/// @dev This variable stores information related to the message context. Used to set it when a transaction fails for debugging purposes.
	MessageContext public context;

	/// @notice Maximum allowed deadline for swap operations.
	/// @dev This constant sets the time limit for swap transactions to one hour.
	uint16 internal constant MAX_DEADLINE = 1 hours;

    /// @notice A mapping from addresses to their respective security time values.
    /// @dev This mapping is used to track the time associated with each address for security purposes.
    /// No wallet with one of a day of the role being granted is able to use the role.
    mapping (address => uint256) internal securityTime;
	
	/// @notice Mapping to track used nonces for transaction uniqueness.
	/// @dev This mapping prevents replay attacks by verifying nonce usage.
	mapping (uint256 => bool) internal nonce;

}

/// @title Verifier Contract
/// @notice This contract provides functionalities for signature verification to ensure that
/// addresses are authorized to perform certain actions. It uses role-based access control 
/// to manage permissions securely.
/// @dev Inherits from AccessControl to manage roles and from Errors for error handling.
/// This contract is primarily used for verifying that a signer has the SERVER_ROLE 
/// based on a signed message, preventing unauthorized actions.
abstract contract Verifier is ConnectedBase {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }


    // Internal Functions
    /// @notice Verifies if an address is authorized based on a signed message.
    /// @dev This function generates a message hash from the provided parameters and checks
    /// if the signer has the SERVER_ROLE. It is a view function and does not modify state.
    function verify(
        uint256 _nonce,
        uint256 _price,
        bytes memory _signature
    ) 
        public 
        view 
        returns (bool) 
    {
        // Construct the message that was signed
        bytes32 messageHash = keccak256(abi.encodePacked(_nonce, _price));
        // Convert messageHash to Ethereum signed message format
        messageHash = messageHash.toEthSignedMessageHash();

        // Recover the signer address from the signature
        address signer = messageHash.recover(_signature);

        // Check if the signer has the SERVER_ROLE
        return hasRole(SERVER_ROLE, signer);
    }


    //Override accessControl functions to make them more restrictive and only being able to call them
    //when the wallet has more than a day of the whitelisting.


    ///@dev Returns `true` if `account` has been granted `role` + security time passed
    function hasRole(bytes32 role, address account) public view override  returns (bool) {
        if (securityTime[account] > block.timestamp) {
            return false;
        }
        return AccessControlUpgradeable.hasRole(role, account);
    }


    ///@dev Grants `role` to `account`.
    ///If `account` had not been already granted `role`, emits a {RoleGranted}
    ///event.
    ///Requirements:
    ///- the caller must have ``role``'s admin role.
    ///May emit a {RoleGranted} event.
    ///securityTime[account] also added. The user won't have the role until then
    function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        if (block.timestamp < securityTime[account]) revert();
        securityTime[account] = block.timestamp + 1 days;
        _grantRole(role, account);
    }


}



/// @title Connected Contract
/// @notice This contract facilitates cross-chain interactions, enabling payments and token swaps.
/// It integrates with a gateway for managing cross-chain calls. 
/// Users can pay with USDC to get whitelisted in the universal smart contract on ZetaChain by Lucy.
/// Lucy can decide to swap USDC for any token that has a direct pair on Uniswap by invoking it on ZetaChain.
/// USDC will be sent to this contract, and the `onCall` function will be executed by the gateway to perform the swap.
/// The Treasury role can withdraw both native currency and tokens.
/// @dev Inherits from Verifier to utilize signature verification functionalities.
/// This contract employs role-based access control to ensure security and proper permission management.
contract Connected is Verifier {
	using SafeERC20 for IERC20;

	/// @notice Emitted when the contracts are updated with new addresses.
	/// @param universal The address of the updated universal contract.
	/// @param swap The address of the updated swap contract.
	event ContractsUpdated(address indexed universal, address indexed swap);

	/// @notice Emitted when a payment is received by the contract in USDC.
	/// @dev This event is the one to check in order for Lucy to whitelist user in zetachain avoiding 20 minutes latency
	/// @param user The address of the user making the payment.
	/// @param amountPaid The amount of the payment received.
	/// @param timeStamp The timestamp when the payment was received.
	event PaymentReceived(address indexed user, uint256 amountPaid, uint256 timeStamp);

	/// @notice Emitted when a revert occurs during cross-chain transactions.
	/// @param message A string message describing the revert.
	/// @param revertContext The context information related to the revert.
	event RevertEvent(string message, RevertContext revertContext);

	/// @notice Emitted when a swap operation fails.
	/// @param user The address of the user who attempted the swap.
	/// @param tokenA The address of the input token.
	/// @param tokenB The address of the output token.
	/// @param amountIn The amount of the input token that was attempted to be swapped.
	event SwapFailed(address indexed user, address indexed tokenA, address indexed tokenB, uint256 amountIn);

	/// @notice Emitted when a token swap is successfully completed.
	/// @param user The address of the user who executed the swap.
	/// @param tokenA The address of the input token.
	/// @param tokenB The address of the output token.
	/// @param amountIn The amount of the input token that was swapped.
	/// @param amountOut The amount of the output token received.
	/// @param timestamp The timestamp when the swap was completed.
	event TokenSwapped(address indexed user, address indexed tokenA, address indexed tokenB, uint256 amountIn, uint256 amountOut, uint256 timestamp);

	/// @notice Emitted when a withdrawal of native coins occurs.
	/// @param to The address to which the amount was withdrawn.
	/// @param amount The amount of native coins withdrawn.
	event Withdraw(address indexed to, uint256 amount);

	/// @notice Emitted when tokens are withdrawn from the contract.
	/// @param token The address of the token that was withdrawn.
	/// @param to The address to which the tokens were sent.
	/// @param amount The amount of tokens withdrawn.	
	event WithdrawTokens(address indexed token, address indexed to, uint256 amount);

	/// @notice Restricts function access to only the designated gateway.
	/// @dev This modifier checks that the caller of the function is the authorized gateway address.
	/// If the caller is not the gateway, it reverts the transaction with an Unauthorized error.
	modifier onlyGateway() {
		if (msg.sender != address(gateway)) revert Unauthorized();
		_;
	}

	/// @notice Initializes the contract and grants roles to the deployer.
	/// @dev The constructor sets up initial roles for the contract and defines key addresses.
	/// It grants the DEFAULT_ADMIN_ROLE, SERVER_ROLE, and TREASURE_ROLE to the deployer,
	/// and additionally assigns the SERVER_ROLE to a specified address (Lucy's wallet).
	/// It also sets the addresses for the universal contract and the swap interface.
    function initialize() initializer public {
        //setting upgrades
        __AccessControl_init();
        __UUPSUpgradeable_init();

		// state variables
		universal = address(0x26F54687656a742f94c22B9afD498b2d6B5db673);
		swap = ISwap(0xac11f5804dE332747e99BcaD33D0c3ee55f46846);

        // Role Grants
        securityTime[msg.sender] = block.timestamp - 1 days;
        _grantRole(UPGRADER_ROLE, msg.sender);
        securityTime[msg.sender] = block.timestamp - 1 days;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        securityTime[msg.sender] = block.timestamp - 1 days;
        _grantRole(SERVER_ROLE, msg.sender);
        _grantRole(SERVER_ROLE, address(0x3DCE981b7E79Eb0e1A8a810345c3F21A94A410e2)); // Server testing (Lucy wallet)
        securityTime[msg.sender] = block.timestamp - 1 days;
        _grantRole(TREASURE_ROLE, msg.sender);

        // making initial wallets inmediate roles
        securityTime[msg.sender] = block.timestamp - 1 days;
        securityTime[address(0x3DCE981b7E79Eb0e1A8a810345c3F21A94A410e2)] = block.timestamp - 1 days;

    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}



	/// @notice Sets the addresses of the universal contract and the swap contract.
	/// @dev This function allows the admin to set the addresses of the universal and swap contracts.
	/// It ensures that neither address is zero before updating the state variables.
	/// The function can only be called by an account with the DEFAULT_ADMIN_ROLE.
	/// Emits a ContractsUpdated event with the new addresses.
	/// @param _universal The address of the universal contract to be set.
	/// @param _swap The ISwap contract instance to be set.
	function setContracts(address _universal, ISwap _swap) external onlyRole(DEFAULT_ADMIN_ROLE) {
		if (_universal == address(0) || address(_swap) == address(0)) revert ZeroAddress();
		universal = _universal;
		swap = _swap;
		emit ContractsUpdated(_universal, address(_swap));
	}

	/// @notice Processes a payment for the game using USDC tokens in polygon.
	/// @dev This function allows a user to pay for a game by transferring USDC tokens.
	/// It verifies the payment details and checks the user's balance and allowance before proceeding.
	/// The function uses a nonce to ensure that each payment request is unique and prevents replay attacks.
	/// Emits a PaymentReceived event with the details of the payment.
	/// @param _price The price of the game in USDC tokens.
	/// @param _nonce A unique identifier for the payment request.
	/// @param _signature The signature used to authorize the payment request.
	function payGame(uint256 _price, uint256 _nonce, bytes memory _signature) external {
		IERC20 _usdcToken = usdcToken;

        //checks if the price was stablished by lucy
        if (nonce[_nonce]) revert Unauthorized();
        nonce[_nonce] = true;
        if (!verify(_nonce, _price, _signature )) revert Unauthorized();

		if (_usdcToken.balanceOf(msg.sender) < _price) revert InsufficientBalance();
		if (_usdcToken.allowance(msg.sender, address(this)) < _price) revert InsufficientAllowance();

		_usdcToken.safeTransferFrom(msg.sender, address(this), _price);
		_usdcToken.approve(address(gateway), _price);
		
		gateway.depositAndCall(
			universal, 
			_price, 
			address(_usdcToken), 
			abi.encode(msg.sender, _price), 
			RevertOptions(address(this), false, address(this), new bytes(0x10), 7000000)
		);

		_usdcToken.approve(address(gateway), 0);
		emit PaymentReceived(msg.sender, _price, block.timestamp);
	}    

	/// @notice Withdraws the entire balance of the contract in native currency to the caller.
	/// @dev This function allows users with the TREASURE_ROLE to withdraw the contract's balance.
	/// It transfers the entire balance of the contract to the caller's address.
	/// Emits a Withdraw event with the details of the withdrawal.
	function withdraw() external onlyRole(TREASURE_ROLE) {
		uint256 amount = address(this).balance;
		payable(msg.sender).transfer(amount);
		emit Withdraw(msg.sender, amount);
	}

	/// @notice Withdraws all tokens of a specified type from the contract.
	/// @dev This function allows users with the TREASURE_ROLE to withdraw tokens from the contract.
	/// It verifies that the token address is valid and that the contract holds a non-zero balance of the specified token.
	/// Emits a WithdrawTokens event with the details of the withdrawal.
	/// @param _token The address of the ERC20 token to be withdrawn.
	function withdrawTokens(address _token) external onlyRole(TREASURE_ROLE) {
		if (_token == address(0)) revert ZeroAddress();
		uint256 _balance = IERC20(_token).balanceOf(address(this));
		if (_balance == 0) revert InsufficientBalance();
		IERC20(_token).transfer(msg.sender, _balance);
		emit WithdrawTokens(_token, msg.sender, _balance);
	}

	/// @notice Handles cross-chain calls from the Universal smart contract in order to do the swap.
	/// @dev This function is triggered when a transaction is received from the Universal smart contract
	/// on ZetaChain to this connected smart contract on another chain (e.g. Polygon). It processes a token swap
	/// using the provided details and emits relevant events for tracking.
	/// If swap fails, we get the USDC and launch an event to handle problem manually.
	/// @param _context Context information for the message being processed.
	/// @param message The encoded message containing swap details (user address, token addresses (usdc in actual chain and target token), amount).
	/// @return A bytes4 response indicating success.	
	function onCall(MessageContext calldata _context, bytes calldata message) external payable onlyGateway returns (bytes4) {
		(address _user, address _tokenA, address _tokenB, uint256 _amountIn) = abi.decode(message, (address, address, address, uint256));
		uint256 _deadline = block.timestamp + MAX_DEADLINE;

		usdcToken.safeTransferFrom(address(gateway), address(this), _amountIn);
		IERC20(_tokenA).approve(address(swap), _amountIn);

		try swap.swap(
			_tokenA,
			_tokenB,
			_amountIn,
			1,
			address(this),
			_deadline,
			0
		) returns (uint256 amountOut) {
			emit TokenSwapped(_user, _tokenA, _tokenB, _amountIn, amountOut, _deadline);
		} catch {
			context = _context;
			emit SwapFailed(_user, _tokenA, _tokenB, _amountIn);
		}

		IERC20(_tokenA).approve(address(swap), 0);
		return "";
	}

	/// @notice Handles revert situations triggered by cross-chain transactions.
	/// @dev This function is called when a cross-chain transaction reverts. It emits an event
	/// logging the revert context for further analysis with details about the revert..
	/// Not used currently but in case we need it in the future.
	/// @param revertContext Provides context about the revert situation.
	function onRevert(RevertContext calldata revertContext) external onlyGateway {
		emit RevertEvent("Revert on EVM", revertContext);
	}

	/// @notice Receives native coins sent to the contract.
	/// @dev This function is called when native coins are sent to the contract without any data.
	/// It allows the contract to accept native coins, such as POL on the Polygon network.
	/// This is to make sure to receive the coins if we send them with the Gateway
	receive() external payable {}

	/// @notice Fallback function to receive native coins.
	/// @dev This function is called when the contract receives native coins with data or when 
	/// no other function matches the call. It ensures the contract can still accept native coins.
	/// This is to make sure to receive the coins if we send them with the Gateway
	fallback() external payable {}
}