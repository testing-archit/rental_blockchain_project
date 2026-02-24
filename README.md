# VaultStay: Decentralized Rental & Short-Stay Escrow Protocol

![VaultStay Cover](vaultstay/frontend/public/images/hero.png)

**VaultStay** is a decentralized, Web3-native rental and short-stay escrow platform built on the Ethereum blockchain. It is designed to eliminate centralized financial control in property booking systems by leveraging immutable smart contracts to securely lock, manage, and release rental payments.

Unlike centralized hospitality platforms (like Airbnb or Booking.com) that act as custodial middlemen and charge exorbitant fees, VaultStay ensures that funds are governed strictly by programmatic conditions with near-zero service fees. 

---

## 🎓 Academic Problem Analysis & Design

This project is constructed to address specific criteria in modern decentralized systems architecture:

### 1. Problem Domain Identification and Analysis
The traditional short-term rental market relies heavily on centralized platforms that act as mandatory financial intermediaries. These platforms introduce significant friction:
- **Custodial Risk**: Centralized entities hold both the renter's deposit and the host's revenue, creating single points of failure and extending payout wait times by 3-5 business days.
- **High Fees**: Monopolistic platforms charge an average of 15%–20% in service fees split between the host and the tenant.
- **Arbitrary Dispute Resolution**: The platform reserves the right to freeze accounts or deny refunds based on opaque internal policies rather than concrete, agreed-upon terms.

**The core problem**: How do we remove the intermediary in high-trust peer-to-peer property rentals while mathematically guaranteeing the safety of the tenant's deposit and the landlord's rent?

### 2. Objectives and Methodology of the Proposed Work
**Objective**: To build a trustless, non-custodial Web3 application that replaces the human middleman with an automated, block-time-based smart contract escrow.

**Methodology**:
1. **Smart Contracts (Solidity)**: We encode the rental agreement (Rent, Security Deposit, Start Date, End Date) directly onto the Ethereum Sepolia Testnet.
2. **State Machine Escrow**: The contract moves through a rigorous lifecycle (`Created` → `Funded` → `Active` → `Review` → `Completed` / `Cancelled`), including a **Review** inspection window before deposit release.
3. **Decentralized Frontend (Next.js + `wagmi`)**: We build an intuitive interface that interacts directly with the RPC nodes, ensuring that neither the platform nor the developers can interact with user funds.

### 3. Relevance of Algorithms / Techniques
VaultStay replaces traditional centralized database updates with specific on-chain algorithmic techniques:

- **Time-Locked Conditional Checks (`block.timestamp`)**: Underflow-safe cancellation window using `block.timestamp + 24 hours > agreement.startDate` to prevent both arithmetic errors and late cancellations.
- **Checks-Effects-Interactions Pattern (CEI)**: To prevent re-entrancy attacks, the algorithm zeroes out internal ledgers *before* triggering the external `transfer()` of ETH. Enforced further using OpenZeppelin's `ReentrancyGuard`.
- **Atomic Operations**: Rent distribution and deposit unlocking are executed as a single, atomic transaction block upon checkout.
- **No-Show Timeout Algorithm**: If a tenant deposits funds but never checks in, a grace period (`startDate + 1 day`) expires and anyone can trigger `handleNoShow()` to return all funds, preventing permanent locks.
- **Review Deadline Enforcement**: Upon completion, a 2-day `reviewDeadline` is set. Deposit refunds are blocked until this window expires, allowing landlords to inspect for damages.

---

## 💼 Business Model

VaultStay aims to disrupt the $100B+ short-term rental market by competing strictly on efficiency and fee reduction.

