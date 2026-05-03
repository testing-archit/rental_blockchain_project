# VaultStay 🏠🛡️
**Decentralized Short-Term Rental Escrow Platform**

VaultStay eliminates centralized intermediaries from the rental process. Landlords list properties, tenants book securely via escrow, and funds are automatically released through trustless state machine transitions. No platform fees, entirely non-custodial, and transparent on-chain.

![VaultStay Dashboard](/frontend/public/mock.jpg) <!-- Example Mock Image -->

---

## 📖 Table of Contents
- [Prerequisites](#-prerequisites)
- [Architecture](#-architecture)
- [Quick Start Local Setup](#-quick-start-local-setup)
- [How to Use the dApp](#-how-to-use-the-dapp)
- [Testing](#-testing)
- [Future Improvements & Known Limitations](#-future-improvements--known-limitations)

---

## ✅ Prerequisites

1. **Node.js** (v18+ recommended)
2. **MetaMask** browser extension (or any WalletConnect compatible wallet)
3. **Pinata Account** (Optional for local dev, needed for real IPFS uploads)

---

## 🏗 Architecture

### 1. Hardhat Smart Contracts (`/contracts`)
- `VaultStayEscrow.sol`: Core state machine contract managing rentals (`Created -> Funded -> Active -> Completed / Cancelled / Disputed`).
- Security via `OpenZeppelin`'s `Ownable` and `ReentrancyGuard`.
- CEI (Checks, Effects, Interactions) rigorously enforced to prevent malicious actions and fallback reentrancy attacks.

### 2. Next.js 14 Frontend (`/frontend`)
- **Framework**: React 18, Next.js App Router, TailwindCSS.
- **Web3 Integrations**: `wagmi v2` + `viem` + `RainbowKit` for seamless wallet connectivity and standard React Query interactions.
- **IPFS**: Images and property metadata are compiled to JSON and pinned to IPFS (simulated locally if `PINATA_API_KEY` is missing).

---

## 🚀 Quick Start Local Setup

### 1. Clone & Install Dependencies
First, install dependencies for both the Hardhat root and the Next.js frontend:
```bash
# Install Hardhat dependencies
npm install

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Variables
Create `.env` file in the root based on `.env.example`:
```bash
cp .env.example .env
```
*(Leave values blank for initial local Hardhat testing)*

### 3. Spin up Local Blockchain
Terminal 1:
```bash
npx hardhat node
```

### 4. Deploy and Seed Dummy Data
Terminal 2 (From project root):
```bash
npx hardhat run scripts/seed.ts --network localhost
```
*Note the deployed contract address outputted in the terminal.*

Update `frontend/lib/constants.ts` with the new target address if it differs from the default `0x5FbDB2315678afecb367f032d93F642f64180aa3`.

### 5. Start Frontend
Terminal 3 (From frontend directory):
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🕹 How to Use the dApp

### Using Local Hardhat Node
*In MetaMask, add a Custom Network (Chain ID: 31337, RPC: http://127.0.0.1:8545). Import Account #0 (Landlord/Owner) and Account #1 (Tenant) using the printed private keys from `npx hardhat node`.*

### Tenant Flow (Booking a Property)
1. Navigate to "Browse" and click "View Escrow Details" on an available (Created) listing.
2. Ensure you have sufficient ETH to cover *both* the rent + deposit.
3. Click "Fund Escrow & Book". Your wallet will prompt you for the exact transaction value.
4. The property state is now **Funded**.

### Landlord Flow (Managing & Activating)
1. Go to "Dashboard" -> "My Listings".
2. Create a new listing via "List Your Property" (this opens a form & hits `createListing`).
3. Once the tenant funds it, click into the detail page.
4. On the agreed check-in date (`startTimestamp`), you can click "Activate Rental" to hand over possession and transition to **Active**.

### Escrow Completion
1. When the rental ends, either the Tenant or Landlord clicks "Confirm Completion".
2. Once *both* parties confirm, the smart contract automatically executes `_completeRental()`, sending rent to the Landlord and refunding the deposit to the Tenant.

### Dispute Resolution
1. If the state is **Active**, either party can click "Raise Dispute".
2. This locks the contract logic. The platform admin (Owner) must then assess the situation offline.
3. Once decided, the Owner can call `resolveDispute()` and manually determine who receives the escrowed funds.

---

## 🧪 Testing

The contract comes with a comprehensive test suite covering all state transitions, Reentrancy attacks, access controls, and boundary checks. 

To execute:
```bash
npx hardhat test
```

Expected Output:
```text
  VaultStayEscrow
    Creation
      ✔ landlord can create a listing
    Funding
      ✔ tenant can fund a listing with exact amount
      ✔ funding fails with wrong amount...
      ...
    Security Tests
      ✔ reentrancy attack is blocked
```

---

## 🔮 Future Improvements & Known Limitations

**Limitations:**
- Currently, dates strictly use `block.timestamp`. Time manipulation depends heavily on block confirmations. In a production environment, strict or slightly buffered duration checks could prevent minor block manipulation.
- Platform requires *both* parties to confirm. If either party ghosts, funds could be indefinitely locked unless a Dispute is raised. 

**Future Pipeline:**
- Multi-token support (USDC / DAI) instead of strict ETH deposits.
- Auto-timeout resolution: If the tenant doesn't confirm within 7 days of `endTimestamp`, automatically transition to complete.
- Layer 2 Deployments (Arbitrum, Base) to dramatically reduce gas fees on complex escrow deployments. 
