export const ESCROW_CONTRACT_ADDRESS = "0xDD9b3CC1657e74cBF44B8e4894c005940f904820"; // VaultStayCore – Sepolia Testnet

export const ESCROW_ABI = [
    // Write functions
    "function createAgreement(address _tenant, uint256 _rent, uint256 _deposit, uint256 _startDate, uint256 _endDate, bool _isShortTerm) external returns (uint256)",
    "function depositFunds(uint256 _id) external payable",
    "function confirmCheckIn(uint256 _id) external",
    "function cancelBooking(uint256 _id) external",
    "function completeAgreement(uint256 _id) external",
    "function refundDeposit(uint256 _id) external",
    // Read functions
    "function agreementCount() external view returns (uint256)",
    "function agreements(uint256) external view returns (address landlord, address tenant, uint256 rent, uint256 deposit, uint256 startDate, uint256 endDate, bool isShortTerm, uint8 status)",
    // Events
    "event AgreementCreated(uint256 indexed agreementId, address indexed landlord, address indexed tenant, uint256 rent, uint256 deposit)",
    "event FundsDeposited(uint256 indexed agreementId, address indexed tenant)",
    "event CheckInConfirmed(uint256 indexed agreementId)",
    "event BookingCancelled(uint256 indexed agreementId, address indexed user, string reason)",
    "event AgreementCompleted(uint256 indexed agreementId)",
    "event DepositRefunded(uint256 indexed agreementId, uint256 amount)",
];
