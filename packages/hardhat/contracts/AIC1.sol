// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Bounty.sol";
import "./zlib.sol";
import "./Errors.sol";


abstract contract AICBASE  is Initializable, AccessControlUpgradeable, Errors, UUPSUpgradeable {

    ////////////////////////// Constants //////////////////////////

    /// @notice The maximum allowed deadline for swaps, set to 1 hour.
    uint16 internal constant MAX_DEADLINE = 1 hours;

    /// @notice The address of the Wrapped Zeta token (WZETA).
    address internal constant WZETA = 0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf;

    /// @notice The address of the Uniswap router used for swaps in zetachain
    address internal constant UniswapRouter = 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe;

    /// @notice The role identifier for the upgrader of the smart contract
    bytes32 internal constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    /// @notice The role identifier for the server role, used to grant permission to perform server actions.
    bytes32 internal  constant SERVER_ROLE = keccak256("SERVER_ROLE");

    /// @notice Role identifier for the TREASURE_ROLE, used for treasury functions.
    bytes32 internal constant TREASURE_ROLE = keccak256("TREASURE_ROLE");

    ////////////////////////// State Variables //////////////////////////

    /// @notice The number of the round we are in.
    uint256 public round; // put public

    /// @notice The minimum cooling period
    uint256 internal blockingTime = 14 hours;

    /// @notice The date for the next day to start.
    uint256 public blockedTime;

    /// @notice The amount of tokens to be swapped.
    uint256 public feesCharged;

    /// @notice The amount of tokens to be swapped.
    uint256 public amountIn;  // put public

    /// @notice The multiplier for bounties.
    uint256 internal bountyMultiplier;

    /// @notice The gas limit for crosschain operations.
    uint256 internal gasLimit;

    /// @notice The wallet address for protocol revenue.
    address internal protocol;

    /// @notice The Bounty contract instance for managing bounties.
    Bounty public bounty; // put public

    /// @notice The USDC token contract instance. Currently Using USDC.BASE.
    IERC20 internal usdcToken;

    /// @notice The gateway for cross-chain interactions.
    IGatewayZEVM internal gateway;

    ////////////////////////// Mappings //////////////////////////

    /// @notice Mapping to track whitelisted users.
    mapping(address => uint8) public whitelist;

    /// @notice Mapping to associate connected contracts by chain ID.
    mapping (uint256 => address) public  connectedContracts; // put public

    /// @notice Mapping to associate USDC contract addresses by chain ID. (The address in Zetachain)
    mapping (uint256 => address) public  usdcByChain; // put public

    /// @notice Mapping to associate USDC input addresses by chain ID. (The address in the connected chain)
    mapping (uint256 => address) public  usdcInChain; // put public

    /// @notice Mapping to track used nonces for transaction uniqueness avoiding replay.
    mapping (uint256 => bool) public  nonce; // put public

    /// @notice A mapping from addresses to their respective security time values.
    /// @dev This mapping is used to track the time associated with each address for security purposes.
    /// No wallet with one of a day of the role being granted is able to use the role.
    mapping (address => uint256) internal securityTime;


}

