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
Landlord confirms tenant check-in.
- Status: Funded → Active
- Prevents false claims of stay.

### 6.4 Time-Based Settlement Module
Uses: `block.timestamp`
- If: `block.timestamp >= endDate`
- Then: Rent → Landlord, Deposit → Refundable to tenant

### 6.5 Airbnb-Style Cancellation Logic
For short stays:
- **Scenario A: Cancellation before start date (24-hour policy)**
  - Full refund
- **Scenario B: Cancellation after check-in**
  - Rent retained
  - Partial deposit refund

All conditions are enforced via smart contract.

## 7. Smart Contract Design

### 7.1 Data Structures
```solidity
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
```

Mapping:
```solidity
mapping(uint256 => Agreement) public agreements;
```

### 7.2 Key Functions
- `createAgreement()`
- `depositFunds()`
- `confirmCheckIn()`
- `completeAgreement()`
- `refundDeposit()`
- `cancelBooking()`

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

**Cancellation Logic**
```text
if (currentTime < startDate - 24 hours)
    refund full amount
else if (status == Active)
    transfer rent
    partial deposit refund
```

## 9. Security Design

VaultStay enforces:
- Role-based access control (`require(msg.sender == landlord)`)
- Reentrancy-safe withdrawal pattern
- State update before transfer
- Double-spend prevention
- Exact payment validation

Hardhat tests validate:
- Unauthorized withdrawals
- Incorrect deposit values
- Double completion attempts
- Timestamp violations

## 10. Testing Strategy

Using Hardhat:
- Unit tests written with Chai
- Simulation of multiple agreement states
- Edge-case validation:
  - Early cancellation
  - Late cancellation
  - Double deposit attempt
  - Expired agreement completion

**Goal**: Minimum 90% function coverage.

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
- Decentralized dispute resolution
- NFT-based property ownership proofs
- On-chain reputation scoring
- Multi-property dashboard
- Integration with decentralized storage

## 15. Conclusion
VaultStay demonstrates how blockchain technology can modernize rental and short-stay ecosystems through programmable escrow logic. By combining Solidity-based smart contracts with a modern Web3 frontend architecture, the platform eliminates centralized fund custody while preserving automated booking functionality.

The system provides a scalable, transparent, and technically robust decentralized alternative to traditional rental platforms.