**1. Revenue Generation Strategy**
- **Freemium Protocol / Fixed Gas Subsidies**: VaultStay charges a flat **0% commission fee** on the actual rent or deposit amounts (disrupting Airbnb's 15%).
- **Premium Up-Sells**: Revenue is instead generated via optional premium features:
  - **Reputation Passports**: Verified badges generated via Zero-Knowledge (ZK) proofs to establish trust histories for tenants/landlords without revealing personal data (subscription model).
  - **Fiat On-Ramps**: Integrating third-party providers (like Stripe or MoonPay) to allow users to pay via Credit Card while settling in ETH on-chain, taking a 1% convenience fee.

**2. Target Audience**
- **Crypto-Native Nomads**: Remote workers who are already paid in crypto and want to rent housing without converting to fiat.
- **Independent Landlords**: Property owners tired of high platform take-rates and delayed payouts.

**3. Cost Structure**
- Near-zero infrastructure costs. By hosting the database state entirely on the Ethereum network, server hosting costs are reduced only to the lightweight Next.js front-end. 

---

## 🌟 Key Features

### 🔒 Trustless Escrow
Rent and security deposits are locked in the `VaultStayCore` smart contract. Funds are mathematically guaranteed to remain untouchable until both parties fulfill the agreement conditions.

### ⚡ Instant, Automated Payouts
Upon the checkout date, the smart contract automatically permits the landlord to claim the rent and the tenant to withdraw their security deposit. 

### 🛡️ Smart Cancellation Policies
VaultStay enforces strict, code-level cancellation logic:
- **Pre-Check-In (Early Cancel)**: Underflow-safe 24-hour window check. Full refund if cancelled early enough.
- **Post-Check-In (Active Cancel)**: Landlord retains rent, deposit is split 50/50.
- **No-Show Protection**: If tenant never checks in, funds auto-refund after a 1-day grace period.

### 🔍 Review Window
After checkout, a **2-day inspection period** prevents instant deposit withdrawal, giving landlords time to report damages.

### 🔄 Booking Extensions
Tenants can extend active stays directly on-chain by paying additional rent and setting a new end date.

### 🌐 Rich Web3 Dashboard
A modern Next.js 14 App Router application featuring Live On-Chain Data via multicall, Bento Grid UI, and Role-Based context-aware dashboards.

---

## 🏗️ Architecture & Tech Stack

### Smart Contracts (Hardhat)
- **Solidity `^0.8.20`**: Strictly typed, secure contract logic.
- **Hardhat & Chai**: Comprehensive test suite with **22 test cases** covering happy paths, cancellations, no-show handling, review windows, extensions, and malicious access attempts.

### Frontend App (Next.js)
- **Framework**: Next.js 14 (App Router), React 18.
- **Styling**: Tailwind CSS, custom neon gradients.
- **Web3 Integration**: `wagmi` v2, `viem`, and `RainbowKit`.

---

## 📂 Project Structure

```text
rental_blockchain_project/
├── vaultstay/                   # Main Application Monorepo
│   ├── contracts/               # Solidity Smart Contracts
│   │   └── VaultStayCore.sol    # Core Escrow Logic
│   ├── test/                    # Hardhat TypeScript Tests
│   ├── scripts/                 # Deployment scripts
│   └── frontend/                # Next.js 14 Web Application
│       ├── app/                 # App Router Pages
│       ├── components/          # Reusable UI 
│       └── lib/                 # Core utilities & Wagmi configuration
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/testing-archit/rental_blockchain_project.git
cd rental_blockchain_project/vaultstay
```

### 2. Smart Contract Setup
```bash
npm install
npx hardhat compile
npx hardhat test
```
*All 22 test cases (creation, funding, check-in, no-show, completion, review window, extension, and cancellation scenarios) should pass.*

### 3. Running the Connected Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. Connect a wallet (e.g., MetaMask) configured for the **Sepolia Testnet**.

---

## 🔗 Live Deployment Details
- **Network**: Sepolia Testnet
- **Contract Address**: [`0xDD9b3CC1657e74cBF44B8e4894c005940f904820`](https://sepolia.etherscan.io/address/0xDD9b3CC1657e74cBF44B8e4894c005940f904820)

## 📄 License
This project is open-source and meant for educational and demonstrative purposes within the Web3 ecosystem.
