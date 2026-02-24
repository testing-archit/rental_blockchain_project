// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VaultStayCore is ReentrancyGuard {
    enum Status { Created, Funded, Active, Completed, Review, Cancelled }

    struct Agreement {
        address landlord;
        address tenant;
        uint256 rent;
        uint256 deposit;
        uint256 startDate;
        uint256 endDate;
        bool isShortTerm;
        Status status;
        uint256 reviewDeadline; // Timestamp after which deposit can be refunded
    }

    uint256 public agreementCount;
    mapping(uint256 => Agreement) public agreements;

    uint256 public constant REVIEW_PERIOD = 2 days;
    uint256 public constant NO_SHOW_GRACE = 1 days;
    uint256 public constant MIN_DEPOSIT = 0.001 ether;

    // Events
    event AgreementCreated(uint256 indexed agreementId, address indexed landlord, address indexed tenant, uint256 rent, uint256 deposit);
    event FundsDeposited(uint256 indexed agreementId, address indexed tenant);
    event CheckInConfirmed(uint256 indexed agreementId, address indexed confirmedBy);
    event BookingCancelled(uint256 indexed agreementId, address indexed user, string reason);
    event AgreementCompleted(uint256 indexed agreementId, uint256 reviewDeadline);
    event DepositRefunded(uint256 indexed agreementId, uint256 amount);
    event NoShowHandled(uint256 indexed agreementId);
    event AgreementExtended(uint256 indexed agreementId, uint256 newEndDate, uint256 additionalRent);

    // Custom Errors
    error InvalidDates();
    error InvalidAmount();
    error Unauthorized();
    error InvalidState(Status currentStatus);
    error TimeWindowNotMet();
    error ZeroAddress();
    error AgreementNotFound();
    error ReviewPeriodNotOver();

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

    // ──────────────────────────────────────────────
    // Core Functions
    // ──────────────────────────────────────────────

    function createAgreement(
        address _tenant,
        uint256 _rent,
        uint256 _deposit,
        uint256 _startDate,
        uint256 _endDate,
        bool _isShortTerm
    ) external returns (uint256) {
        if (_tenant == address(0)) revert ZeroAddress();
        if (_tenant == msg.sender) revert InvalidAmount(); // Cannot rent to self
        if (_startDate >= _endDate || _startDate < block.timestamp) revert InvalidDates();
        if (_rent == 0) revert InvalidAmount();
        if (_deposit < MIN_DEPOSIT) revert InvalidAmount(); // Enforce minimum deposit

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
            reviewDeadline: 0
        });

        emit AgreementCreated(agreementCount, msg.sender, _tenant, _rent, _deposit);
        return agreementCount;
    }

    function depositFunds(uint256 _id) external payable agreementExists(_id) onlyTenant(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Created) revert InvalidState(agreement.status);

        uint256 totalRequired = agreement.rent + agreement.deposit;
        if (msg.value != totalRequired) revert InvalidAmount();

        agreement.status = Status.Funded;
        emit FundsDeposited(_id, msg.sender);
    }

    /// @notice Either tenant OR landlord can confirm check-in (fixes audit issue #2)
    function confirmCheckIn(uint256 _id) external agreementExists(_id) onlyParty(_id) {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Funded) revert InvalidState(agreement.status);
        if (block.timestamp < agreement.startDate) revert TimeWindowNotMet();

        agreement.status = Status.Active;
        emit CheckInConfirmed(_id, msg.sender);
    }

    /// @notice Handle no-show: if tenant funded but never checked in past the grace period (fixes audit issue #1)
    function handleNoShow(uint256 _id) external agreementExists(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Funded) revert InvalidState(agreement.status);

        // Only callable after startDate + grace period
        if (block.timestamp <= agreement.startDate + NO_SHOW_GRACE) revert TimeWindowNotMet();

        agreement.status = Status.Cancelled;

        uint256 total = agreement.rent + agreement.deposit;
        (bool success, ) = agreement.tenant.call{value: total}("");
        require(success, "No-show refund failed");

        emit NoShowHandled(_id);
    }

    function cancelBooking(uint256 _id) external agreementExists(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];

        bool isTenant = msg.sender == agreement.tenant;
        bool isLandlord = msg.sender == agreement.landlord;
        if (!isTenant && !isLandlord) revert Unauthorized();

        if (agreement.status == Status.Funded) {
            // FIX audit issue #3: Safe cancellation window check (no underflow)
            if (isTenant && block.timestamp + 24 hours > agreement.startDate) {
                revert TimeWindowNotMet();
            }

            agreement.status = Status.Cancelled;
            uint256 totalRefund = agreement.rent + agreement.deposit;
            (bool success, ) = agreement.tenant.call{value: totalRefund}("");
            require(success, "Transfer failed");

            emit BookingCancelled(_id, msg.sender, "Cancelled before check-in");

        } else if (agreement.status == Status.Active) {
            // Cancelled after check-in. Rent retained, partial deposit refund (50%)
            agreement.status = Status.Cancelled;

            // Rent goes to landlord
            (bool rentSuccess, ) = agreement.landlord.call{value: agreement.rent}("");
            require(rentSuccess, "Rent transfer failed");

            // Partial deposit refund to tenant (50%), rest to landlord
            uint256 tenantShare = agreement.deposit / 2;
            uint256 landlordShare = agreement.deposit - tenantShare;

            if (tenantShare > 0) {
                (bool tDep, ) = agreement.tenant.call{value: tenantShare}("");
                require(tDep, "Tenant deposit transfer failed");
            }
            if (landlordShare > 0) {
                (bool lDep, ) = agreement.landlord.call{value: landlordShare}("");
                require(lDep, "Landlord deposit transfer failed");
            }

            emit BookingCancelled(_id, msg.sender, "Cancelled after check-in (Partial Refund)");

        } else {
            revert InvalidState(agreement.status);
        }
    }

    /// @notice Complete agreement — transitions to Review state with a review deadline (fixes audit issue #4)
    function completeAgreement(uint256 _id) external agreementExists(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Active) revert InvalidState(agreement.status);
        if (block.timestamp < agreement.endDate) revert TimeWindowNotMet();

        agreement.status = Status.Review;
        agreement.reviewDeadline = block.timestamp + REVIEW_PERIOD;

        // Transfer rent to landlord immediately
        (bool rentSuccess, ) = agreement.landlord.call{value: agreement.rent}("");
        require(rentSuccess, "Rent transfer failed");

        emit AgreementCompleted(_id, agreement.reviewDeadline);
    }

    /// @notice Deposit can only be refunded after the review period expires (fixes audit issue #4)
    function refundDeposit(uint256 _id) external agreementExists(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Review) revert InvalidState(agreement.status);
        if (block.timestamp < agreement.reviewDeadline) revert ReviewPeriodNotOver();

        uint256 currentDeposit = agreement.deposit;
        if (currentDeposit == 0) revert InvalidAmount();

        agreement.deposit = 0; // Prevent double withdraw
        agreement.status = Status.Completed;

        (bool success, ) = agreement.tenant.call{value: currentDeposit}("");
        require(success, "Deposit transfer failed");

        emit DepositRefunded(_id, currentDeposit);
    }

    // ──────────────────────────────────────────────
    // Extension Feature (fixes audit issue #7)
    // ──────────────────────────────────────────────

    /// @notice Extend an active booking by paying additional rent
    function extendAgreement(uint256 _id, uint256 _newEndDate) external payable agreementExists(_id) onlyTenant(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Active) revert InvalidState(agreement.status);
        if (_newEndDate <= agreement.endDate) revert InvalidDates();
        if (msg.value == 0) revert InvalidAmount();

        agreement.endDate = _newEndDate;
        agreement.rent += msg.value;

        emit AgreementExtended(_id, _newEndDate, msg.value);
    }
}
