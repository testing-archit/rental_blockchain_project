<!-- GSD:project-start source:PROJECT.md -->
## Project

**VaultStay**

VaultStay is a decentralized short-term rental escrow platform on Ethereum that eliminates centralized intermediaries like Airbnb. It allows landlords to list properties and tenants to book and pay for them, with all funds held in a secure smart contract escrow and released automatically based on rental lifecycle state transitions.

**Core Value:** Trustless, decentralized rental transactions with automated escrow management, zero platform fees, and no custodial risk.

### Constraints

- **Security**: Must follow the CEI (Checks-Effects-Interactions) pattern and use `ReentrancyGuard` for all fund-moving functions.
- **Transfers**: No use of `transfer()` or `send()`; must use `call{value:}()` with success checks.
- **Tech Stack**: Solidity ^0.8.20, Hardhat, Next.js 14, Wagmi v2, RainbowKit, Tailwind CSS.
- **Types**: Strict TypeScript usage is required (no `any`).
- **Storage**: Off-chain metadata must be stored on IPFS.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - Used across frontend `frontend/` and deployment scripts `scripts/`.
- Solidity 0.8.20 - Used for smart contracts in `contracts/`.
- JavaScript/ES6 - Used in configuration files and hooks.
## Runtime
- Node.js >=20 - Target runtime for development and frontend.
- npm - Primary package manager.
- Lockfile: `package-lock.json` present in root and `frontend/`.
## Frameworks
- Next.js 14.2.14 - Frontend React framework in `frontend/`.
- Hardhat 2.22.4 - Ethereum development environment for smart contracts.
- Hardhat Toolbox - Integrated testing suite for smart contracts.
- Tailwind CSS 3.4.1 - Utility-first CSS framework for frontend styling.
- PostCSS 8 - CSS transformation tool.
- ESLint 8 - Linting utility for frontend code.
## Key Dependencies
- @openzeppelin/contracts 5.0.2 - Standard library for secure smart contract development.
- Wagmi 2.19.5 - React Hooks for Ethereum.
- Viem 2.47.10 - TypeScript interface for Ethereum.
- RainbowKit 2.2.10 - Wallet connection library.
- TanStack React Query 5.96.2 - Data fetching and state management for the frontend.
- Lucide React 1.7.0 - Icon library for the UI.
- dotenv 16.4.5 - Environment variable management.
## Configuration
- Configured via `.env` files in project root and `frontend/`.
- Required keys include `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, and Pinata API credentials.
- `hardhat.config.ts` - Hardhat environment configuration.
- `next.config.mjs` - Next.js configuration.
- `tailwind.config.ts` - Tailwind CSS theme and plugin configuration.
- `tsconfig.json` - TypeScript compiler options.
## Platform Requirements
- Node.js and npm installed.
- Local Ethereum node (Hardhat) or testnet access (Sepolia).
- Frontend: Vercel or similar Next.js compatible hosting.
- Backend: Ethereum blockchain (EVM-compatible).
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Smart Contracts: `PascalCase.sol` (e.g., `contracts/VaultStayEscrow.sol`)
- React Components: `PascalCase.tsx` (e.g., `frontend/components/RentalCard.tsx`)
- Hooks: `useCamelCase.ts` (e.g., `frontend/hooks/useVaultStay.ts`)
- Scripts: `camelCase.ts` (e.g., `scripts/deploy.ts`)
- Tests: `PascalCase.ts` (e.g., `test/VaultStayEscrow.ts`)
- Solidity: `camelCase` for public/external, `_camelCase` for private/internal (e.g., `createListing`, `_completeRental`)
- TypeScript/React: `camelCase` (e.g., `useAllListings`, `Home`)
- Solidity: `camelCase` (e.g., `rentalCount`, `rentAmount`)
- TypeScript: `camelCase` (e.g., `totalListings`, `tvlEth`)
- Solidity: `PascalCase` for Structs/Enums (e.g., `RentalState`, `Rental`)
- TypeScript: `PascalCase` for Interfaces/Types (e.g., `Rental` in `abi.ts`)
## Code Style
- **Solidity:** Follows [Solidity Style Guide](https://docs.soliditylang.org/en/v0.8.20/style-guide.html).
- **Frontend:** Managed by Next.js defaults. Tailwind CSS for styling.
- **Frontend:** ESLint with `next/core-web-vitals` and `next/typescript` configurations in `frontend/.eslintrc.json`.
## Import Organization
- Standard relative paths used: `../components/...`, `../hooks/...`.
## Error Handling
- **Solidity:** `require(condition, "Error message")` for validation and state transitions. Reentrancy protection via `nonReentrant` modifier.
- **TypeScript:** Uses TanStack Query (`useQuery`) for error states in data fetching.
## Logging
- **Solidity:** Emits indexed events for all state-changing actions (e.g., `RentalCreated`, `RentalFunded`).
- **Scripts:** `console.log` for status updates during deployment/seeding.
## Comments
- SPDX License Identifier and Pragma version at the top of Solidity files.
- Documentation of state transitions in smart contracts.
- Not strictly enforced but used for complex logic.
## Function Design
- Solidity: Mostly state-changing (external/payable) or explicit `returns` for view functions.
- React: Functional components returning JSX.
## Module Design
- Named exports for components and hooks.
- `export default` for pages in Next.js.
- Used in `typechain-types/` and `factories/` for easier imports.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- **State-Machine Controlled:** Rentals follow a strict lifecycle (`Created`, `Funded`, `Active`, `Completed`, `Cancelled`, `Disputed`) governed by the smart contract.
- **Trustless Payments:** ETH is held in escrow by the contract and only released upon mutual confirmation or owner-mediated dispute resolution.
- **Hybrid Storage:** Critical state and payment logic are on-chain, while large metadata (images, descriptions) are stored off-chain on IPFS for cost efficiency.
## Layers
- Purpose: Manages the rental lifecycle, funds, and disputes.
- Location: `contracts/`
- Contains: `VaultStayEscrow.sol` (Core logic), `Attack.sol` (For testing security).
- Depends on: OpenZeppelin contracts (`ReentrancyGuard`, `Ownable`).
- Used by: Frontend hooks and Hardhat scripts.
- Purpose: Provides a type-safe interface for the frontend to interact with the smart contract.
- Location: `frontend/hooks/`
- Contains: `useVaultStay.ts` (Wagmi-based hooks).
- Depends on: `wagmi`, `viem`, `frontend/lib/abi.ts`.
- Used by: React components in the UI layer.
- Purpose: Handles property image and description persistence.
- Location: `frontend/lib/`
- Contains: `ipfs.ts` (Pinata SDK wrapper/mock).
- Depends on: External IPFS Gateways (Pinata).
- Used by: `create/page.tsx`, `IPFSImage.tsx`, `listings/[id]/page.tsx`.
- Purpose: Provides the user interface for listing, funding, and managing rentals.
- Location: `frontend/app/` and `frontend/components/`
- Contains: Next.js pages, Tailwind CSS components.
- Depends on: Integration Layer hooks.
## Data Flow
- **Blockchain State:** Source of truth for rental status and funds. Read via `useReadContract` hooks.
- **Application State:** Managed via `react-query` (cached blockchain reads) and local React `useState`.
- **Global Context:** Provided by `WagmiProvider` and `RainbowKitProvider` in `frontend/app/providers.tsx` for wallet connectivity.
## Key Abstractions
- Purpose: Represents the complete state and metadata of a rental listing.
- Examples: `contracts/VaultStayEscrow.sol`, `frontend/hooks/useVaultStay.ts` (implied by ABI).
- Pattern: Data transfer object (DTO) shared between contract and frontend.
- Purpose: Abstracting complex JSON-RPC calls into simple React hooks.
- Examples: `frontend/hooks/useVaultStay.ts`.
- Pattern: Hook-based service layer.
## Entry Points
- Location: `contracts/VaultStayEscrow.sol`
- Triggers: Transactions from landlord, tenant, or owner.
- Responsibilities: Ensuring valid state transitions and safe fund management.
- Location: `frontend/app/page.tsx` (and `dashboard/page.tsx`)
- Triggers: User navigation.
- Responsibilities: Orchestrating listings view and wallet connection.
- Location: `frontend/app/create/page.tsx`
- Triggers: Form submission.
- Responsibilities: IPFS upload and blockchain transaction initiation.
## Error Handling
- **Contract Modifiers:** `inState`, `onlyLandlord`, `onlyTenant`, `validRental` for input validation.
- **Frontend Receipts:** `useWaitForTransactionReceipt` to track transaction success/failure and provide UI feedback.
- **IPFS Fallback:** Mock data handling in `frontend/lib/ipfs.ts` when API keys are missing.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
