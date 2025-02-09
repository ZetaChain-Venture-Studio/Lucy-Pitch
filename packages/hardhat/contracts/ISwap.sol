// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISwap {

    /// @notice Executes a token swap between tokenA and tokenB.
    /// @dev This function checks the pair's fee, delegates the swap to either V3 or V2 (in that order),
    /// and emits a SwapExecuted event with the details of the swap.
    /// @param tokenA The address of the input token.
    /// @param tokenB The address of the output token.
    /// @param amountIn The amount of input tokens to swap.
    /// @param amountOutMinimum The minimum amount of output tokens expected.
    /// @param recipient The address that will receive the output tokens.
    /// @param deadline The timestamp by which the swap must be completed.
    /// @param _fee The fee tier for the Uniswap V3 pool.
    /// @return Returns the amount of output tokens received.    
    function swap(
        address tokenA,
        address tokenB,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient,
        uint256 deadline,
        uint24 _fee
    ) external returns(uint256);

    /// @notice Withdraws a specified token from the contract.
    /// @dev Allows the contract owner to withdraw tokens held in the contract.
    /// Emits a TokensWithdrawn event with the details of the withdrawal.
    /// @param token The address of the token to withdraw.
    function withdrawToken(address token) external;

    /// @notice Withdraws the entire ETH balance from the contract (or native coin).
    /// @dev Allows the contract owner to withdraw ETH (or native coin) held in the contract.
    /// Emits an ETHWithdrawn event with the details of the withdrawal.
    function withdrawETH() external;

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
    ) external;

    /// @notice Checks if there is a Uniswap V2 pair for the given token addresses.
    /// @dev Returns true if a pair exists, otherwise returns false.
    /// @param tokenA The address of the first token.
    /// @param tokenB The address of the second token.
    /// @return Returns true if a Uniswap V2 pair exists for the tokens.
    function isUniswapV2Pair(address tokenA, address tokenB) external view returns (bool);

    /// @notice Checks the fee tier for a Uniswap V3 pair.
    /// @dev Returns the fee tier if a pair exists, otherwise returns 0.
    /// Tiers are checked from minor to major, retaining the first one found.
    /// @param tokenA The address of the current token.
    /// @param tokenB The address of the target token.
    /// @return Returns the fee tier for the Uniswap V3 pair.
    function isUniswapV3Pair(address tokenA, address tokenB) external view returns (uint24);
}