/// @title Verifier Contract
/// @notice This contract provides functionalities for signature verification to ensure that
/// addresses are authorized to perform certain actions. It uses role-based access control 
/// to manage permissions securely.
/// @dev Inherits from AccessControl to manage roles and from Errors for error handling.
/// This contract is primarily used for verifying that a signer has the SERVER_ROLE 
/// based on a signed message, preventing unauthorized actions.
abstract contract Verifier is AICBASE {
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


/// @title AIC1 Contract
/// @notice This contract manages cross-chain interactions and token swaps using USDC and Zeta.
/// It allows users to participate in the game, pay fees, and let Lucy swap tokens through Uniswap V2 and V3 in the connected blockchains, and V2 inside zetachain.
/// The contract owner can set parameters, manage whitelists, and withdraw funds.
/// @dev Inherits from UniversalContract and Verifier to utilize their functionalities.
contract AIC1 is UniversalContract, Verifier {

    ////////////////////////// Events //////////////////////////

    /// @notice Emitted when a new player joins the game.
    /// @param player The address of the new player.
    /// @param amount The amount paid by the player.
    /// @param chainId The chain ID the player is connected to.
    event NewPlayer(address indexed player, uint256 amount, uint256 chainId);
    
    /// @notice Emitted when a user wins a bounty.
    /// @param user The address of the winner. Only topic for search.
    /// @param tokenA The address of the first token in the swap.
    /// @param tokenB The address of the target token in the swap.
    /// @param amountA The amount of the first token.
    /// @param amountB The amount of the target token.
    /// @param timestamp The timestamp of the event.    
    event Winner(uint256 indexed round, address indexed user, address tokenA, address tokenB, uint256 amountA, uint256 amountB, uint256 chainId, uint256 timestamp);

    /// @notice Emitted when a user was paid for winning.
    /// @param user The address of the user who won.
    /// @param amount The amount paid to the the user.
    /// @param token The address of the token used for payment. (USDC.BASE in zetachain)
    event UserPaid(uint256 indexed round, address indexed user, uint256 amount, address indexed token);

    /// @notice Emitted when a chain is updated with new contract addresses.
    /// @param chainId The ID of the connected chain being updated. (e.g. 137 for polygon)
    /// @param connectedContract The address of the deployed connected contract in the connected chain.
    /// @param usdcByChain The USDC token address associated with the chain inside zetachain.
    /// @param usdcInChain The input USDC address for the chain. The address of the token inside the connected chain
    event ChainUpdated(uint256 indexed chainId, address connectedContract, address usdcByChain, address usdcInChain);

    /// @notice Emitted when a revert occurs during a transaction.
    /// @dev revertions are not being used for now and any error during crosschain handled manually.
    /// @param message A string message describing the revert.
    /// @param revertContext The context of the revert.
    event RevertEvent(string message, RevertContext revertContext);

    /// @notice Emitted when a user is removed from the whitelist.
    /// @param user The address of the user removed from the whitelist.
    /// @param timestamp The timestamp of the event.
    event UserDeWhitelisted(address indexed user, uint256 timestamp);

    /// @notice Emitted when a withdrawal of Zeta occurs.
    /// @param to The address to which the amount was withdrawn.
    /// @param amount The amount of zeta withdrawn.
    event Withdraw(address indexed to, uint256 amount);

    /// @notice Emitted when tokens are withdrawn from the contract.
    /// @param token The address of the token being withdrawn.
    /// @param to The address receiving the withdrawn tokens.
    /// @param amount The amount of tokens withdrawn.
	event WithdrawTokens(address indexed token, address indexed to, uint256 amount);

    /// @notice Emitted when tokens are withdrawn from the bounty pool.
    /// @param token The address of the token being withdrawn.
    /// @param to The address receiving the withdrawn tokens.
    /// @param amount The amount of tokens withdrawn from the bounty.
    event WithdrawTokensFromBounty(address indexed token, address indexed to, uint256 amount);

    /// @notice Emitted when funds (in Zeta) are withdrawn from the bounty in zetachain.
    /// @param to The address receiving the withdrawn amount.
    /// @param amount The amount withdrawn from the bounty.
    event WithdrawFromBounty(address indexed to, uint256 amount);

    /// @notice Emitted when the gas limit for cross chain swap is set.
    /// @param setter The address that set the gas limit.
    /// @param gasLimit The new gas limit value.
    event GasLimitSet(address indexed setter, uint256 gasLimit);

    /// @notice Emitted when the amountIn and bounty multiplier are changed.
    /// @param amountIn The new amount in. (The value to swap)
    /// @param newMultiplier The new bounty multiplier. (100 to distribute all bounty pool)
    /// @param admin The address of the admin changing the values.
    /// @param timestamp The time when the values were changed.
    event AmountInAndBountyMultiplierChanged(uint256 amountIn,uint256 newMultiplier, address indexed admin, uint256 timestamp);

    /// @notice Emitted when the USDC token and protocol address are set.
    /// @param setter The address that set the values.
    /// @param usdcToken The address of the USDC token. Currently working with USDC.BASE in zetachain
    /// @param protocol The address of the protocol wallet to get the revenue.
    /// @param timestamp The time when the values were set.
    event UsdcTokenAndProtocolSet(address indexed setter, address indexed usdcToken, address indexed protocol, uint256 timestamp);

    /// @notice Emitted when a withdraw and call operation is executed.
    /// @param user The address of the user executing the operation.
    /// @param tokenA The address of the input token in the chain where the swap is being done.
    /// @param tokenB The address of the output token. (the target)
    /// @param amountIn The amount of the input token.
    /// @param chainId The ID of the chain where the operation is executed.
    /// @param data Additional data for the operation.
    event WithdrawAndCallExecuted(
        address indexed user,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountIn,
        uint256 chainId,
        bytes data
    );

    /// @notice Emitted when an onCall operation is executed.
    /// @param context The context of the message.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param amount The amount involved in the operation.
    /// @param message Additional message data.
    event OnCallExecuted(
        MessageContext context,
        address indexed zrc20,
        uint256 amount,
        bytes message
    );

    /// @notice Emitted when an error occurs during an onCall operation.
    /// @param context The context of the message.
    /// @param zrc20 The address of the ZRC20 token. (USDC.ConnectedChain)
    /// @param amount The amount involved in the operation.
    /// @param message Additional message data.
    event OnCallError(
        MessageContext context,
        address indexed zrc20,
        uint256 amount,
        bytes message
    );

    ////////////////////////// Modifiers //////////////////////////

    /// @notice Restricts access to functions that can only be called by the gateway.
    /// @dev Reverts with Unauthorized error if the caller is not the gateway.
    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    /// @notice Restricts access to functions that can only be called after the blocking time.
    /// @dev Reverts with RebalanceCallBlocked error if the current time is before the blocking time.
    modifier onlyAfterBlockedTime() {
        if (block.timestamp < blockedTime) revert RebalanceCallBlocked();
        _;
    }

    ////////////////////////// Constructor //////////////////////////


    function initialize() initializer public {
        //setting upgrades
        __AccessControl_init();
        __UUPSUpgradeable_init();

        // State Variable Initialization
        usdcToken = IERC20(0x96152E6180E085FA57c7708e18AF8F05e37B479D); //USDC.BASE
        protocol = payable(address(0xd02fB5E4CF58c409311900dfA72A2B156688Abcf)); //Wallet for revenue
        gateway = IGatewayZEVM(payable(address(0xfEDD7A6e3Ef1cC470fbfbF955a22D793dDC0F44E))); // gateway in Z mainnet
        amountIn = 0.0001 * 1000000; // Amount in swap
        bountyMultiplier = 100;
        gasLimit = 1000000;
        blockedTime = block.timestamp - MAX_DEADLINE;

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

        // Token and Bounty Initialization
        bounty = new Bounty();

        //polygon initialization for testing... We can set all the nets here when deployed
        setChain(137,address(0xE0a0CfE61A25a3a369b6BbDd07d0F4c7120E449E), address(0xfC9201f4116aE6b054722E10b98D904829b469c3), address(0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359));
        // first whitelisting initialized for testing
        whitelist[msg.sender] ++;
        emit NewPlayer(msg.sender, 0, 7000);

    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    ////////////////////////// External Functions //////////////////////////

    //functions Anyone can call

    /// @notice Allows a user to pay to play the game. Only in Zetachain.
    /// @dev Validates the price, nonce, and user balance/allowance before processing the payment.
    /// Splits the payment between the protocol and the bounty.
    /// @param _price The price to pay for the game.
    /// @param _nonce A unique nonce to prevent replay attacks.
    /// @param _signature A signed message by Lucy to verify the payment.
    function payGame(uint256 _price, uint256 _nonce, bytes memory _signature) onlyAfterBlockedTime external {

        //checks if the price was stablished by lucy
        if (nonce[_nonce]) revert Unauthorized();
        nonce[_nonce] = true;
        if (!verify(_nonce, _price, _signature )) revert Unauthorized();

        address _bounty = address(bounty);
        // Check that a bounty has been set
        if (_bounty == address(0)) revert NoBountySet();

        address _protocol = protocol;
        // Check that a protocol wallet has been set
        if (_protocol == address(0)) revert NoProtocolSet();

        IERC20 _usdcToken = usdcToken;
        // Check that the player has sufficient balance to pay
        if (_usdcToken.balanceOf(msg.sender) < _price) revert InsufficientBalance();

        // Check that the player has approved the USDC spending
        if (_usdcToken.allowance(msg.sender, address(this)) < _price) revert InsufficientAllowance();

        // Realiza el transferFrom
        bool _success = _usdcToken.transferFrom(msg.sender, address(this), _price);
        if (!_success) revert TransferFailed();
        _success = _usdcToken.transfer(_protocol, (_price*25)/100); // 20% for devs
        if (!_success) revert TransferFailed();
        _success = _usdcToken.transfer(_bounty, (_price*75)/100); // 75% for users / 5% to increase treasure
        if (!_success) revert TransferFailed();

        ++whitelist[msg.sender];
        feesCharged += _price;
        emit NewPlayer(msg.sender, _price, 7000);            

    }

    /// @notice Retrieves the balances of multiple token addresses in the contract.
    /// @dev Iterates over the provided token addresses and returns their balances as an array.
    /// @param tokens An array of token addresses to check the balances for.
    /// @return Returns an array of balances corresponding to the provided token addresses.
    function getBalances(address[] memory tokens) external view returns (uint256[] memory) {
        uint256 length = tokens.length;
        uint256[] memory balances = new uint256[](length);
        
        for (uint256 i = 0; i < length; ) {
            balances[i] = IERC20(tokens[i]).balanceOf(address(this));
            unchecked { ++i; }
        }

        return balances;
    }

    //functions only the Server can call

    /// @notice Removes a user from the whitelist by Lucy after being rejected.
    /// @dev Can only be called by the server role (Lucy). Validates that the user is not the zero address
    /// and is currently whitelisted before removing them.
    /// @param _user The address of the user to dewhitelist.
    function deWhitelist(address _user) external onlyRole(SERVER_ROLE) {
        if (_user == address(0)) revert ZeroAddress(); // Check for zero address
        if (whitelist[_user] == 0) revert NotWhitelisted(); // Check if user is not whitelisted
        --whitelist[_user];
        emit UserDeWhitelisted(_user, block.timestamp);
    }

    /// @notice Pays a user from the bounty balance when Lucy determines they won. Call it after swapTokens
    /// @dev Can only be called by the server role (Lucy). Withdraws a calculated amount based on the bounty multiplier.
    /// @param _user The address of the user to pay.
    function payUser(address _user) external onlyRole(SERVER_ROLE)  {
        ++round;
        --whitelist[_user];
        blockedTime = block.timestamp + blockingTime;
        Bounty _bounty = bounty;
        IERC20 _usdcToken = usdcToken;
        uint256 _balance = _usdcToken.balanceOf(address(_bounty));
        _balance = (_balance * bountyMultiplier) / 100;
        _bounty.withdrawToken(_usdcToken, _user);
        emit UserPaid(round,_user, _balance, address(_usdcToken));
    }

    /*
        user = 0x7e2Bf2537086d1A22791CE00015BbE34Ed2D301c
        tokenA= 0x96152E6180E085FA57c7708e18AF8F05e37B479D
        tokenB= 0xc2132D05D31c914a87C6611C10748AEb04B58e8F
        chain= 137
    */
    //swap tokens. tokenA is isdc.base, tokenB the one I want to buy in the corresponding chainId

    /// @notice Swaps tokens for tokens, potentially involving Zeta as an intermediary.
    /// @dev Executes the crosschain swap based on the provided parameters and checks for valid chain IDs.
    /// @param _user The address of the user performing the swap.
    /// @param tokenA The address of the token being swapped from. Always USDC.BASE in zetachain.
    /// @param tokenB The address of the token being swapped to. Whatever token the user wants while having a direct pair with USDC in uniswap on the destination chain.
    /// @param _chainId The ID of the chain where the swap occurs. (137 for polygon)
    /// @return amounts an array of amounts received from the swap.    
    function swapTokens(address _user, address tokenA, address tokenB, uint256 _chainId) external payable onlyRole(SERVER_ROLE) onlyAfterBlockedTime returns(uint[] memory amounts) {
        //usdcByChain
                
        address _connectedContract = connectedContracts[_chainId];
        if (_connectedContract == address(0)) revert NotValidChainId();
        if (tokenA == address(0)) revert ZeroAddress();
        if (tokenB == address(0)) revert ZeroAddress();
        if (0 == whitelist[_user]) revert NotWhitelisted();

        blockedTime = block.timestamp + blockingTime; // Gives time to fund wallet and works as a flag for noReentrancy
        uint256 _amountIn = amountIn;

        if (_chainId == block.chainid) {
            if(tokenA == WZETA && tokenB != WZETA) {
                amounts = swapZetaForTokens(tokenB, _amountIn);
            }else {
                if(tokenB == WZETA && tokenA != WZETA) {
                    amounts =  swapTokenForZeta(tokenA);
                }else {
                    amounts = _swapTokens(tokenA, tokenB);
                }
            }
        } else {  //this version suppose we have USDC.BASE and tokens to pay the gasFee in each chain
            // set initial variables to config the swap
            
            {// new variable context to avoid stack to deep error
                address _usdcByChain = usdcByChain[_chainId];

                // Swaps USDC.BASE to the USDC of the chain where we are withdrawing the funds if needed
                if(tokenA != _usdcByChain) { //(user, usdc.base,USDC.POL, false)
                    amounts =_swapTokens(tokenA, _usdcByChain);
                    tokenA = _usdcByChain;
                    _amountIn = amounts[amounts.length - 1]; // 995
                }                

                // making sure the amountIn is always less or equal to the balance we have and avoid unnesesary reverts
                uint256 _balanceA = IERC20(tokenA).balanceOf(address(this)); //1060
                if(_balanceA < _amountIn) { // 1060 < 995
                    _amountIn = _balanceA;
                }                // _amountIn = 995
            }
            
            {// separate context to avoid stack to deep error
                //gasLimit not copy to memory to avoid stack too deep
                uint256 _gasLimit = gasLimit; //300000
                address _gateway = address(gateway);
                address _gasZRC20; // 0xADF73ebA3Ebaa7254E859549A44c74eF7cff7501
                //approve the Gateway to extract the gasFee
                {
                    uint256 _gasFee; //0.010799999975100000
                    (_gasZRC20, _gasFee) = IZRC20(tokenA) //usdc.pol
                        .withdrawGasFeeWithGasLimit(_gasLimit);
                    IZRC20(_gasZRC20).approve(address(_gateway), _gasFee); // pol.pol, 0.0107...
                    //approve the Gateway to extract the money
                    IERC20(tokenA).approve(address(_gateway), _amountIn);// usdc.pol, 995                      
                }

                IGatewayZEVM(_gateway).withdrawAndCall(
                    abi.encode(_connectedContract),
                    _amountIn,
                    tokenA, // esto debería ser usdc.pol en zetachain
                    abi.encode(_user, usdcInChain[_chainId], tokenB, _amountIn), // tokenA aca debería ser usdc en polygon
                     CallOptions(_gasLimit, false),
                    RevertOptions(
                        address(this),
                        false,
                        address(this),
                        new bytes(0x10),
                        7000000
                    )
                );

                IZRC20(_gasZRC20).approve(address(_gateway), 0); // pol.pol, 0.0107...
                IERC20(tokenA).approve(address(_gateway), 0);// usdc.pol, 995  
            }
            //_amountIn != amounts[amounts.length - 1] => if the swap was inside zetachain
            //_amountIn == amounts[amounts.length - 1] => if the swap was outside zetachain
            // it can happen that _amountIn != amounts[amounts.length - 1] => outside zetachain if we didn't have enaugh money for the swap. (although this shouldn't happened unless there is a problem in uniswap contract)
            emit Winner(
                round,
                _user, 
                tokenA, 
                tokenB, 
                _amountIn, 
                amounts[amounts.length - 1],
                _chainId,
                block.timestamp
            );   
        }

    }

    /// @notice Adds a player to the whitelist. Call this function only after getting PaymentReceived() event in the connected chain.
    /// @dev Can only be called by the server role (Lucy). Updates the whitelist status and emits an event.
    /// @param _player The address of the player to add to the whitelist.
    /// @param _price The price associated with the player.
    /// @param _chainId The ID of the chain where the player is being added from (The chain used to pay).
    function setWhitelist(address _player, uint256 _price, uint256 _chainId) external onlyRole(SERVER_ROLE) {
        // I accept any price send by the back end and set next price according to it
        ++whitelist[_player];
        feesCharged += _price;
        emit NewPlayer(_player, _price, _chainId);
    }

    /// @notice Sets the current round number.
    /// @dev Can only be called by the admin role.
    /// @param _round The new round number to set.
    function setRound(uint256 _round) external onlyRole(SERVER_ROLE) {
        round = _round;
    }


    //Functions only the treasury can call

    /// @notice Withdraws funds from a specified address. (this one or bounty)
    /// @dev Can only be called by the treasury role. Checks the balance and withdraws accordingly.
    /// @param _from The address to withdraw from.
	function withdrawFrom(address _from) external onlyRole(TREASURE_ROLE) {
		uint256 amount = address(_from).balance;
		if (amount == 0) revert InsufficientBalance();
        if(_from==address(bounty)) {
            bounty.withdrawEther(payable(msg.sender),amount);
            emit WithdrawFromBounty(msg.sender, amount);
        }else {
            payable(msg.sender).transfer(amount);
            emit Withdraw(msg.sender, amount);
        }
	}    

    /// @notice Withdraws tokens from a specified address. (this one or bounty)
    /// @dev Can only be called by the treasury role. Validates the token address and balance before transferring.
    /// @param _token The address of the token to withdraw.
    /// @param _from The address to withdraw from.
	function withdrawTokensFrom(address _token, address _from) external onlyRole(TREASURE_ROLE) {
		if (_token == address(0)) revert ZeroAddress();
		uint256 _balance = IERC20(_token).balanceOf(address(bounty));
		if (_balance == 0) revert InsufficientBalance();

        if(_from==address(bounty)) {
            bounty.withdrawToken(IERC20(_token),msg.sender);
            emit WithdrawTokensFromBounty(_token, msg.sender, _balance);
        }else {
            IERC20(_token).transfer(msg.sender, _balance);
            emit WithdrawTokens(_token, msg.sender, _balance);
        }

	}    

    //functions only de admin can call

    /// @notice Sets the blocking time for the contract.
    /// @dev Can only be called by the admin role. The blocking time must be at least 1 hour.
    /// @param _blockingTime The new blocking time value in seconds.
    function setBlockingTime(uint256 _blockingTime) external onlyRole(DEFAULT_ADMIN_ROLE) {
        //if (_blockingTime < 1 hours) revert NeedHigherBlockingTime();
        blockingTime = _blockingTime;
    }

    /// @notice Sets the gas limit for crosschain operations. (currently working with 1M)
    /// @dev Can only be called by the admin role. Emits an event when the gas limit is updated.
    /// @param _gasLimit The new gas limit value.
    function setGasLimit(uint256 _gasLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        gasLimit = _gasLimit;
        emit GasLimitSet(msg.sender,_gasLimit); // Emit new wallet and setter for security.
    }

    /// @notice Configures a connected chain with its respective contracts.
    /// @dev Can only be called by the admin role. Validates input addresses before setting them.
    /// @param _chainId The ID of the chain to configure.
    /// @param _connectedContract The address of the connected contract for the chain.
    /// @param _usdcAddress The address of the USDC token for the connected chain in Zetachain. (USDC.Pol)
    /// @param _usdcInChain The address of the USDC token in the connected chain.(USDC in Polygon)
    function setChain(uint256 _chainId, address _connectedContract, address _usdcAddress, address _usdcInChain) public onlyRole(DEFAULT_ADMIN_ROLE) {
        // Validations
        if (_connectedContract == address(0)) revert ZeroAddress();
        if (_usdcAddress == address(0)) revert ZeroAddress();

        // Asign contracts
        usdcByChain[_chainId] = _usdcAddress;
        connectedContracts[_chainId] = _connectedContract;
        usdcInChain[_chainId] = _usdcInChain;
        
        // Emit event with new chain set
        emit ChainUpdated(_chainId, _connectedContract, _usdcAddress, _usdcInChain);
    }

    /// @notice Updates the amountIn and bounty multiplier values.
    /// @dev Can only be called by the admin role. Validates the multiplier range before setting it.
    /// @param _amountIn The new amount to set for swaps.
    /// @param newMultiplier The new multiplier for bounty calculations.
    function setAmountInAndMultiplier(uint256 _amountIn, uint256 newMultiplier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // we could set the swap amount to 0 if we want
        amountIn = _amountIn;
        if (newMultiplier < 50 || newMultiplier > 100) revert InvalidMultiplier();
        bountyMultiplier = newMultiplier;
        emit AmountInAndBountyMultiplierChanged(_amountIn,newMultiplier, msg.sender, block.timestamp);
    }

    /// @notice Sets the USDC token (currently using USDC.BASE) and protocol wallet address.
    /// @dev Can only be called by the admin role. Validates input addresses before setting them.
    /// @param _usdcToken The address of the USDC token.
    /// @param _protocol The address of the protocol wallet.
    function setUsdcTokenAndProtocol(address _usdcToken,address payable _protocol) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // design to be USDC.BASE but able to change afterword if we want
        if (_usdcToken == address(0)) revert ZeroAddress(); // Check for zero address
        usdcToken = IERC20(_usdcToken);
        if (_protocol == address(0)) revert ZeroAddress(); // Check for zero address to avoid mistakes.
        protocol = _protocol;
        emit UsdcTokenAndProtocolSet(msg.sender, _usdcToken,_protocol, block.timestamp);
    }

    //Function only Zetachain Gateway can call

    /// @notice Handles incoming calls from the ZetaChain gateway when called from a connected chain.
    /// @dev Validates the message and executes a token swap on Uniswap if successful.
    /// Only gateway can call it.
    /// @param _context The context of the message.
    /// @param _zrc20 The address of the ZRC20 token involved. (native token bridged to zetachain e.g. Pol.Pol)
    /// @param _amount The amount of tokens involved.
    /// @param _message Additional message data.
    function onCall(
        MessageContext calldata _context,
        address _zrc20,
        uint256 _amount,
        bytes calldata _message
    ) external override onlyGateway {
        IERC20 _usdcToken = usdcToken;
        address[] memory _path = new address[](3);
        _path[0] = _zrc20;
        _path[1] = WZETA;
        _path[2] = address(_usdcToken);

        // Give approval to uniswap
        IERC20(_zrc20).approve(address(UniswapRouter), _amount);
        try IUniswapV2Router01(UniswapRouter).swapExactTokensForTokens(
            _amount,
            0,
            _path,
            address(this), //address(this)
            block.timestamp + MAX_DEADLINE
        ) returns (uint[] memory _amounts) {
            uint256 _balance = _amounts[_amounts.length - 1];
            _usdcToken.transfer(protocol, (_balance*25)/100); // 20% for devs
            _usdcToken.transfer(address(bounty), (_balance*75)/100); // 75% for users / 5% to increase treasure
            emit OnCallExecuted(_context, _zrc20, _amount, _message);
        } catch {
            emit OnCallError(_context, _zrc20, _amount, _message);
        }
        IERC20(_zrc20).approve(address(UniswapRouter), 0);
    }

    /// @notice Handles revert events from the ZetaChain gateway.
    /// @dev Emits a revert event with the context information.
    /// Not using it, but logging it just in case or if we change any connected contract in the future.
    /// @param revertContext The context of the revert event.
    function onRevert( RevertContext calldata revertContext ) external onlyGateway {
        emit RevertEvent("Revert on ZetaChain", revertContext);
    }



    // Starting internal functions

    /// @notice Swaps a specified token for Wrapped Zeta.
    /// @param token The address of the token being swapped.
    /// @return amounts The amounts received from the swap.
    function swapTokenForZeta(address token) internal returns(uint256[] memory amounts) {
        uint _amountIn = amountIn;

        address[] memory _path = new address[](2);
        _path[0] = token;
        _path[1] = WZETA; // Wrapped Zeta address

        // Give approval to uniswap
        IERC20(token).approve(address(UniswapRouter), _amountIn);
        amounts = IUniswapV2Router01(
                    UniswapRouter
                ).swapExactTokensForETH(
                    _amountIn,
                    0,
                    _path,
                    address(this),
                    block.timestamp + MAX_DEADLINE
                );
        IERC20(token).approve(address(UniswapRouter), 0);

        return amounts;
    }

    /// @notice Swaps Wrapped Zeta for a specified token.
    /// @param token The address of the token being swapped to.
    /// @param _amountIn The amount of Wrapped Zeta to sell.
    /// @return amounts The output amounts received from the swap when swaping.   
    function swapZetaForTokens(address token, uint256 _amountIn) internal returns(uint[] memory amounts) {

        address[] memory path = new address[](2);
        path[0] = WZETA; // Wrapped ETH address
        path[1] = token;

        amounts = IUniswapV2Router01(
                    UniswapRouter
                ).swapExactETHForTokens{value: _amountIn}(
                    0,
                    path,
                    address(this),
                    block.timestamp + MAX_DEADLINE
                );

        return amounts;
    }

    /// @notice Swap tokens for tokens with zeta in the middle
    ///@param tokenA The address of the token being swapped from.
    ///@param tokenB The address of the token being swapped to.
    /// @return amounts The amount of token received

    /// @notice Swaps tokens for tokens with Zeta as an intermediary. (because in zetachain, all the tokens are created in a pool paired with Zeta)
    /// @param tokenA The address of the token being swapped from.
    /// @param tokenB The address of the token being swapped to.
    /// @return amounts The amounts received from the swap.    
    function _swapTokens(address tokenA, address tokenB) internal returns(uint[] memory amounts) {
       //(user, usdc.base,USDC.POL, false)
        uint _amountIn = amountIn; // = 1000

        //address[2] memory path;
        address[] memory path = new address[](3);
        path[0] = tokenA; //usdc.base
        path[1] = WZETA;
        path[2] = tokenB; // USDC.POL

        // Give approval to uniswap
        IERC20(tokenA).approve(address(UniswapRouter), _amountIn); // aprove 1000 de usdc.base a uniswap
        amounts = IUniswapV2Router01(
                    UniswapRouter
                ).swapExactTokensForTokens(
                    _amountIn,
                    0,
                    path,
                    address(this), //address(this)
                    block.timestamp + MAX_DEADLINE
                ); // cambio de base a pol
        IERC20(tokenA).approve(address(UniswapRouter), 0);
    }

    /// @notice Fallback function to accept incoming Zeta.
    /// @dev Allows the contract to receive ETH payments.
    receive() external payable { }

    /// @notice Fallback function to accept incoming Zeta.
    /// @dev Allows the contract to receive Zeta payments.
    fallback() external payable { }
}
