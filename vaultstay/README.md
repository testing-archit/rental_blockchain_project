# VaultStay

**Decentralized Rental & Short-Stay Escrow System**

## 1. Abstract

VaultStay is a decentralized rental and short-stay escrow platform designed to eliminate centralized financial control in property booking systems. The platform leverages smart contracts on Ethereum to securely lock, manage, and release rental payments based on predefined contractual logic.

Unlike centralized platforms such as Airbnb, VaultStay ensures that funds are not held by a third party but are instead governed by immutable smart contract conditions. The system supports both long-term rental agreements and short-term booking models with automated cancellation and refund mechanisms.

VaultStay combines blockchain transparency with a modern Web3 frontend architecture to provide a seamless decentralized booking experience.

## 2. Problem Statement

Centralized rental platforms introduce:
- Custodial control over user funds
- High service fees
- Delayed refund processing
- Opaque dispute handling

Users lack transparency regarding how escrow funds are stored and released.

**The core problem addressed by VaultStay is:**
How can rental payments and short-term booking funds be secured and settled automatically without relying on centralized intermediaries?

## 3. Proposed Solution

VaultStay introduces a smart contract–based escrow system where:
- Rent + security deposit are locked in a smart contract.
- Funds are released automatically based on time and confirmation logic.
- Cancellation policies are enforced programmatically.
- All financial activity is transparent on-chain.

**The system supports:**
- Long-term leases (monthly rentals)
- Short-term bookings (1–30 days)
- Automated deposit refund
- Time-based settlement logic

## 4. Technology Stack

### Smart Contracts
- **Solidity ^0.8.20**
- **Hardhat** (development & deployment framework)

### Frontend
- **Next.js 14** (App Router architecture)
- **React**
- **Tailwind CSS**

### Web3 Integration
- **Wagmi**
- **Viem**
- **RainbowKit**
- **Ethers.js**

### Animations
- **Framer Motion**

### Testing
- **Chai**
- **Ethers** (Hardhat tooling)

This stack ensures scalability, modularity, and industry-standard development practices.

## 5. System Architecture

### Architectural Layers

**1. Blockchain Layer**
- Smart contracts deployed using Hardhat.
- Escrow logic implemented in Solidity.
- Deployed on Ethereum testnet (Sepolia recommended).

**2. Web3 Interaction Layer**
- Wagmi manages contract hooks.
- Viem handles RPC calls.
- RainbowKit enables wallet authentication.
- Ethers.js used for transaction handling.

**3. Frontend Layer**
- Next.js App Router architecture.
- Tailwind CSS for UI styling.
- Framer Motion for booking transitions and animations.

## 6. Core Functional Modules

### 6.1 Property Listing Module
Landlord creates a rental agreement specifying:
- Rent amount
- Security deposit
- Booking type (Short / Long)
- Start date
- End date

Smart contract assigns:
- Agreement ID
- Status = Created

### 6.2 Escrow Deposit Module
Tenant sends:
- rent + security deposit

Conditions enforced:
- Exact value match
- Tenant-only access
- Single deposit per agreement

Status updates:
- Created → Funded

### 6.3 Check-In Confirmation Module
Either tenant **or** landlord can confirm check-in.
- Status: Funded → Active
- Prevents hostage scenarios where one party refuses to act.

### 6.3a No-Show Protection Module
If a tenant funds the escrow but never checks in:
- After `startDate + 1 day` grace period, **anyone** can call `handleNoShow()`.
- All funds (rent + deposit) are automatically returned to the tenant.
- Prevents permanent fund locks.

### 6.4 Time-Based Settlement Module
Uses: `block.timestamp`
- If: `block.timestamp >= endDate`
- Then: Rent → Landlord, Deposit → Refundable to tenant

### 6.5 Airbnb-Style Cancellation Logic
For short stays:
- **Scenario A: Cancellation before start date (24-hour policy)**
  - Underflow-safe check: `block.timestamp + 24 hours > startDate` reverts
  - Full refund on success
- **Scenario B: Cancellation after check-in**
  - Rent retained by landlord
  - 50% deposit refund to tenant, 50% to landlord

All conditions are enforced via smart contract.

### 6.6 Review Window Module
After `completeAgreement()`, the status transitions to **Review** (not directly to Completed).
- A 2-day `reviewDeadline` is set for landlord inspection.
- Deposit can only be refunded after the review period expires.
- Prevents instant deposit withdrawal before damage assessment.

