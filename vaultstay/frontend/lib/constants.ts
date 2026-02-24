export const ESCROW_CONTRACT_ADDRESS = "0xDD9b3CC1657e74cBF44B8e4894c005940f904820"; // VaultStayCore V2 – Sepolia Testnet

export const ESCROW_ABI = [
    // Write functions — Core Escrow
    "function createAgreement(address _tenant, uint256 _rent, uint256 _deposit, uint256 _startDate, uint256 _endDate, bool _isShortTerm, address _paymentToken) external returns (uint256)",
    "function depositFunds(uint256 _id) external payable",
    "function confirmCheckIn(uint256 _id) external",
    "function cancelBooking(uint256 _id) external",
    "function completeAgreement(uint256 _id) external",
    "function refundDeposit(uint256 _id) external",
    "function handleNoShow(uint256 _id) external",
    "function extendAgreement(uint256 _id, uint256 _newEndDate) external payable",
    "function extendAgreementERC20(uint256 _id, uint256 _newEndDate, uint256 _additionalRent) external",

    // Write functions — Landlord Staking
    "function stakeLandlord() external payable",
    "function unstakeLandlord(uint256 _amount) external",

    // Write functions — Reviews
    "function submitReview(uint256 _id, uint8 _rating, string _reviewHash) external",

    // Write functions — Disputes
    "function raiseDispute(uint256 _id) external",
    "function resolveDispute(uint256 _id, uint256 _tenantPercent) external",

    // Write functions — Governance
    "function updatePlatformFee(uint256 _newFeePercent) external",
    "function updateLandlordStakeRequired(uint256 _newStake) external",
    "function updateArbitrator(address _newArbitrator) external",
    "function updateTreasury(address _newTreasury) external",
    "function transferGovernance(address _newGovernance) external",

    // Read functions
    "function agreementCount() external view returns (uint256)",
    "function agreements(uint256) external view returns (address landlord, address tenant, uint256 rent, uint256 deposit, uint256 startDate, uint256 endDate, bool isShortTerm, uint8 status, uint256 reviewDeadline, address paymentToken)",
    "function reviews(uint256) external view returns (uint8 rating, string reviewHash, uint256 timestamp, address reviewer)",
    "function hasReviewed(uint256) external view returns (bool)",
    "function landlordStakes(address) external view returns (uint256)",
    "function disputed(uint256) external view returns (bool)",
    "function platformFeePercent() external view returns (uint256)",
    "function platformTreasury() external view returns (address)",
    "function landlordStakeRequired() external view returns (uint256)",
    "function governance() external view returns (address)",
    "function arbitrator() external view returns (address)",
    "function REVIEW_PERIOD() external view returns (uint256)",
    "function NO_SHOW_GRACE() external view returns (uint256)",
    "function MIN_DEPOSIT() external view returns (uint256)",
    "function MAX_PLATFORM_FEE() external view returns (uint256)",
    "function LANDLORD_CANCEL_PENALTY_PERCENT() external view returns (uint256)",

    // Events — Core
    "event AgreementCreated(uint256 indexed agreementId, address indexed landlord, address indexed tenant, uint256 rent, uint256 deposit, address paymentToken)",
    "event FundsDeposited(uint256 indexed agreementId, address indexed tenant)",
    "event CheckInConfirmed(uint256 indexed agreementId, address indexed confirmedBy)",
    "event StayVerified(uint256 indexed agreementId, uint256 timestamp)",
    "event BookingCancelled(uint256 indexed agreementId, address indexed user, string reason)",
    "event AgreementCompleted(uint256 indexed agreementId, uint256 reviewDeadline, uint256 platformFee, uint256 landlordPayout)",
    "event DepositRefunded(uint256 indexed agreementId, uint256 amount)",
    "event NoShowHandled(uint256 indexed agreementId)",
    "event AgreementExtended(uint256 indexed agreementId, uint256 newEndDate, uint256 additionalRent)",

    // Events — Reviews
    "event ReviewSubmitted(uint256 indexed agreementId, address indexed reviewer, uint8 rating, string reviewHash)",

    // Events — Staking
    "event LandlordStaked(address indexed landlord, uint256 amount)",
    "event LandlordUnstaked(address indexed landlord, uint256 amount)",
    "event LandlordPenalized(address indexed landlord, uint256 penaltyAmount, uint256 agreementId)",

    // Events — Disputes
    "event DisputeRaised(uint256 indexed agreementId, address indexed raisedBy)",
    "event DisputeResolved(uint256 indexed agreementId, bool tenantFavored, uint256 tenantAmount, uint256 landlordAmount)",

    // Events — Governance
    "event PlatformFeeUpdated(uint256 oldFee, uint256 newFee)",
    "event LandlordStakeUpdated(uint256 oldStake, uint256 newStake)",
    "event ArbitratorUpdated(address oldArbitrator, address newArbitrator)",
    "event GovernanceTransferred(address oldGovernance, address newGovernance)",
    "event TreasuryUpdated(address oldTreasury, address newTreasury)",
];
