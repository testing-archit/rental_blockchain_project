# Software Requirements Specification (SRS)

## VaultStay — Decentralized Rental & Short-Stay Escrow Protocol

**Version**: 2.0  
**Date**: February 24, 2026  
**Prepared By**: VaultStay Development Team  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Architecture](#3-system-architecture)
4. [Specific Requirements](#4-specific-requirements)
5. [Smart Contract Specification](#5-smart-contract-specification)
6. [Frontend Specification](#6-frontend-specification)
7. [Database Specification](#7-database-specification)
8. [API Specification](#8-api-specification)
9. [Security Requirements](#9-security-requirements)
10. [Testing Requirements](#10-testing-requirements)
11. [Performance Requirements](#11-performance-requirements)
12. [Appendices](#12-appendices)

---

## 1. Introduction

### 1.1 Purpose

This document provides a comprehensive Software Requirements Specification (SRS) for the VaultStay platform. It describes the functional and non-functional requirements of a decentralized rental escrow system built on the Ethereum blockchain. This SRS is intended for developers, academic reviewers, auditors, and stakeholders evaluating the system architecture.

### 1.2 Scope

VaultStay is a full-stack Web3 application that:
- Replaces centralized rental payment intermediaries with trustless smart contracts.
- Provides an immutable, on-chain escrow lifecycle for short-term and long-term property rentals.
- Offers a modern Next.js 14 frontend for seamless dApp interaction.
- Integrates a Neon PostgreSQL database (via Drizzle ORM) for off-chain metadata caching.

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| **DApp** | Decentralized Application |
| **ETH** | Ether, the native cryptocurrency of Ethereum |
| **EVM** | Ethereum Virtual Machine |
| **Escrow** | A financial arrangement where a third party holds funds on behalf of two transacting parties |
| **Gas** | Unit of computational effort in Ethereum; users pay gas fees to execute transactions |
| **CEI** | Checks-Effects-Interactions — a Solidity design pattern to prevent re-entrancy attacks |
| **RPC** | Remote Procedure Call — used to interact with blockchain nodes |
| **ABI** | Application Binary Interface — the interface specification for interacting with smart contracts |
| **Multicall** | A technique to batch multiple smart contract read calls into a single RPC request |
| **Neon** | Neon Tech — a serverless PostgreSQL provider |
| **ORM** | Object-Relational Mapping |
| **Drizzle** | A TypeScript ORM for SQL databases |
| **Wagmi** | A React hooks library for Ethereum |
| **Viem** | A TypeScript interface for Ethereum |
| **RainbowKit** | A React library for wallet connection UIs |

### 1.4 References

- Ethereum Yellow Paper: https://ethereum.github.io/yellowpaper/
- Solidity Documentation: https://docs.soliditylang.org/
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
- Next.js Documentation: https://nextjs.org/docs
- Drizzle ORM Documentation: https://orm.drizzle.team/docs
- Neon Database Documentation: https://neon.tech/docs
- IEEE 830-1998 SRS Standard

### 1.5 Overview

This SRS follows the IEEE 830 standard structure and covers all functional modules, data models, security constraints, interface specifications, and testing criteria for the VaultStay platform.

---

## 2. Overall Description

### 2.1 Product Perspective

VaultStay operates within the Ethereum ecosystem as a self-contained decentralized application. It does not depend on any centralized payment processor, identity provider, or custodial service.

**System Context Diagram**:

```
┌─────────────────────────────────────────────────────┐
│                    End Users                         │
│           (Landlords & Tenants)                      │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  MetaMask   │        │  Browser    │
    │  Wallet     │        │  (Chrome)   │
    └──────┬──────┘        └──────┬──────┘
           │                      │
    ┌──────▼──────────────────────▼──────┐
    │       Next.js 14 Frontend          │
    │  (wagmi + viem + RainbowKit)       │
    └──────┬──────────────────────┬──────┘
           │                      │
    ┌──────▼──────┐        ┌──────▼──────┐
    │  Ethereum   │        │  Neon       │
    │  Sepolia    │        │  PostgreSQL │
    │  (On-Chain) │        │  (Off-Chain)│
    └─────────────┘        └─────────────┘
```

### 2.2 Product Functions

| ID | Function | Description |
|---|---|---|
| F-001 | Create Agreement | Landlord initiates a rental escrow agreement on-chain |
| F-002 | Deposit Funds | Tenant deposits rent + security deposit into the smart contract |
| F-003 | Confirm Check-In | Tenant or landlord confirms tenant check-in |
| F-004 | Complete Agreement | Finalize the rental; transfer rent to landlord, enter review period |
| F-005 | Refund Deposit | Refund security deposit to tenant after review period |
| F-006 | Cancel Booking | Cancel a booking with appropriate refund logic |
| F-007 | Handle No-Show | Recover permanently locked funds after a tenant no-show |
| F-008 | Extend Agreement | Tenant extends the stay by paying additional rent |
| F-009 | Gas Estimation | Estimate the network fee before submitting a transaction |
| F-010 | Dashboard View | View all agreements filtered by role (Landlord/Tenant) |
| F-011 | Wallet Connection | Connect an Ethereum wallet via RainbowKit |
| F-012 | Database Sync | Cache booking metadata in Neon PostgreSQL via Drizzle ORM |

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Skill |
|---|---|---|
| **Landlord** | Property owner listing rentals. Creates agreements, confirms check-in, collects rent. | Basic Web3 wallet usage |
| **Tenant** | Renter booking properties. Deposits funds, checks in, extends stay. | Basic Web3 wallet usage |
| **Admin/Developer** | Deploys and maintains the smart contract and frontend. | Advanced Solidity + React |

### 2.4 Operating Environment

- **Blockchain**: Ethereum Sepolia Testnet (EVM-compatible)
- **Browser**: Chrome, Firefox, Brave (with MetaMask extension)
- **Runtime**: Node.js v18+
- **Database**: Neon PostgreSQL (serverless)
- **Hosting**: Any static hosting provider (Vercel, Netlify)

### 2.5 Design and Implementation Constraints

| Constraint | Description |
|---|---|
| C-001 | All fund movements must occur on-chain via smart contracts |
| C-002 | The platform must never hold custody of user funds (non-custodial) |
| C-003 | All state transitions must be immutable and auditable on the blockchain |
| C-004 | Solidity version must be ^0.8.20 (overflow protection built-in) |
| C-005 | Frontend must be a progressive web application (client-side rendering for wallet state) |
| C-006 | Gas costs must be minimized through efficient contract design |

### 2.6 Assumptions and Dependencies

- Users have MetaMask or a compatible Web3 wallet installed.
- Users have sufficient Sepolia ETH for gas fees.
- The Ethereum Sepolia testnet is available and operational.
- The Neon PostgreSQL instance is provisioned and accessible.

---

## 3. System Architecture

### 3.1 Architectural Overview

VaultStay follows a three-tier decentralized architecture:

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                          │
│  Next.js 14 App Router · Tailwind CSS · Framer Motion        │
│  Wagmi v2 · Viem · RainbowKit · Lucide Icons                 │
├──────────────────────────────────────────────────────────────┤
│                    APPLICATION TIER                           │
│  Next.js API Routes (/api/bookings)                          │
│  Drizzle ORM · Neon Serverless Driver                        │
├────────────────────────────┬─────────────────────────────────┤
│       DATA TIER (On-Chain) │     DATA TIER (Off-Chain)       │
│  VaultStayCore.sol         │     Neon PostgreSQL             │
│  Ethereum Sepolia          │     bookings table              │
│  Immutable State Machine   │     Metadata Cache              │
└────────────────────────────┴─────────────────────────────────┘
```

### 3.2 Component Diagram

| Component | Technology | Purpose |
|---|---|---|
| Smart Contract | Solidity ^0.8.20 | Escrow state machine, fund custody |
| Frontend | Next.js 14, React 18 | User interface, wallet interaction |
| Web3 Layer | Wagmi v2, Viem | Contract read/write, multicall |
| Database | Neon PostgreSQL | Off-chain metadata caching |
| ORM | Drizzle ORM | Type-safe database queries |
| Auth | RainbowKit | Wallet connection and identity |
| Styling | Tailwind CSS | Dark futuristic UI theme |
| Animation | Framer Motion | Micro-interactions and transitions |

### 3.3 State Machine Diagram

The core escrow lifecycle follows a strict state machine:

```
                  createAgreement()
                        │
                        ▼
                   ┌─────────┐
                   │ Created │
                   └────┬────┘
                        │ depositFunds()
                        ▼
                   ┌─────────┐     handleNoShow()
                   │ Funded  │─────────────────────┐
                   └────┬────┘                     │
           confirmCheckIn() │                      │
                        ▼                          ▼
                   ┌─────────┐              ┌───────────┐
          ┌────────│ Active  │              │ Cancelled │
          │        └────┬────┘              └───────────┘
 cancelBooking()        │ completeAgreement()      ▲
          │             ▼                          │
          │        ┌─────────┐                     │
          │        │ Review  │                     │
          │        └────┬────┘                     │
          │             │ refundDeposit()           │
          │             ▼                          │
          │        ┌───────────┐                   │
          └───────▶│ Completed │                   │
                   └───────────┘                   │
          cancelBooking() ─────────────────────────┘
```

---

## 4. Specific Requirements

### 4.1 Functional Requirements

#### FR-001: Agreement Creation
- **Input**: Tenant address, rent amount (wei), deposit amount (wei), start date (Unix timestamp), end date (Unix timestamp), booking type (boolean)
- **Precondition**: `msg.sender` is the landlord; tenant ≠ address(0); tenant ≠ landlord; rent > 0; deposit ≥ 0.001 ETH; startDate < endDate; startDate > block.timestamp
- **Output**: Agreement ID (uint256), AgreementCreated event
- **Postcondition**: Agreement stored with Status = Created

#### FR-002: Fund Deposit
- **Input**: Agreement ID, msg.value
- **Precondition**: Caller = tenant; status = Created; msg.value = rent + deposit; agreement exists
- **Output**: FundsDeposited event
- **Postcondition**: Status = Funded

#### FR-003: Check-In Confirmation
- **Input**: Agreement ID
- **Precondition**: Caller = tenant OR landlord; status = Funded; block.timestamp ≥ startDate; agreement exists
- **Output**: CheckInConfirmed event
- **Postcondition**: Status = Active

#### FR-004: No-Show Handling
- **Input**: Agreement ID
- **Precondition**: Status = Funded; block.timestamp > startDate + 1 day; agreement exists
- **Output**: NoShowHandled event; full refund to tenant
- **Postcondition**: Status = Cancelled

#### FR-005: Booking Cancellation (Pre-Check-In)
- **Input**: Agreement ID
- **Precondition**: Caller = tenant or landlord; status = Funded; if tenant: block.timestamp + 24h ≤ startDate; agreement exists
- **Output**: BookingCancelled event; full refund to tenant
- **Postcondition**: Status = Cancelled

#### FR-006: Booking Cancellation (Post-Check-In)
- **Input**: Agreement ID
- **Precondition**: Caller = tenant or landlord; status = Active; agreement exists
- **Output**: BookingCancelled event; rent → landlord; 50% deposit → tenant; 50% deposit → landlord
- **Postcondition**: Status = Cancelled

#### FR-007: Agreement Completion
- **Input**: Agreement ID
- **Precondition**: Status = Active; block.timestamp ≥ endDate; agreement exists
- **Output**: AgreementCompleted event; rent → landlord; reviewDeadline set
- **Postcondition**: Status = Review

#### FR-008: Deposit Refund
- **Input**: Agreement ID
- **Precondition**: Status = Review; block.timestamp ≥ reviewDeadline; deposit > 0; agreement exists
- **Output**: DepositRefunded event; deposit → tenant
- **Postcondition**: Status = Completed; deposit = 0

#### FR-009: Agreement Extension
- **Input**: Agreement ID, new end date, msg.value (additional rent)
- **Precondition**: Caller = tenant; status = Active; newEndDate > endDate; msg.value > 0; agreement exists
- **Output**: AgreementExtended event
- **Postcondition**: endDate updated; rent accumulated

#### FR-010: Gas Estimation
- **Input**: Form fields (tenant, rent, deposit, dates, type)
- **Precondition**: Wallet connected; all fields populated
- **Output**: Estimated transaction fee in ETH
- **Implementation**: Viem's `estimateContractGas()` × `getGasPrice()`

#### FR-011: Dashboard Display
- **Input**: Connected wallet address
- **Precondition**: Wallet connected
- **Output**: Filtered list of agreements (All / My Listings / My Stays)
- **Data Source**: On-chain multicall via Viem

#### FR-012: Database Sync
- **Input**: Booking data from on-chain transactions
- **Precondition**: Successful on-chain transaction
- **Output**: Cached booking record in PostgreSQL
- **API**: POST/PATCH to `/api/bookings`

### 4.2 Non-Functional Requirements

#### NFR-001: Security
- All fund-moving functions must use `nonReentrant` modifier.
- State must be updated before external calls (CEI pattern).
- Every external function must validate agreement existence.
- Minimum deposit of 0.001 ETH enforced.
- Self-rental (landlord = tenant) prevented.

#### NFR-002: Performance
- On-chain reads via multicall must complete within 3 seconds.
- API responses (database queries) must complete within 500ms.
- Frontend must achieve First Contentful Paint < 2 seconds.

#### NFR-003: Reliability
- Smart contract must be deterministic — identical inputs always produce identical outputs.
- Failed transactions must revert atomically with no partial state changes.

#### NFR-004: Usability
- The DApp must support wallet connection in ≤ 2 clicks.
- All transaction status changes must provide visual toast notifications.
- The UI must be fully responsive (mobile, tablet, desktop).
- Gas estimation must be available before transaction submission.

#### NFR-005: Scalability
- The off-chain database must support 10,000+ concurrent bookings.
- The smart contract supports unlimited agreements (limited only by Ethereum storage gas costs).

#### NFR-006: Maintainability
- The codebase must use TypeScript throughout the frontend.
- The database schema must be type-safe via Drizzle ORM inference.
- The contract must use custom errors instead of string reverts for gas efficiency.

---

## 5. Smart Contract Specification

### 5.1 Contract: VaultStayCore

**Deployed Address (Sepolia)**: `0xDD9b3CC1657e74cBF44B8e4894c005940f904820`  
**Solidity Version**: `^0.8.20`  
**Inheritance**: `ReentrancyGuard` (OpenZeppelin)

### 5.2 Enumerations

```solidity
enum Status { Created, Funded, Active, Completed, Review, Cancelled }
```

### 5.3 Data Structures

```solidity
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
}
```

### 5.4 Constants

| Constant | Value | Description |
|---|---|---|
| `REVIEW_PERIOD` | 2 days | Inspection window after checkout |
| `NO_SHOW_GRACE` | 1 day | Grace period before no-show refund |
| `MIN_DEPOSIT` | 0.001 ETH | Minimum security deposit |

### 5.5 Events

| Event | Parameters | Trigger |
|---|---|---|
| `AgreementCreated` | agreementId, landlord, tenant, rent, deposit | createAgreement() |
| `FundsDeposited` | agreementId, tenant | depositFunds() |
| `CheckInConfirmed` | agreementId, confirmedBy | confirmCheckIn() |
| `BookingCancelled` | agreementId, user, reason | cancelBooking() |
| `AgreementCompleted` | agreementId, reviewDeadline | completeAgreement() |
| `DepositRefunded` | agreementId, amount | refundDeposit() |
| `NoShowHandled` | agreementId | handleNoShow() |
| `AgreementExtended` | agreementId, newEndDate, additionalRent | extendAgreement() |

### 5.6 Custom Errors

| Error | Description |
|---|---|
| `InvalidDates()` | Start ≥ End, or Start in the past |
| `InvalidAmount()` | Zero rent, below MIN_DEPOSIT, wrong msg.value |
| `Unauthorized()` | Caller is neither landlord nor tenant |
| `InvalidState(Status)` | Operation not valid for current status |
| `TimeWindowNotMet()` | Temporal precondition not satisfied |
| `ZeroAddress()` | Tenant address is zero |
| `AgreementNotFound()` | Agreement ID does not exist |
| `ReviewPeriodNotOver()` | Review deadline has not elapsed |

### 5.7 Access Control Modifiers

| Modifier | Access |
|---|---|
| `onlyLandlord(_id)` | Restricts to agreement's landlord |
| `onlyTenant(_id)` | Restricts to agreement's tenant |
| `onlyParty(_id)` | Restricts to either landlord or tenant |
| `agreementExists(_id)` | Validates agreement.landlord ≠ address(0) |

---

## 6. Frontend Specification

### 6.1 Pages

| Route | Component | Description |
|---|---|---|
| `/` | Home | Landing page with hero, bento grid, competitor comparison, academic analysis, business model |
| `/dashboard` | Dashboard | Role-filtered agreement list with stats banner, tabs, and action buttons |
| `/create-booking` | CreateBooking | Form to create a new on-chain escrow agreement with gas estimation |
| `/agreement/[id]` | AgreementDetail | Detailed view of a single agreement with escrow timeline |

### 6.2 Components

| Component | File | Description |
|---|---|---|
| `BookingCard` | components/BookingCard.tsx | Displays agreement summary with role indicator and action button |
| `EscrowTimeline` | components/EscrowTimeline.tsx | 4-stage animated progress bar reflecting agreement status |
| `Navbar` | app/layout.tsx | Top navigation with wallet connection and route links |

### 6.3 Design System

| Token | Value | Usage |
|---|---|---|
| Background | `#0A0A0F` | Page background |
| Card | `#141420` | Glass panel backgrounds |
| Primary | `#6C5CE7` | Buttons, highlights, gradients |
| Secondary | `#00D2D3` | Accents, secondary highlights |
| Success | `#00B894` | Confirmation states |
| Error | `#FF6B6B` | Error states |
| Font Display | `Space Grotesk` | Headings |
| Font Body | `Inter` | Body text |

---

## 7. Database Specification

### 7.1 Technology

- **Provider**: Neon Tech (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Driver**: `@neondatabase/serverless` (HTTP)
- **Connection**: Pooled via `ep-wild-tree-ai9zq9bo-pooler`

### 7.2 Schema: `bookings`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing row ID |
| `onchain_id` | INTEGER | NULLABLE | Corresponding smart contract agreement ID |
| `landlord` | TEXT | NOT NULL | Landlord wallet address (lowercase) |
| `tenant` | TEXT | NOT NULL | Tenant wallet address (lowercase) |
| `rent_amount` | NUMERIC(30,0) | NOT NULL | Rent in wei |
| `security_deposit` | NUMERIC(30,0) | NOT NULL | Deposit in wei |
| `start_date` | INTEGER | NOT NULL | Unix timestamp |
| `end_date` | INTEGER | NOT NULL | Unix timestamp |
| `booking_type` | TEXT | NOT NULL, DEFAULT 'ShortTerm' | ShortTerm or LongTerm |
| `status` | TEXT | NOT NULL, DEFAULT 'Created' | Mirrors on-chain status |
| `tx_hash` | TEXT | NULLABLE | Transaction hash |
| `is_short_term` | BOOLEAN | NOT NULL, DEFAULT true | Short or long term flag |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

## 8. API Specification

### 8.1 Endpoints

#### `GET /api/bookings`
- **Query Params**: `?address=0x...` (optional filter)
- **Response**: `200 OK` — JSON array of booking objects
- **Error**: `500` — Server error

#### `POST /api/bookings`
- **Body**: `{ onchainId, landlord, tenant, rentAmount, securityDeposit, startDate, endDate, bookingType, status, txHash, isShortTerm }`
- **Response**: `201 Created` — JSON booking object
- **Error**: `500` — Server error

#### `GET /api/bookings/[id]`
- **Params**: `id` (booking row ID)
- **Response**: `200 OK` — JSON booking object
- **Error**: `404` — Booking not found; `500` — Server error

#### `PATCH /api/bookings/[id]`
- **Params**: `id` (booking row ID)
- **Body**: `{ status, txHash? }`
- **Response**: `200 OK` — Updated JSON booking object
- **Error**: `404` — Booking not found; `500` — Server error

---

## 9. Security Requirements

### 9.1 Smart Contract Security

| ID | Requirement | Implementation |
|---|---|---|
| SEC-001 | Prevent re-entrancy attacks | `nonReentrant` modifier on all fund-moving functions |
| SEC-002 | State updates before external calls | CEI pattern enforced |
| SEC-003 | Validate agreement existence | `agreementExists` modifier on every external function |
| SEC-004 | Role-based access control | `onlyLandlord`, `onlyTenant`, `onlyParty` modifiers |
| SEC-005 | Prevent arithmetic overflow/underflow | Solidity ^0.8.20 built-in checks + safe comparison logic |
| SEC-006 | Prevent permanent fund locks | `handleNoShow()` with 1-day grace period |
| SEC-007 | Prevent premature deposit withdrawal | Review period with 2-day deadline |
| SEC-008 | Minimum deposit validation | `MIN_DEPOSIT = 0.001 ETH` |
| SEC-009 | Self-rental prevention | `landlord ≠ tenant` check |
| SEC-010 | Double-withdraw prevention | `deposit = 0` before transfer in `refundDeposit()` |

### 9.2 Frontend Security

| ID | Requirement | Implementation |
|---|---|---|
| SEC-011 | No private keys in frontend | All transactions signed via user's wallet (MetaMask) |
| SEC-012 | Non-custodial architecture | Frontend never holds funds; all custody on smart contract |
| SEC-013 | Environment variable protection | `.env` excluded from Git via `.gitignore` |

---

## 10. Testing Requirements

### 10.1 Smart Contract Tests

**Framework**: Hardhat + Chai  
**Total Test Cases**: 22  
**Coverage**: 100% function coverage

| Category | Tests | Validates |
|---|---|---|
| Deployment | 1 | Contract initialization |
| Agreement Creation | 3 | Zero address, self-rental, min deposit guards |
| Funding | 3 | Exact amount, existence checks, unauthorized access |
| Check-In | 3 | Tenant, landlord, and unauthorized confirmation |
| No-Show Protection | 2 | Grace period enforcement and early rejection |
| Cancellation | 3 | 24h window, landlord cancel, timing edge cases |
| Completion & Review | 3 | State transition, review deadline, refund timing |
| Extension | 2 | Date validation, additional rent accumulation |
| Existence Guards | 2 | All functions reject non-existent IDs |

### 10.2 Frontend Tests

| Test Type | Method |
|---|---|
| Build Verification | `npm run build` — TypeScript compilation with zero errors |
| Visual Verification | Manual inspection at `http://localhost:3000` |
| API Route Testing | HTTP requests to `/api/bookings` endpoints |

### 10.3 Test Commands

```bash
# Smart Contract Tests
cd vaultstay && npx hardhat test

# Frontend Build Verification
cd vaultstay/frontend && npm run build
```

---

## 11. Performance Requirements

| Metric | Target | Measurement |
|---|---|---|
| Smart Contract Deployment Gas | < 3,000,000 gas | `npx hardhat deploy` |
| createAgreement() Gas | < 200,000 gas | Hardhat gas reporter |
| depositFunds() Gas | < 80,000 gas | Hardhat gas reporter |
| Frontend First Load JS | < 250 kB | Next.js build output |
| API Response Time | < 500ms | Neon serverless cold start |
| Multicall Batch Read | < 3 seconds for 100 agreements | Viem multicall |
| Database Seed Time | < 5 seconds for 100 records | `npx tsx seed.ts` |

---

## 12. Appendices

### Appendix A: Technology Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Smart Contracts | Solidity | ^0.8.20 |
| Contract Framework | Hardhat | Latest |
| Contract Security | OpenZeppelin ReentrancyGuard | Latest |
| Contract Testing | Chai, Ethers.js | Latest |
| Frontend Framework | Next.js | 14.2.15 |
| Frontend UI | React | 18 |
| CSS Framework | Tailwind CSS | 3.x |
| Animations | Framer Motion | Latest |
| Icons | Lucide React | Latest |
| Web3 Hooks | Wagmi | v2 |
| Ethereum Client | Viem | Latest |
| Wallet UI | RainbowKit | Latest |
| Database | Neon PostgreSQL | Serverless |
| ORM | Drizzle ORM | Latest |
| DB Driver | @neondatabase/serverless | Latest |

### Appendix B: Deployed Contract Details

| Property | Value |
|---|---|
| Network | Ethereum Sepolia Testnet |
| Contract Address | `0xDD9b3CC1657e74cBF44B8e4894c005940f904820` |
| Compiler | solc 0.8.20 |
| Optimizer | Enabled (200 runs) |
| EVM Target | Paris |

### Appendix C: Repository Structure

```
rental_blockchain_project/
├── README.md                           # Root project documentation
├── vaultstay/
│   ├── contracts/
│   │   └── VaultStayCore.sol           # Core escrow smart contract
│   ├── test/
│   │   └── escrow.test.ts              # 22 Hardhat test cases
│   ├── scripts/
│   │   └── deploy.ts                   # Sepolia deployment script
│   ├── hardhat.config.ts               # Hardhat configuration
│   ├── README.md                       # Academic documentation
│   └── frontend/
│       ├── app/
│       │   ├── page.tsx                # Landing page
│       │   ├── dashboard/page.tsx      # Dashboard
│       │   ├── create-booking/page.tsx # Create booking form
│       │   ├── agreement/[id]/page.tsx # Agreement detail
│       │   └── api/bookings/           # REST API routes
│       ├── components/
│       │   ├── BookingCard.tsx          # Booking card component
│       │   └── EscrowTimeline.tsx       # Status timeline
│       ├── lib/
│       │   ├── constants.ts            # Contract ABI + address
│       │   ├── contract.ts             # Wagmi contract hooks
│       │   └── db/
│       │       ├── schema.ts           # Drizzle schema
│       │       └── index.ts            # DB connection
│       ├── drizzle.config.ts           # Drizzle Kit config
│       ├── seed.ts                     # Mock data seeder
│       └── public/images/              # AI-generated assets
```

### Appendix D: Git Commit History

The project's Git history is organized into atomic, descriptive commits covering:
1. Initial project setup and workspace configuration
2. Smart contract implementation and testing
3. Frontend initialization and Web3 integration
4. UI components, landing page, and dashboard
5. Security audit fixes (7 findings addressed)
6. Database integration (Drizzle ORM + Neon)
7. Documentation and SRS

---

*End of Software Requirements Specification*