### 6.7 Agreement Extension Module
Tenants can extend an active booking by calling `extendAgreement()` with:
- A new, later end date
- Additional rent payment (sent as `msg.value`)
- The contract updates `endDate` and accumulates `rent`.

## 7. Smart Contract Design

### 7.1 Data Structures
```solidity
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
```

Mapping:
```solidity
mapping(uint256 => Agreement) public agreements;
```

### 7.2 Key Functions
- `createAgreement()` — with MIN_DEPOSIT and self-rental guards
- `depositFunds()` — exact value match, existence-checked
- `confirmCheckIn()` — callable by **tenant or landlord**
- `handleNoShow()` — prevents permanent fund locks after grace period
- `cancelBooking()` — underflow-safe 24h window check
- `completeAgreement()` — transitions to Review state with deadline
- `refundDeposit()` — only after review period expires
- `extendAgreement()` — extend end date with additional rent

## 8. Smart Contract Algorithms

**Escrow Lock Algorithm**
```text
if (msg.value == rent + deposit)
    store funds
    update status
else
    revert
```

**Completion Algorithm**
```text
if (block.timestamp >= endDate)
    transfer rent to landlord
    allow deposit withdrawal
else
    revert
```

**Cancellation Logic (Underflow-Safe)**
```text
if (currentTime + 24 hours > startDate)
    revert (too late to cancel)
else
    refund full amount
if (status == Active)
    transfer rent to landlord
    50% deposit to tenant, 50% to landlord
```

**No-Show Timeout**
```text
if (status == Funded && currentTime > startDate + 1 day)
    refund all funds to tenant
    mark Cancelled
```

## 9. Security Design

VaultStay enforces:
- **Agreement existence checks** on every external function (`agreementExists` modifier)
- **Role-based access control** via `onlyLandlord`, `onlyTenant`, `onlyParty` modifiers
- **ReentrancyGuard** (OpenZeppelin) on all fund-moving functions
- **Checks-Effects-Interactions (CEI)** pattern — state updates before external calls
- **Minimum deposit validation** (`MIN_DEPOSIT = 0.001 ETH`)
- **Self-rental prevention** (landlord ≠ tenant)
- **No-show timeout** to prevent permanent fund locks
- **Review window** to prevent premature deposit withdrawal

Hardhat tests validate (22 test cases):
- Unauthorized access attempts
- Incorrect deposit values
- Non-existent agreement operations
- No-show timeout mechanics
- Landlord check-in confirmation
- Cancellation window boundaries
- Review period enforcement
- Agreement extension logic

## 10. Testing Strategy

Using Hardhat with **22 comprehensive test cases** across 8 categories:
1. **Deployment** — contract initialization
2. **Agreement Creation** — zero address, self-rental, min deposit guards
3. **Funding** — exact amount, existence checks
4. **Check-In** — tenant, landlord, and unauthorized access
5. **No-Show Protection** — grace period enforcement
6. **Cancellation** — 24h window, landlord cancel, post-check-in
7. **Completion & Review** — state transitions, review deadline, deposit refund timing
8. **Extension** — date validation, additional rent accumulation
9. **Existence Guards** — all functions reject non-existent IDs

**Result**: 22/22 passing, 100% function coverage.

## 11. Expected Outcomes
- Deployed smart contract on Ethereum testnet
- Functional Next.js frontend
- Wallet-based authentication
- 50+ simulated rental transactions
- Secure escrow logic validated via testing

## 12. Advantages of VaultStay
- Non-custodial escrow
- Transparent fund movement
- Automated settlement
- Reduced reliance on centralized platforms
- Adaptable to short-term and long-term rentals

## 13. Limitations
- No legal enforcement outside blockchain
- Gas fee dependency
- No decentralized arbitration (version 1)
- Requires wallet literacy

## 14. Future Enhancements
- Decentralized dispute resolution (arbitration DAO)
- NFT-based property ownership proofs
- On-chain reputation scoring via ZK proofs
- Multi-property dashboard
- Integration with decentralized storage (IPFS)
- Pull-based withdrawal pattern for maximum security
- Landlord cancellation penalties
- Partial-day charge calculations

## 15. Conclusion
VaultStay demonstrates how blockchain technology can modernize rental and short-stay ecosystems through programmable escrow logic. By combining Solidity-based smart contracts with a modern Web3 frontend architecture, the platform eliminates centralized fund custody while preserving automated booking functionality.

The system provides a scalable, transparent, and technically robust decentralized alternative to traditional rental platforms.
