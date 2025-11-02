// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title NoorSwapPair
 * @notice Liquidity pool pair contract for NoorSwap DEX
 * @dev Implements Uniswap V2 constant product AMM: x * y = k
 *
 * Key Features:
 * - Automated Market Maker using constant product formula
 * - LP tokens representing pool ownership
 * - TWAP (Time-Weighted Average Price) oracle
 * - Flash swap support
 * - Shariah-compliant (no interest, transparent pricing)
 *
 * Fees:
 * - 0.25% LP fee (goes to liquidity providers)
 * - 0.05% protocol fee (goes to Noor Chain treasury)
 */
contract NoorSwapPair is ERC20 {
    using Math for uint256;

    // Minimum liquidity locked forever
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    // Factory address
    address public factory;

    // Token addresses
    address public token0;
    address public token1;

    // Reserves
    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    // Price accumulators for TWAP oracle
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;

    // Protocol fee tracking
    uint256 public kLast;

    // Events
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    // Lock to prevent reentrancy
    uint256 private unlocked = 1;

    modifier lock() {
        require(unlocked == 1, "NoorSwapPair: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    constructor() ERC20("NoorSwap LP", "NOOR-LP") {
        factory = msg.sender;
    }

    /**
     * @notice Initializes the pair with token addresses
     * @dev Called once by the factory at time of deployment
     */
    function initialize(address _token0, address _token1) external {
        require(msg.sender == factory, "NoorSwapPair: FORBIDDEN");
        require(token0 == address(0) && token1 == address(0), "NoorSwapPair: ALREADY_INITIALIZED");
        token0 = _token0;
        token1 = _token1;
    }

    /**
     * @notice Returns current reserves and last update timestamp
     */
    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /**
     * @notice Updates reserves and price accumulators
     * @dev Called on every liquidity change
     */
    function _update(uint256 balance0, uint256 balance1, uint112 _reserve0, uint112 _reserve1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "NoorSwapPair: OVERFLOW");

        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;

        // Update price accumulators for TWAP oracle
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            unchecked {
                price0CumulativeLast += uint256(_reserve1) * timeElapsed / uint256(_reserve0);
                price1CumulativeLast += uint256(_reserve0) * timeElapsed / uint256(_reserve1);
            }
        }

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;

        emit Sync(reserve0, reserve1);
    }

    /**
     * @notice Mints protocol fee if enabled
     * @dev Called before any liquidity change
     */
    function _mintFee(uint112 _reserve0, uint112 _reserve1) private returns (bool feeOn) {
        address feeTo = INoorSwapFactory(factory).feeTo();
        feeOn = feeTo != address(0);
        uint256 _kLast = kLast;

        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = Math.sqrt(uint256(_reserve0) * uint256(_reserve1));
                uint256 rootKLast = Math.sqrt(_kLast);

                if (rootK > rootKLast) {
                    uint256 numerator = totalSupply() * (rootK - rootKLast);
                    uint256 denominator = rootK * 5 + rootKLast; // 1/6th of growth (0.05% protocol fee from 0.30% total)
                    uint256 liquidity = numerator / denominator;

                    if (liquidity > 0) {
                        _mint(feeTo, liquidity);
                    }
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }

    /**
     * @notice Adds liquidity to the pool
     * @param to Address to receive LP tokens
     * @return liquidity Amount of LP tokens minted
     */
    function mint(address to) external lock returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply();

        if (_totalSupply == 0) {
            // First liquidity provider
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // Lock minimum liquidity forever
        } else {
            // Subsequent liquidity additions
            liquidity = Math.min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }

        require(liquidity > 0, "NoorSwapPair: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint256(reserve0) * uint256(reserve1);

        emit Mint(msg.sender, amount0, amount1);
    }

    /**
     * @notice Removes liquidity from the pool
     * @param to Address to receive tokens
     * @return amount0 Amount of token0 returned
     * @return amount1 Amount of token1 returned
     */
    function burn(address to) external lock returns (uint256 amount0, uint256 amount1) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        address _token0 = token0;
        address _token1 = token1;
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply();

        // Calculate amounts proportional to liquidity share
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;

        require(amount0 > 0 && amount1 > 0, "NoorSwapPair: INSUFFICIENT_LIQUIDITY_BURNED");

        _burn(address(this), liquidity);

        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);

        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));

        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint256(reserve0) * uint256(reserve1);

        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     * @notice Executes a token swap
     * @param amount0Out Amount of token0 to send
     * @param amount1Out Amount of token1 to send
     * @param to Address to receive output tokens
     * @param data Callback data for flash swaps
     */
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external lock {
        require(amount0Out > 0 || amount1Out > 0, "NoorSwapPair: INSUFFICIENT_OUTPUT_AMOUNT");
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "NoorSwapPair: INSUFFICIENT_LIQUIDITY");

        uint256 balance0;
        uint256 balance1;

        {
            address _token0 = token0;
            address _token1 = token1;
            require(to != _token0 && to != _token1, "NoorSwapPair: INVALID_TO");

            // Transfer output tokens
            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out);
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out);

            // Flash swap callback
            if (data.length > 0) {
                INoorSwapCallee(to).noorSwapCall(msg.sender, amount0Out, amount1Out, data);
            }

            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }

        // Calculate input amounts
        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;

        require(amount0In > 0 || amount1In > 0, "NoorSwapPair: INSUFFICIENT_INPUT_AMOUNT");

        {
            // Verify constant product with 0.30% fee (997/1000)
            uint256 balance0Adjusted = (balance0 * 1000) - (amount0In * 3);
            uint256 balance1Adjusted = (balance1 * 1000) - (amount1In * 3);
            require(
                balance0Adjusted * balance1Adjusted >= uint256(_reserve0) * uint256(_reserve1) * (1000**2),
                "NoorSwapPair: K"
            );
        }

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    /**
     * @notice Forces reserves to match balances
     * @dev Can be used to recover from inconsistent state
     */
    function skim(address to) external lock {
        address _token0 = token0;
        address _token1 = token1;
        _safeTransfer(_token0, to, IERC20(_token0).balanceOf(address(this)) - reserve0);
        _safeTransfer(_token1, to, IERC20(_token1).balanceOf(address(this)) - reserve1);
    }

    /**
     * @notice Forces reserves to match balances
     */
    function sync() external lock {
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this)),
            reserve0,
            reserve1
        );
    }

    /**
     * @notice Safe token transfer
     */
    function _safeTransfer(address token, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "NoorSwapPair: TRANSFER_FAILED");
    }
}

/**
 * @title INoorSwapFactory
 * @notice Factory interface for fee management
 */
interface INoorSwapFactory {
    function feeTo() external view returns (address);
}

/**
 * @title INoorSwapCallee
 * @notice Interface for flash swap callbacks
 */
interface INoorSwapCallee {
    function noorSwapCall(address sender, uint256 amount0, uint256 amount1, bytes calldata data) external;
}
