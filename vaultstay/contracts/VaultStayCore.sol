// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VaultStayCore is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────
    // ENUMS
    // ─────────────────────────────

    enum Status { Created, Funded, Active, Review, Completed, Cancelled, Disputed }

    // ─────────────────────────────
    // STRUCTS
    // ─────────────────────────────

    struct Agreement {
        address landlord;
        address tenant;
        address token; // address(0) = ETH
        uint256 rent;
        uint256 deposit;
        uint256 startDate;
        uint256 endDate;
        uint256 ratePerSecond;
        uint256 reviewDeadline;
        Status status;
    }

    struct Review {
        uint8 rating;
        string ipfsHash;
        address reviewer;
        uint256 timestamp;
    }

    // ─────────────────────────────
    // STATE
    // ─────────────────────────────

    uint256 public agreementCount;

    mapping(uint256 => Agreement) public agreements;
    mapping(uint256 => Review) public tenantReviews;
    mapping(uint256 => Review) public landlordReviews;

    // Governance
    address public governance;
    address public treasury;
    address public arbitrator;

    uint256 public platformFeeBps = 100; // 1%
    uint256 public constant MAX_FEE_BPS = 500;

    // Staking
    uint256 public landlordStakeRequired = 0.01 ether;
    mapping(address => uint256) public landlordStake;
    mapping(address => uint256) public activeAgreements;

    // Disputes
    mapping(uint256 => uint256) public disputeRaisedAt;

    // Constants
    uint256 public constant MAX_DURATION = 365 days;
    uint256 public constant REVIEW_PERIOD = 2 days;
    uint256 public constant NO_SHOW_GRACE = 1 days;
    uint256 public constant DISPUTE_TIMEOUT = 30 days;

    // ─────────────────────────────
    // MODIFIERS
    // ─────────────────────────────

    modifier onlyGov() {
        require(msg.sender == governance, "Not governance");
        _;
    }

    modifier exists(uint256 id) {
        require(agreements[id].landlord != address(0), "Invalid ID");
        _;
    }

    modifier onlyParty(uint256 id) {
        Agreement storage a = agreements[id];
        require(msg.sender == a.landlord || msg.sender == a.tenant, "Not party");
        _;
    }

    // ─────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────

    constructor(address _treasury, address _arbitrator) {
        require(_treasury != address(0));
        governance = msg.sender;
        treasury = _treasury;
        arbitrator = _arbitrator;
    }

    // ─────────────────────────────
    // STAKING
    // ─────────────────────────────

    function stake() external payable {
        require(msg.value > 0);
        landlordStake[msg.sender] += msg.value;
    }

    function unstake(uint256 amount) external nonReentrant {
        require(activeAgreements[msg.sender] == 0, "Active agreements exist");
        require(landlordStake[msg.sender] >= amount);

        landlordStake[msg.sender] -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok);
    }

    // ─────────────────────────────
    // CREATE AGREEMENT
    // ─────────────────────────────

    function createAgreement(
        address tenant,
        address token,
        uint256 rent,
        uint256 deposit,
        uint256 start,
        uint256 end
    ) external returns (uint256) {

        require(tenant != address(0) && tenant != msg.sender);
        require(rent > 0 && deposit > 0);
        require(start > block.timestamp);
        require(end > start);
        require(end - start <= MAX_DURATION);
        require(landlordStake[msg.sender] >= landlordStakeRequired);

        uint256 duration = end - start;
        uint256 ratePerSecond = rent / duration;

        agreementCount++;

        agreements[agreementCount] = Agreement({
            landlord: msg.sender,
            tenant: tenant,
            token: token,
            rent: rent,
            deposit: deposit,
            startDate: start,
            endDate: end,
            ratePerSecond: ratePerSecond,
            reviewDeadline: 0,
            status: Status.Created
        });

        activeAgreements[msg.sender]++;

        return agreementCount;
    }

    // ─────────────────────────────
    // DEPOSIT
    // ─────────────────────────────

    function deposit(uint256 id) external payable exists(id) nonReentrant {
        Agreement storage a = agreements[id];
        require(msg.sender == a.tenant);
        require(a.status == Status.Created);

        uint256 total = a.rent + a.deposit;

        if (a.token == address(0)) {
            require(msg.value == total);
        } else {
            IERC20(a.token).safeTransferFrom(msg.sender, address(this), total);
        }

        a.status = Status.Funded;
    }

    // ─────────────────────────────
    // CHECK-IN
    // ─────────────────────────────

    function confirmCheckIn(uint256 id) external exists(id) onlyParty(id) {
        Agreement storage a = agreements[id];
        require(a.status == Status.Funded);
        require(block.timestamp >= a.startDate);
        a.status = Status.Active;
    }

    // ─────────────────────────────
    // NO SHOW
    // ─────────────────────────────

    function handleNoShow(uint256 id) external exists(id) nonReentrant {
        Agreement storage a = agreements[id];
        require(a.status == Status.Funded);
        require(block.timestamp > a.startDate + NO_SHOW_GRACE);

        a.status = Status.Cancelled;
        _payout(a.token, a.tenant, a.rent + a.deposit);
        activeAgreements[a.landlord]--;
    }

    // ─────────────────────────────
    // COMPLETE
    // ─────────────────────────────

    function complete(uint256 id) external exists(id) nonReentrant {
        Agreement storage a = agreements[id];
        require(a.status == Status.Active);
        require(block.timestamp >= a.endDate);

        a.status = Status.Review;
        a.reviewDeadline = block.timestamp + REVIEW_PERIOD;

        uint256 fee = (a.rent * platformFeeBps) / 10000;
        uint256 landlordAmount = a.rent - fee;

        _payout(a.token, a.landlord, landlordAmount);
        if (fee > 0) _payout(a.token, treasury, fee);
    }

    // ─────────────────────────────
    // REFUND
    // ─────────────────────────────

    function refundDeposit(uint256 id) external exists(id) nonReentrant {
        Agreement storage a = agreements[id];
        require(a.status == Status.Review);
        require(block.timestamp >= a.reviewDeadline);

        a.status = Status.Completed;
        _payout(a.token, a.tenant, a.deposit);
        activeAgreements[a.landlord]--;
    }

    // ─────────────────────────────
    // DISPUTE
    // ─────────────────────────────

    function raiseDispute(uint256 id) external exists(id) onlyParty(id) {
        Agreement storage a = agreements[id];
        require(a.status == Status.Review);

        a.status = Status.Disputed;
        disputeRaisedAt[id] = block.timestamp;
    }

    function resolveDispute(uint256 id, uint256 tenantPercent)
        external
        exists(id)
        nonReentrant
    {
        require(msg.sender == arbitrator);
        require(tenantPercent <= 100);

        Agreement storage a = agreements[id];
        require(a.status == Status.Disputed);

        uint256 tenantAmount = (a.deposit * tenantPercent) / 100;
        uint256 landlordAmount = a.deposit - tenantAmount;

        a.status = Status.Completed;
        a.deposit = 0;

        _payout(a.token, a.tenant, tenantAmount);
        _payout(a.token, a.landlord, landlordAmount);

        activeAgreements[a.landlord]--;
    }

    function emergencyResolve(uint256 id) external exists(id) onlyParty(id) nonReentrant {
        Agreement storage a = agreements[id];
        require(a.status == Status.Disputed);
        require(block.timestamp > disputeRaisedAt[id] + DISPUTE_TIMEOUT);

        uint256 half = a.deposit / 2;

        a.status = Status.Completed;
        a.deposit = 0;

        _payout(a.token, a.tenant, half);
        _payout(a.token, a.landlord, half);

        activeAgreements[a.landlord]--;
    }

    // ─────────────────────────────
    // REVIEWS
    // ─────────────────────────────

    function reviewTenant(uint256 id, uint8 rating, string calldata hash)
        external exists(id)
    {
        Agreement storage a = agreements[id];
        require(a.status == Status.Completed);
        require(msg.sender == a.landlord);
        require(rating >= 1 && rating <= 5);

        tenantReviews[id] = Review(rating, hash, msg.sender, block.timestamp);
    }

    function reviewLandlord(uint256 id, uint8 rating, string calldata hash)
        external exists(id)
    {
        Agreement storage a = agreements[id];
        require(a.status == Status.Completed);
        require(msg.sender == a.tenant);
        require(rating >= 1 && rating <= 5);

        landlordReviews[id] = Review(rating, hash, msg.sender, block.timestamp);
    }

    // ─────────────────────────────
    // GOVERNANCE
    // ─────────────────────────────

    function setFee(uint256 newBps) external onlyGov {
        require(newBps <= MAX_FEE_BPS);
        platformFeeBps = newBps;
    }

    function setStakeRequired(uint256 amount) external onlyGov {
        landlordStakeRequired = amount;
    }

    function setArbitrator(address a) external onlyGov {
        arbitrator = a;
    }

    function transferGovernance(address newGov) external onlyGov {
        governance = newGov;
    }

    // ─────────────────────────────
    // INTERNAL
    // ─────────────────────────────

    function _payout(address token, address to, uint256 amount) internal {
        if (amount == 0) return;

        if (token == address(0)) {
            (bool ok,) = to.call{value: amount}("");
            require(ok);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }
}
