// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./ISwap.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// deployed in polygon= 0x42d96E181A5Db81b6FdFF69BCA2F4d02cc330aFf
//swapV3 = 
/*
0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
0xc2132D05D31c914a87C6611C10748AEb04B58e8F
10000
0
0xd385D20327a33153dcBb954950110069917aC862
455765765656547658768
500
*/

/// @title Swap Contract
/// @notice This contract facilitates token swaps using Uniswap V2 and V3 protocols.
/// It allows users to execute swaps between different tokens or between ETH and tokens.
/// The contract owner can withdraw tokens and ETH from the contract, as well as update the Uniswap router addresses.
/// @dev Inherits from Ownable to manage ownership and access control.
contract Swap is Ownable, ISwap{

    IERC20 public constant USDC = IERC20(address(0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359));

    /// @notice The Uniswap V3 factory contract address.
    /// @dev To create and manage Uniswap V3 pools. Used to see if a pool Exists in V3.
    IUniswapV3Factory public uniswapV3Factory;

    /// @notice The Uniswap V3 router contract address.
    /// @dev Used to execute swaps on Uniswap V3.
    ISwapRouter public uniswapV3Router;

    /// @notice The Uniswap V2 router contract address.
    /// @dev Used to execute swaps on Uniswap V2.
    IUniswapV2Router01 public uniswapV2Router;

    /// @notice The Uniswap V2 factory contract address.
    /// @dev Used to create and manage Uniswap V2 pools. Used to see if a pool Exists in V2.
    IUniswapV2Factory public uniswapV2Factory;

    // Events

    /// @notice Emitted when a swap is executed successfully.
    /// @param sender The address that initiated the swap.
    /// @param tokenA The address of the input token.
    /// @param tokenB The address of the output token.
    /// @param amountIn The amount of the input token.
    /// @param amountOut The amount of the output token received.
    /// @param recipient The address that will receive the output token.
    /// @param fee The fee associated with the swap, or 0 if using V2.    
    event SwapExecuted(
        address indexed sender,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountIn,
        uint256 amountOut,
        address recipient,
        uint24 fee
    );

    /// @notice Emitted when the Uniswap contract addresses are updated.
    /// @param uniswapV3Factory The new Uniswap V3 factory address.
    /// @param uniswapV3Router The new Uniswap V3 router address.
    /// @param uniswapV2Router The new Uniswap V2 router address.
    /// @param uniswapV2Factory The new Uniswap V2 factory address.
    event UniswapContractsUpdated(
        IUniswapV3Factory uniswapV3Factory,
        ISwapRouter uniswapV3Router,
        IUniswapV2Router01 uniswapV2Router,
        IUniswapV2Factory uniswapV2Factory
    );

    /// @notice Emitted when tokens are withdrawn from the contract.
    /// @param token The address of the withdrawn token.
    /// @param recipient The address that received the withdrawn tokens.
    /// @param amount The amount of tokens withdrawn.
    event TokensWithdrawn(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Emitted when ETH (or native coin) is withdrawn from the contract.
    /// @param recipient The address that received the withdrawn ETH (or native coin).
    /// @param amount The amount of ETH withdrawn.
    event ETHWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    /// @notice Initializes the contract with predefined Uniswap router addresses.
    /// @dev The constructor sets the addresses for Uniswap V2 and V3 routers and factories.
    constructor() Ownable(msg.sender) {
        uniswapV2Router = IUniswapV2Router01(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45);
        uniswapV3Router = ISwapRouter(0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45);
        uniswapV3Factory = IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);
        uniswapV2Factory = IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);
    }

    /// @notice Executes a token swap between tokenA and tokenB.
    /// @dev This function checks the pair's fee, delegates the swap to either V3 or V2 (in that order),
    /// and emits a SwapExecuted event with the details of the swap.
    /// @param tokenA The address of the input token.
    /// @param tokenB The address of the output token.
    /// @param amountIn The amount of input tokens to swap.
    /// @param amountOutMinimum The minimum amount of output tokens expected.
    /// @param recipient The address that will receive the output tokens.
    /// @param deadline The timestamp by which the swap must be completed.
    /// @param fee The fee tier for the Uniswap V3 pool.
    /// @return Returns the amount of output tokens received.
    function swap(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient,
        uint256 deadline,
        uint24 fee
    ) external returns(uint256) {
        if(fee != 0) {
            address pair = uniswapV3Factory.getPool(tokenA, tokenB, fee);    // 0.05%
            if (pair == address(0)) {
                fee = 0; 
            }
        } else {
            fee = isUniswapV3Pair(tokenA, tokenB);
        }
        if (fee != 0) {
            amountOutMinimum = _swapV3(tokenA, tokenB, amountIn, amountOutMinimum, recipient, fee);
        } else if (isUniswapV2Pair(tokenA, tokenB)) {
            amountOutMinimum = _swapV2(tokenA, tokenB, amountIn, amountOutMinimum, recipient, deadline);
        } else {
            revert("No pair found in V2 or V3");
        }
        emit SwapExecuted(
            msg.sender,
            tokenA,
            tokenB,
            amountIn,
            amountOutMinimum, //Amount out
            recipient,
            fee             // if 0 then V2
        );
        return amountOutMinimum;
    }

    /// @notice Internal function to execute a swap on Uniswap V3.
    /// @dev Transfers the input tokens to the contract, approves the Uniswap router,
    /// and executes the swap using the exactInputSingle function.
    /// @param tokenA The address of the input token.
    /// @param tokenB The address of the output token.
    /// @param amountIn The amount of input tokens to swap.
    /// @param amountOutMinimum The minimum amount of output tokens expected.
    /// @param recipient The address that will receive the output tokens.
    /// @param fee The fee tier for the Uniswap V3 pool.
    /// @return amount the amount of output tokens received.
    function _swapV3(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient,
        uint24 fee
    ) internal returns(uint256 amount) {
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenA).approve(address(uniswapV3Router), amountIn);


        amount = uniswapV3Router.exactInputSingle(
            ISwapRouter.ExactInputSingleParams(
                tokenA,
                tokenB,
                fee, // Tarifa del pool
                recipient,
                amountIn,
                amountOutMinimum,
                0
            )
        );
    }


    /// @notice Internal function to execute a swap on Uniswap V2.
    /// @dev Handles swapping between ETH and tokens or between tokens. Transfers input tokens
    /// to the contract, approves the Uniswap router, and executes the swap.
    /// @param tokenA The address of the input token.
    /// @param tokenB The address of the output token.
    /// @param amountIn The amount of input tokens to swap.
    /// @param amountOutMinimum The minimum amount of output tokens expected.
    /// @param recipient The address that will receive the output tokens.
    /// @param deadline The timestamp by which the swap must be completed.
    /// @return amount the amount of output tokens received.
    function _swapV2(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient,
        uint256 deadline
    ) internal returns(uint256 amount) {
        // Swap ETH por tokens
        if (tokenA == uniswapV2Router.WETH()) {
            uint256[] memory amounts = uniswapV2Router.swapExactETHForTokens{ value: amountIn }(
                amountOutMinimum,
                getPathForETHToToken(tokenB),
                recipient,
                deadline
            );
            amount = amounts[amounts.length];
        } 
        // Swap tokens por ETH
        else if (tokenB == uniswapV2Router.WETH()) {
            IERC20(tokenA).transferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenA).approve(address(uniswapV2Router), amountIn);
            
            uint256[] memory amounts = uniswapV2Router.swapExactTokensForETH(
                amountIn,
                amountOutMinimum,
                getPathForTokenToETH(tokenA),
                recipient,
                deadline
            );
            amount = amounts[amounts.length];
        } 
        // Swap tokens por tokens
        else {
            IERC20(tokenA).transferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenA).approve(address(uniswapV2Router), amountIn);

            address[] memory path = new address[](2);
            path[0] = tokenA;
            path[1] = tokenB;

            uint256[] memory amounts = uniswapV2Router.swapExactTokensForTokens(
                amountIn,
                amountOutMinimum,
                path,
                recipient,
                deadline
            );
            amount = amounts[amounts.length];
        }
        return amount;
    }

    /// @notice Withdraws a specified token from the contract.
    /// @dev Allows the contract owner to withdraw tokens held in the contract.
    /// Emits a TokensWithdrawn event with the details of the withdrawal.
    /// @param _token The address of the token to withdraw.
    function withdrawToken(address _token) external onlyOwner {
        uint256 _amount = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(msg.sender, _amount);
        emit TokensWithdrawn(_token, msg.sender, _amount);
    }

    /// @notice Withdraws the entire ETH balance from the contract (or native coin).
    /// @dev Allows the contract owner to withdraw ETH (or native coin) held in the contract.
    /// Emits an ETHWithdrawn event with the details of the withdrawal.
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
        emit ETHWithdrawn(msg.sender, balance);
    }

    /// @notice Updates the Uniswap contract addresses.
    /// @dev Allows the contract owner to set new addresses for Uniswap V2 and V3 routers and factories.
    /// Emits an UniswapContractsUpdated event with the new addresses.
    /// No sanity checks and whenever it is called, the contracts addresses must be checked.
    /// @param _uniswapV3Factory The new Uniswap V3 factory address.
    /// @param _uniswapV3Router The new Uniswap V3 router address.
    /// @param _uniswapV2Router The new Uniswap V2 router address.
    /// @param _uniswapV2Factory The new Uniswap V2 factory address.
    function setUniswapContracts(
        IUniswapV3Factory _uniswapV3Factory,
        ISwapRouter _uniswapV3Router,
        IUniswapV2Router01 _uniswapV2Router,
        IUniswapV2Factory _uniswapV2Factory
    ) external onlyOwner {
        uniswapV3Factory = _uniswapV3Factory;
        uniswapV3Router = _uniswapV3Router;
        uniswapV2Router = _uniswapV2Router;
        uniswapV2Factory = _uniswapV2Factory;
        emit UniswapContractsUpdated(
            _uniswapV3Factory,
            _uniswapV3Router,
            _uniswapV2Router,
            _uniswapV2Factory
        );
    }

    /// @notice Checks if there is a Uniswap V2 pair for the given token addresses.
    /// @dev Returns true if a pair exists, otherwise returns false.
    /// @param tokenA The address of the first token.
    /// @param tokenB The address of the second token.
    /// @return Returns true if a Uniswap V2 pair exists for the tokens.
    function isUniswapV2Pair(address tokenA, address tokenB) public view returns (bool) {
        address pair = uniswapV2Factory.getPair(tokenA, tokenB);
        return pair != address(0);
    }

    /// @notice Checks the fee tier for a Uniswap V3 pair.
    /// @dev Returns the fee tier if a pair exists, otherwise returns 0.
    /// Always returns the pair that has more USDC inside
    /// Tiers are checked from minor to major, retaining the one found to compare with the next and getting the one with more USDC.
    /// @param tokenA The address of the current token.
    /// @param tokenB The address of the target token.
    /// @return _result the fee tier for the Uniswap V3 pair. = if there was none.
    function isUniswapV3Pair(address tokenA, address tokenB) public view returns (uint24 _result) {
        uint256 _balance;
        uint256 _balanceAux;
        address pair;

        pair = uniswapV3Factory.getPool(tokenA, tokenB, 100);    // 0.01%
        if (pair != address(0)){
            _balance = USDC.balanceOf(pair);
            _result = 100;
        }

        pair = uniswapV3Factory.getPool(tokenA, tokenB, 500);    // 0.05%
        if (pair != address(0)) {
            _balanceAux = USDC.balanceOf(pair);
            if(_balanceAux > _balance) {
                _result = 500;
                _balance = _balanceAux;
            }
        }

        pair = uniswapV3Factory.getPool(tokenA, tokenB, 3000);    // 0.05%
        if (pair != address(0)) {
            _balanceAux = USDC.balanceOf(pair);
            if(_balanceAux > _balance) {
                _result = 3000;
                _balance = _balanceAux;
            }
        }

        pair = uniswapV3Factory.getPool(tokenA, tokenB, 10000);    // 0.05%
        if (pair != address(0)) {
            _balanceAux = USDC.balanceOf(pair);
            if(_balanceAux > _balance) {
                _result = 10000;
                _balance = _balanceAux;
            }
        }

        return _result;
    }

    /// @notice Generates the path for swapping ETH to a specified token.
    /// @dev Creates an array containing the addresses of the tokens involved in the swap.
    /// @param token The address of the token to swap to.
    /// @return Returns an array of addresses representing the swap path.
    function getPathForETHToToken(address token) internal view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = token;
        return path;
    }

    /// @notice Generates the path for swapping a specified token to ETH.
    /// @dev Creates an array containing the addresses of the tokens involved in the swap.
    /// @param token The address of the token to swap from.
    /// @return Returns an array of addresses representing the swap path.
    function getPathForTokenToETH(address token) internal view returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = uniswapV2Router.WETH();
        return path;
    }
}