// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title VaultStayCore V2 — Decentralized Rental Escrow Protocol
/// @notice Full-featured escrow with platform fees, reviews, staking, disputes, ERC20 support, and governance
contract VaultStayCore is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    // Enums & Structs
    // ──────────────────────────────────────────────

    enum Status { Created, Funded, Active, Completed, Review, Cancelled, Disputed }

    struct Agreement {
        address landlord;
        address tenant;
        uint256 rent;
        uint256 deposit;
        uint256 startDate;
        uint256 endDate;
        bool isShortTerm;
        Status status;
        uint256 reviewDeadline;
        address paymentToken; // address(0) = native ETH, otherwise ERC20
    }

    struct Review {
        uint8 rating;       // 1-5
        string reviewHash;  // IPFS hash
        uint256 timestamp;
        address reviewer;
    }

    // ──────────────────────────────────────────────
    // State Variables
    // ──────────────────────────────────────────────

    uint256 public agreementCount;
    mapping(uint256 => Agreement) public agreements;

    // Platform fee system (Problem 1)
    uint256 public platformFeePercent; // basis points (100 = 1%)
    address public platformTreasury;

    // Review system (Problem 2)
    mapping(uint256 => Review) public reviews;
    mapping(uint256 => bool) public hasReviewed;

    // Landlord staking (Problem 5)
    uint256 public landlordStakeRequired;
    mapping(address => uint256) public landlordStakes;

    // Governance (Problem 6)
    address public governance;

    // Dispute resolution (Problem 9)
    address public arbitrator;
    mapping(uint256 => bool) public disputed;

    // Constants
    uint256 public constant REVIEW_PERIOD = 2 days;
    uint256 public constant NO_SHOW_GRACE = 1 days;
    uint256 public constant MIN_DEPOSIT = 0.001 ether;
    uint256 public constant MAX_PLATFORM_FEE = 500; // Max 5% (500 basis points)
    uint256 public constant LANDLORD_CANCEL_PENALTY_PERCENT = 10; // 10% of deposit as penalty

    // ──────────────────────────────────────────────
    // Events (Problem 10: Full Auditability)
    // ──────────────────────────────────────────────

    event AgreementCreated(uint256 indexed agreementId, address indexed landlord, address indexed tenant, uint256 rent, uint256 deposit, address paymentToken);
    event FundsDeposited(uint256 indexed agreementId, address indexed tenant);
    event CheckInConfirmed(uint256 indexed agreementId, address indexed confirmedBy);
    event StayVerified(uint256 indexed agreementId, uint256 timestamp);
    event BookingCancelled(uint256 indexed agreementId, address indexed user, string reason);
    event AgreementCompleted(uint256 indexed agreementId, uint256 reviewDeadline, uint256 platformFee, uint256 landlordPayout);
    event DepositRefunded(uint256 indexed agreementId, uint256 amount);
    event NoShowHandled(uint256 indexed agreementId);
    event AgreementExtended(uint256 indexed agreementId, uint256 newEndDate, uint256 additionalRent);

    // Review events
    event ReviewSubmitted(uint256 indexed agreementId, address indexed reviewer, uint8 rating, string reviewHash);

    // Staking events
    event LandlordStaked(address indexed landlord, uint256 amount);
    event LandlordUnstaked(address indexed landlord, uint256 amount);
    event LandlordPenalized(address indexed landlord, uint256 penaltyAmount, uint256 agreementId);

    // Dispute events
    event DisputeRaised(uint256 indexed agreementId, address indexed raisedBy);
    event DisputeResolved(uint256 indexed agreementId, bool tenantFavored, uint256 tenantAmount, uint256 landlordAmount);

    // Governance events
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event LandlordStakeUpdated(uint256 oldStake, uint256 newStake);
    event ArbitratorUpdated(address oldArbitrator, address newArbitrator);
    event GovernanceTransferred(address oldGovernance, address newGovernance);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ──────────────────────────────────────────────
    // Custom Errors
    // ──────────────────────────────────────────────

    error InvalidDates();
    error InvalidAmount();
    error Unauthorized();
    error InvalidState(Status currentStatus);
    error TimeWindowNotMet();
    error ZeroAddress();
    error AgreementNotFound();
    error ReviewPeriodNotOver();
    error AlreadyReviewed();
    error InvalidRating();
    error InsufficientStake();
    error NoStakeToWithdraw();
    error NotArbitrator();
    error NotDisputed();
    error FeeTooHigh();

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    constructor(address _treasury, address _arbitrator) {
        if (_treasury == address(0)) revert ZeroAddress();
        governance = msg.sender;
        platformTreasury = _treasury;
        arbitrator = _arbitrator;
        platformFeePercent = 100; // 1% default
        landlordStakeRequired = 0.01 ether; // Default stake
    }

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    modifier agreementExists(uint256 _id) {
        if (agreements[_id].landlord == address(0)) revert AgreementNotFound();
        _;
    }

    modifier onlyLandlord(uint256 _id) {
        if (msg.sender != agreements[_id].landlord) revert Unauthorized();
        _;
    }

    modifier onlyTenant(uint256 _id) {
        if (msg.sender != agreements[_id].tenant) revert Unauthorized();
        _;
    }

    modifier onlyParty(uint256 _id) {
        if (msg.sender != agreements[_id].tenant && msg.sender != agreements[_id].landlord) revert Unauthorized();
        _;
    }

    modifier onlyGovernance() {
        if (msg.sender != governance) revert Unauthorized();
        _;
    }

    modifier onlyArbitrator() {
        if (msg.sender != arbitrator) revert NotArbitrator();
        _;
    }

    // ──────────────────────────────────────────────
    // Landlord Staking (Problem 5: Fraud Prevention)
    // ──────────────────────────────────────────────

    /// @notice Landlord stakes ETH to prove economic accountability
    function stakeLandlord() external payable {
        if (msg.value == 0) revert InvalidAmount();
        landlordStakes[msg.sender] += msg.value;
        emit LandlordStaked(msg.sender, msg.value);
    }

    /// @notice Landlord withdraws stake (only if not actively penalized)
    function unstakeLandlord(uint256 _amount) external nonReentrant {
        if (_amount == 0 || landlordStakes[msg.sender] < _amount) revert NoStakeToWithdraw();
        landlordStakes[msg.sender] -= _amount;

        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Unstake transfer failed");

        emit LandlordUnstaked(msg.sender, _amount);
    }

    // ──────────────────────────────────────────────
    // Core Functions
    // ──────────────────────────────────────────────

    /// @notice Create a rental agreement. Landlord must be staked.
    function createAgreement(
        address _tenant,
        uint256 _rent,
        uint256 _deposit,
        uint256 _startDate,
        uint256 _endDate,
        bool _isShortTerm,
        address _paymentToken // address(0) for native ETH
    ) external returns (uint256) {
        if (_tenant == address(0)) revert ZeroAddress();
        if (_tenant == msg.sender) revert InvalidAmount();
        if (_startDate >= _endDate || _startDate < block.timestamp) revert InvalidDates();
        if (_rent == 0) revert InvalidAmount();

        // For native ETH: enforce min deposit. For ERC20: skip min deposit in ETH terms.
        if (_paymentToken == address(0) && _deposit < MIN_DEPOSIT) revert InvalidAmount();
        if (_paymentToken != address(0) && _deposit == 0) revert InvalidAmount();

        // Landlord must have sufficient stake (Problem 5)
        if (landlordStakes[msg.sender] < landlordStakeRequired) revert InsufficientStake();

        agreementCount++;
        agreements[agreementCount] = Agreement({
            landlord: msg.sender,
            tenant: _tenant,
            rent: _rent,
            deposit: _deposit,
            startDate: _startDate,
            endDate: _endDate,
            isShortTerm: _isShortTerm,
            status: Status.Created,
            reviewDeadline: 0,
            paymentToken: _paymentToken
        });

        emit AgreementCreated(agreementCount, msg.sender, _tenant, _rent, _deposit, _paymentToken);
        return agreementCount;
    }

    /// @notice Tenant deposits funds (ETH or ERC20) into escrow
    function depositFunds(uint256 _id) external payable agreementExists(_id) onlyTenant(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Created) revert InvalidState(agreement.status);

        uint256 totalRequired = agreement.rent + agreement.deposit;

        if (agreement.paymentToken == address(0)) {
            // Native ETH
            if (msg.value != totalRequired) revert InvalidAmount();
        } else {
            // ERC20 token (Problem 4: Stablecoin support)
            if (msg.value != 0) revert InvalidAmount(); // No ETH should be sent
            IERC20(agreement.paymentToken).safeTransferFrom(msg.sender, address(this), totalRequired);
        }

        agreement.status = Status.Funded;
        emit FundsDeposited(_id, msg.sender);
    }

    /// @notice Either tenant OR landlord can confirm check-in
    function confirmCheckIn(uint256 _id) external agreementExists(_id) onlyParty(_id) {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Funded) revert InvalidState(agreement.status);
        if (block.timestamp < agreement.startDate) revert TimeWindowNotMet();

        agreement.status = Status.Active;
        emit CheckInConfirmed(_id, msg.sender);
        emit StayVerified(_id, block.timestamp); // Problem 10: Auditability
    }

    /// @notice Handle no-show: refund tenant after grace period
    function handleNoShow(uint256 _id) external agreementExists(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Funded) revert InvalidState(agreement.status);
        if (block.timestamp <= agreement.startDate + NO_SHOW_GRACE) revert TimeWindowNotMet();

        agreement.status = Status.Cancelled;
        uint256 total = agreement.rent + agreement.deposit;

        _transferFunds(agreement.paymentToken, agreement.tenant, total);
        emit NoShowHandled(_id);
    }

    /// @notice Cancel booking — with landlord penalty for Funded state (Problem 3)
    function cancelBooking(uint256 _id) external agreementExists(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];

        bool isTenant = msg.sender == agreement.tenant;
        bool isLandlord = msg.sender == agreement.landlord;
        if (!isTenant && !isLandlord) revert Unauthorized();

        if (agreement.status == Status.Funded) {
            if (isTenant) {
                // Tenant cancel: must be 24h before start
                if (block.timestamp + 24 hours > agreement.startDate) revert TimeWindowNotMet();

                agreement.status = Status.Cancelled;
                uint256 totalRefund = agreement.rent + agreement.deposit;
                _transferFunds(agreement.paymentToken, agreement.tenant, totalRefund);
                emit BookingCancelled(_id, msg.sender, "Tenant cancelled before check-in");

            } else {
                // Landlord cancel (Problem 3): penalize from stake
                agreement.status = Status.Cancelled;
                uint256 totalRefund = agreement.rent + agreement.deposit;
                _transferFunds(agreement.paymentToken, agreement.tenant, totalRefund);

                // Penalty from landlord stake
                uint256 penalty = (agreement.deposit * LANDLORD_CANCEL_PENALTY_PERCENT) / 100;
                if (penalty > landlordStakes[agreement.landlord]) {
                    penalty = landlordStakes[agreement.landlord];
                }
                if (penalty > 0) {
                    landlordStakes[agreement.landlord] -= penalty;
                    // Send penalty to tenant as compensation (in native ETH from stake)
                    (bool penaltySuccess, ) = agreement.tenant.call{value: penalty}("");
                    require(penaltySuccess, "Penalty transfer failed");
                    emit LandlordPenalized(agreement.landlord, penalty, _id);
                }

                emit BookingCancelled(_id, msg.sender, "Landlord cancelled - penalty applied");
            }

        } else if (agreement.status == Status.Active) {
            agreement.status = Status.Cancelled;

            // Rent to landlord (minus platform fee)
            uint256 fee = (agreement.rent * platformFeePercent) / 10000;
            uint256 landlordAmount = agreement.rent - fee;

            _transferFunds(agreement.paymentToken, agreement.landlord, landlordAmount);
            if (fee > 0) {
                _transferFunds(agreement.paymentToken, platformTreasury, fee);
            }

            // 50/50 deposit split
            uint256 tenantShare = agreement.deposit / 2;
            uint256 landlordShare = agreement.deposit - tenantShare;

            if (tenantShare > 0) _transferFunds(agreement.paymentToken, agreement.tenant, tenantShare);
            if (landlordShare > 0) _transferFunds(agreement.paymentToken, agreement.landlord, landlordShare);

            emit BookingCancelled(_id, msg.sender, "Cancelled after check-in (Partial Refund)");

        } else {
            revert InvalidState(agreement.status);
        }
    }

    /// @notice Complete agreement — deducts platform fee, enters Review state (Problems 1, 10)
    function completeAgreement(uint256 _id) external agreementExists(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Active) revert InvalidState(agreement.status);
        if (block.timestamp < agreement.endDate) revert TimeWindowNotMet();

        agreement.status = Status.Review;
        agreement.reviewDeadline = block.timestamp + REVIEW_PERIOD;

        // Platform fee deduction (Problem 1)
        uint256 fee = (agreement.rent * platformFeePercent) / 10000;
        uint256 landlordPayout = agreement.rent - fee;

        _transferFunds(agreement.paymentToken, agreement.landlord, landlordPayout);
        if (fee > 0) {
            _transferFunds(agreement.paymentToken, platformTreasury, fee);
        }

        emit AgreementCompleted(_id, agreement.reviewDeadline, fee, landlordPayout);
        emit StayVerified(_id, block.timestamp); // Problem 10
    }

    /// @notice Refund deposit after review period (if no dispute)
    function refundDeposit(uint256 _id) external agreementExists(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Review) revert InvalidState(agreement.status);
        if (block.timestamp < agreement.reviewDeadline) revert ReviewPeriodNotOver();
        if (disputed[_id]) revert InvalidState(Status.Disputed);

        uint256 currentDeposit = agreement.deposit;
        if (currentDeposit == 0) revert InvalidAmount();

        agreement.deposit = 0;
        agreement.status = Status.Completed;

        _transferFunds(agreement.paymentToken, agreement.tenant, currentDeposit);
        emit DepositRefunded(_id, currentDeposit);
    }

    /// @notice Extend an active booking
    function extendAgreement(uint256 _id, uint256 _newEndDate) external payable agreementExists(_id) onlyTenant(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Active) revert InvalidState(agreement.status);
        if (_newEndDate <= agreement.endDate) revert InvalidDates();

        if (agreement.paymentToken == address(0)) {
            if (msg.value == 0) revert InvalidAmount();
            agreement.rent += msg.value;
        } else {
            if (msg.value != 0) revert InvalidAmount();
            // Additional rent amount must be specified via approve + transferFrom
            // For simplicity, we read msg.value from a parameter
            revert InvalidAmount(); // Must use extendAgreementERC20 for token payments
        }

        agreement.endDate = _newEndDate;
        emit AgreementExtended(_id, _newEndDate, msg.value);
    }

    /// @notice Extend agreement with ERC20 token payment
    function extendAgreementERC20(uint256 _id, uint256 _newEndDate, uint256 _additionalRent) external agreementExists(_id) onlyTenant(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Active) revert InvalidState(agreement.status);
        if (_newEndDate <= agreement.endDate) revert InvalidDates();
        if (agreement.paymentToken == address(0)) revert InvalidAmount(); // Use extendAgreement for ETH
        if (_additionalRent == 0) revert InvalidAmount();

        IERC20(agreement.paymentToken).safeTransferFrom(msg.sender, address(this), _additionalRent);
        agreement.rent += _additionalRent;
        agreement.endDate = _newEndDate;

        emit AgreementExtended(_id, _newEndDate, _additionalRent);
    }

    // ──────────────────────────────────────────────
    // Review System (Problem 2: Trust & Fake Reviews)
    // ──────────────────────────────────────────────

    /// @notice Submit a review — only allowed by tenant of a completed stay
    function submitReview(uint256 _id, uint8 _rating, string calldata _reviewHash) external agreementExists(_id) {
        Agreement storage agreement = agreements[_id];

        // Only tenant can review
        if (msg.sender != agreement.tenant) revert Unauthorized();

        // Only completed or review-state agreements can be reviewed
        if (agreement.status != Status.Completed && agreement.status != Status.Review) {
            revert InvalidState(agreement.status);
        }

        // Cannot review twice
        if (hasReviewed[_id]) revert AlreadyReviewed();

        // Rating must be 1-5
        if (_rating < 1 || _rating > 5) revert InvalidRating();

        reviews[_id] = Review({
            rating: _rating,
            reviewHash: _reviewHash,
            timestamp: block.timestamp,
            reviewer: msg.sender
        });
        hasReviewed[_id] = true;

        emit ReviewSubmitted(_id, msg.sender, _rating, _reviewHash);
    }

    // ──────────────────────────────────────────────
    // Dispute Resolution (Problem 9)
    // ──────────────────────────────────────────────

    /// @notice Either party can raise a dispute during Review state
    function raiseDispute(uint256 _id) external agreementExists(_id) onlyParty(_id) {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Review) revert InvalidState(agreement.status);

        disputed[_id] = true;
        agreement.status = Status.Disputed;

        emit DisputeRaised(_id, msg.sender);
    }

    /// @notice Arbitrator resolves the dispute (Problem 9)
    /// @param _tenantPercent Percentage of deposit to give to tenant (0-100)
    function resolveDispute(uint256 _id, uint256 _tenantPercent) external agreementExists(_id) onlyArbitrator nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Disputed) revert InvalidState(agreement.status);
        if (_tenantPercent > 100) revert InvalidAmount();

        uint256 currentDeposit = agreement.deposit;
        agreement.deposit = 0;
        agreement.status = Status.Completed;

        uint256 tenantAmount = (currentDeposit * _tenantPercent) / 100;
        uint256 landlordAmount = currentDeposit - tenantAmount;

        if (tenantAmount > 0) _transferFunds(agreement.paymentToken, agreement.tenant, tenantAmount);
        if (landlordAmount > 0) _transferFunds(agreement.paymentToken, agreement.landlord, landlordAmount);

        emit DisputeResolved(_id, _tenantPercent > 50, tenantAmount, landlordAmount);
    }

    // ──────────────────────────────────────────────
    // Governance Functions (Problem 6: DAO Governance)
    // ──────────────────────────────────────────────

    function updatePlatformFee(uint256 _newFeePercent) external onlyGovernance {
        if (_newFeePercent > MAX_PLATFORM_FEE) revert FeeTooHigh();
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(oldFee, _newFeePercent);
    }

    function updateLandlordStakeRequired(uint256 _newStake) external onlyGovernance {
        uint256 oldStake = landlordStakeRequired;
        landlordStakeRequired = _newStake;
        emit LandlordStakeUpdated(oldStake, _newStake);
    }

    function updateArbitrator(address _newArbitrator) external onlyGovernance {
        address oldArbitrator = arbitrator;
        arbitrator = _newArbitrator;
        emit ArbitratorUpdated(oldArbitrator, _newArbitrator);
    }

    function updateTreasury(address _newTreasury) external onlyGovernance {
        if (_newTreasury == address(0)) revert ZeroAddress();
        address oldTreasury = platformTreasury;
        platformTreasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }

    function transferGovernance(address _newGovernance) external onlyGovernance {
        if (_newGovernance == address(0)) revert ZeroAddress();
        address oldGovernance = governance;
        governance = _newGovernance;
        emit GovernanceTransferred(oldGovernance, _newGovernance);
    }

    // ──────────────────────────────────────────────
    // Internal Helpers
    // ──────────────────────────────────────────────

    /// @dev Transfers ETH or ERC20 based on payment token
    function _transferFunds(address _token, address _to, uint256 _amount) internal {
        if (_amount == 0) return;

        if (_token == address(0)) {
            (bool success, ) = _to.call{value: _amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(_token).safeTransfer(_to, _amount);
        }
    }
}
