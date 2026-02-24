// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VaultStayCore is ReentrancyGuard {
    enum Status { Created, Funded, Active, Completed, Cancelled }

    struct Agreement {
        address landlord;
        address tenant;
        uint256 rent;
        uint256 deposit;
        uint256 startDate;
        uint256 endDate;
        bool isShortTerm;
        Status status;
    }

    uint256 public agreementCount;
    mapping(uint256 => Agreement) public agreements;

    // Events
    event AgreementCreated(uint256 indexed agreementId, address indexed landlord, address indexed tenant, uint256 rent, uint256 deposit);
    event FundsDeposited(uint256 indexed agreementId, address indexed tenant);
    event CheckInConfirmed(uint256 indexed agreementId);
    event BookingCancelled(uint256 indexed agreementId, address indexed user, string reason);
    event AgreementCompleted(uint256 indexed agreementId);
    event DepositRefunded(uint256 indexed agreementId, uint256 amount);

    // Custom Errors
    error InvalidDates();
    error InvalidAmount();
    error Unauthorized();
    error InvalidState(Status currentStatus);
    error TimeWindowNotMet();
    error ZeroAddress();

    modifier onlyLandlord(uint256 _id) {
        if (msg.sender != agreements[_id].landlord) revert Unauthorized();
        _;
    }

    modifier onlyTenant(uint256 _id) {
        if (msg.sender != agreements[_id].tenant) revert Unauthorized();
        _;
    }

    function createAgreement(
        address _tenant,
        uint256 _rent,
        uint256 _deposit,
        uint256 _startDate,
        uint256 _endDate,
        bool _isShortTerm
    ) external returns (uint256) {
        if (_tenant == address(0)) revert ZeroAddress();
        if (_startDate >= _endDate || _startDate < block.timestamp) revert InvalidDates();
        if (_rent == 0) revert InvalidAmount();

        agreementCount++;
        agreements[agreementCount] = Agreement({
            landlord: msg.sender,
            tenant: _tenant,
            rent: _rent,
            deposit: _deposit,
            startDate: _startDate,
            endDate: _endDate,
            isShortTerm: _isShortTerm,
            status: Status.Created
        });

        emit AgreementCreated(agreementCount, msg.sender, _tenant, _rent, _deposit);
        return agreementCount;
    }

    function depositFunds(uint256 _id) external payable onlyTenant(_id) nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Created) revert InvalidState(agreement.status);
        
        uint256 totalRequired = agreement.rent + agreement.deposit;
        if (msg.value != totalRequired) revert InvalidAmount();

        agreement.status = Status.Funded;
        emit FundsDeposited(_id, msg.sender);
    }

    function confirmCheckIn(uint256 _id) external onlyTenant(_id) {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Funded) revert InvalidState(agreement.status);
        if (block.timestamp < agreement.startDate) revert TimeWindowNotMet();

        agreement.status = Status.Active;
        emit CheckInConfirmed(_id);
    }

    function cancelBooking(uint256 _id) external nonReentrant {
        Agreement storage agreement = agreements[_id];
        
        bool isTenant = msg.sender == agreement.tenant;
        bool isLandlord = msg.sender == agreement.landlord;
        if (!isTenant && !isLandlord) revert Unauthorized();

        if (agreement.status == Status.Funded) {
             // Scenario A: Cancelled before checkin. Must be before 24-hours of start date for the tenant to do it freely.
             if (isTenant && block.timestamp > agreement.startDate - 24 hours) {
                 revert TimeWindowNotMet();
             }
             
             agreement.status = Status.Cancelled;
             uint256 totalRefund = agreement.rent + agreement.deposit;
             (bool success, ) = agreement.tenant.call{value: totalRefund}("");
             require(success, "Transfer failed");

             emit BookingCancelled(_id, msg.sender, "Cancelled before check-in");

        } else if (agreement.status == Status.Active) {
            // Scenario B: Cancelled after check-in. Rent retained, partial deposit refund (e.g. 50%)
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

    function completeAgreement(uint256 _id) external nonReentrant {
        Agreement storage agreement = agreements[_id];
        if (agreement.status != Status.Active) revert InvalidState(agreement.status);
        if (block.timestamp < agreement.endDate) revert TimeWindowNotMet();

        agreement.status = Status.Completed;

        // Transfer rent to landlord
        (bool rentSuccess, ) = agreement.landlord.call{value: agreement.rent}("");
        require(rentSuccess, "Rent transfer failed");

        emit AgreementCompleted(_id);
    }

    function refundDeposit(uint256 _id) external nonReentrant {
        Agreement storage agreement = agreements[_id];
        // Can only refund deposit if completed
        if (agreement.status != Status.Completed) revert InvalidState(agreement.status);
        
        uint256 currentDeposit = agreement.deposit;
        if (currentDeposit == 0) revert InvalidAmount();
        
        agreement.deposit = 0; // Prevent double withdraw

        (bool success, ) = agreement.tenant.call{value: currentDeposit}("");
        require(success, "Deposit transfer failed");

        emit DepositRefunded(_id, currentDeposit);
    }
}
