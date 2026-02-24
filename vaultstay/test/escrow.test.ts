import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("VaultStayCore V2", function () {
    const ONE_ETH = ethers.parseEther("1");
    const HALF_ETH = ethers.parseEther("0.5");
    const DEPOSIT = ethers.parseEther("0.1");
    const MIN_STAKE = ethers.parseEther("0.01");
    const DAY = 86400;

    async function deployFixture() {
        const [owner, landlord, tenant, arbitrator, treasury, other] = await ethers.getSigners();
        const VaultStay = await ethers.getContractFactory("VaultStayCore");
        const contract = await VaultStay.deploy(treasury.address, arbitrator.address);
        await contract.waitForDeployment();
        return { contract, owner, landlord, tenant, arbitrator, treasury, other };
    }

    async function stakedLandlordFixture() {
        const base = await deployFixture();
        // Landlord stakes
        await base.contract.connect(base.landlord).stakeLandlord({ value: MIN_STAKE });
        return base;
    }

    async function createdAgreementFixture() {
        const base = await stakedLandlordFixture();
        const now = await time.latest();
        const start = now + DAY;
        const end = now + DAY * 8;
        await base.contract.connect(base.landlord).createAgreement(
            base.tenant.address, ONE_ETH, DEPOSIT, start, end, true, ethers.ZeroAddress
        );
        return { ...base, start, end };
    }

    async function fundedAgreementFixture() {
        const base = await createdAgreementFixture();
        const total = ONE_ETH + DEPOSIT;
        await base.contract.connect(base.tenant).depositFunds(1, { value: total });
        return base;
    }

    async function activeAgreementFixture() {
        const base = await fundedAgreementFixture();
        await time.increaseTo(base.start);
        await base.contract.connect(base.tenant).confirmCheckIn(1);
        return base;
    }

    async function reviewAgreementFixture() {
        const base = await activeAgreementFixture();
        await time.increaseTo(base.end);
        await base.contract.connect(base.tenant).completeAgreement(1);
        return base;
    }

    // ──────────────────────────────────────────────
    // Deployment
    // ──────────────────────────────────────────────

    describe("Deployment", function () {
        it("Should set governance, treasury, arbitrator, and default fee", async function () {
            const { contract, owner, treasury, arbitrator } = await loadFixture(deployFixture);
            expect(await contract.governance()).to.equal(owner.address);
            expect(await contract.platformTreasury()).to.equal(treasury.address);
            expect(await contract.arbitrator()).to.equal(arbitrator.address);
            expect(await contract.platformFeePercent()).to.equal(100n); // 1%
            expect(await contract.landlordStakeRequired()).to.equal(MIN_STAKE);
        });
    });

    // ──────────────────────────────────────────────
    // Problem 5: Landlord Staking
    // ──────────────────────────────────────────────

    describe("Landlord Staking (Problem 5)", function () {
        it("Should allow landlord to stake ETH", async function () {
            const { contract, landlord } = await loadFixture(deployFixture);
            await expect(contract.connect(landlord).stakeLandlord({ value: MIN_STAKE }))
                .to.emit(contract, "LandlordStaked")
                .withArgs(landlord.address, MIN_STAKE);
            expect(await contract.landlordStakes(landlord.address)).to.equal(MIN_STAKE);
        });

        it("Should allow landlord to unstake ETH", async function () {
            const { contract, landlord } = await loadFixture(stakedLandlordFixture);
            await expect(contract.connect(landlord).unstakeLandlord(MIN_STAKE))
                .to.emit(contract, "LandlordUnstaked");
        });

        it("Should reject agreement creation without stake", async function () {
            const { contract, landlord, tenant } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                contract.connect(landlord).createAgreement(
                    tenant.address, ONE_ETH, DEPOSIT, now + DAY, now + DAY * 8, true, ethers.ZeroAddress
                )
            ).to.be.revertedWithCustomError(contract, "InsufficientStake");
        });
    });

    // ──────────────────────────────────────────────
    // Agreement Creation
    // ──────────────────────────────────────────────

    describe("Agreement Creation", function () {
        it("Should create an agreement with staked landlord", async function () {
            const { contract, landlord, tenant } = await loadFixture(stakedLandlordFixture);
            const now = await time.latest();
            await expect(
                contract.connect(landlord).createAgreement(
                    tenant.address, ONE_ETH, DEPOSIT, now + DAY, now + DAY * 8, true, ethers.ZeroAddress
                )
            ).to.emit(contract, "AgreementCreated");
            expect(await contract.agreementCount()).to.equal(1n);
        });

        it("Should reject zero address tenant", async function () {
            const { contract, landlord } = await loadFixture(stakedLandlordFixture);
            const now = await time.latest();
            await expect(
                contract.connect(landlord).createAgreement(
                    ethers.ZeroAddress, ONE_ETH, DEPOSIT, now + DAY, now + DAY * 8, true, ethers.ZeroAddress
                )
            ).to.be.revertedWithCustomError(contract, "ZeroAddress");
        });

        it("Should reject self-rental", async function () {
            const { contract, landlord } = await loadFixture(stakedLandlordFixture);
            const now = await time.latest();
            await expect(
                contract.connect(landlord).createAgreement(
                    landlord.address, ONE_ETH, DEPOSIT, now + DAY, now + DAY * 8, true, ethers.ZeroAddress
                )
            ).to.be.revertedWithCustomError(contract, "InvalidAmount");
        });
    });

    // ──────────────────────────────────────────────
    // Funding & Check-In
    // ──────────────────────────────────────────────

    describe("Funding", function () {
        it("Should accept exact deposit amount", async function () {
            const { contract, tenant } = await loadFixture(createdAgreementFixture);
            await expect(contract.connect(tenant).depositFunds(1, { value: ONE_ETH + DEPOSIT }))
                .to.emit(contract, "FundsDeposited");
        });

        it("Should reject wrong amount", async function () {
            const { contract, tenant } = await loadFixture(createdAgreementFixture);
            await expect(contract.connect(tenant).depositFunds(1, { value: ONE_ETH }))
                .to.be.revertedWithCustomError(contract, "InvalidAmount");
        });
    });

    describe("Check-In", function () {
        it("Should allow tenant to check in", async function () {
            const { contract, tenant, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start);
            await expect(contract.connect(tenant).confirmCheckIn(1))
                .to.emit(contract, "CheckInConfirmed")
                .to.emit(contract, "StayVerified"); // Problem 10: auditability
        });

        it("Should allow landlord to check in", async function () {
            const { contract, landlord, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start);
            await expect(contract.connect(landlord).confirmCheckIn(1))
                .to.emit(contract, "CheckInConfirmed");
        });
    });

    // ──────────────────────────────────────────────
    // No-Show
    // ──────────────────────────────────────────────

    describe("No-Show Handling", function () {
        it("Should refund tenant after grace period", async function () {
            const { contract, other, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start + DAY + 1);
            await expect(contract.connect(other).handleNoShow(1))
                .to.emit(contract, "NoShowHandled");
        });

        it("Should reject before grace period", async function () {
            const { contract, other, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start);
            await expect(contract.connect(other).handleNoShow(1))
                .to.be.revertedWithCustomError(contract, "TimeWindowNotMet");
        });
    });

    // ──────────────────────────────────────────────
    // Problem 3: Landlord Cancellation Penalty
    // ──────────────────────────────────────────────

    describe("Cancellation with Landlord Penalty (Problem 3)", function () {
        it("Should allow tenant to cancel before 24h window", async function () {
            // Need a distant start date so block.timestamp + 24h < startDate
            const base = await loadFixture(stakedLandlordFixture);
            const now = await time.latest();
            const distantStart = now + DAY * 7; // 7 days out
            const distantEnd = now + DAY * 14;
            await base.contract.connect(base.landlord).createAgreement(
                base.tenant.address, ONE_ETH, DEPOSIT, distantStart, distantEnd, true, ethers.ZeroAddress
            );
            await base.contract.connect(base.tenant).depositFunds(1, { value: ONE_ETH + DEPOSIT });
            await expect(base.contract.connect(base.tenant).cancelBooking(1))
                .to.emit(base.contract, "BookingCancelled");
        });

        it("Should penalize landlord on cancel from stake", async function () {
            const { contract, landlord, tenant } = await loadFixture(fundedAgreementFixture);
            const stakeBeforeCancel = await contract.landlordStakes(landlord.address);

            await expect(contract.connect(landlord).cancelBooking(1))
                .to.emit(contract, "LandlordPenalized")
                .to.emit(contract, "BookingCancelled");

            const stakeAfterCancel = await contract.landlordStakes(landlord.address);
            expect(stakeAfterCancel).to.be.lessThan(stakeBeforeCancel);
        });
    });

    // ──────────────────────────────────────────────
    // Problem 1: Platform Fee on Completion
    // ──────────────────────────────────────────────

    describe("Platform Fee on Completion (Problem 1)", function () {
        it("Should deduct 1% platform fee from rent on completion", async function () {
            const { contract, treasury, end } = await loadFixture(activeAgreementFixture);
            const balBefore = await ethers.provider.getBalance(treasury.address);

            await time.increaseTo(end);
            await contract.connect((await ethers.getSigners())[2]).completeAgreement(1);

            const balAfter = await ethers.provider.getBalance(treasury.address);
            const expectedFee = ONE_ETH * 100n / 10000n; // 1%
            expect(balAfter - balBefore).to.equal(expectedFee);
        });

        it("Should emit AgreementCompleted with fee info", async function () {
            const { contract, end } = await loadFixture(activeAgreementFixture);
            await time.increaseTo(end);
            await expect(contract.connect((await ethers.getSigners())[2]).completeAgreement(1))
                .to.emit(contract, "AgreementCompleted");
        });
    });

    // ──────────────────────────────────────────────
    // Problem 2: Review System
    // ──────────────────────────────────────────────

    describe("Review System (Problem 2)", function () {
        it("Should allow tenant to submit review after completion", async function () {
            const { contract, tenant } = await loadFixture(reviewAgreementFixture);
            await expect(contract.connect(tenant).submitReview(1, 5, "QmIPFSHash123"))
                .to.emit(contract, "ReviewSubmitted")
                .withArgs(1n, tenant.address, 5, "QmIPFSHash123");
        });

        it("Should reject duplicate review", async function () {
            const { contract, tenant } = await loadFixture(reviewAgreementFixture);
            await contract.connect(tenant).submitReview(1, 4, "QmHash1");
            await expect(contract.connect(tenant).submitReview(1, 5, "QmHash2"))
                .to.be.revertedWithCustomError(contract, "AlreadyReviewed");
        });

        it("Should reject review from non-tenant", async function () {
            const { contract, landlord } = await loadFixture(reviewAgreementFixture);
            await expect(contract.connect(landlord).submitReview(1, 5, "QmHash"))
                .to.be.revertedWithCustomError(contract, "Unauthorized");
        });

        it("Should reject invalid rating", async function () {
            const { contract, tenant } = await loadFixture(reviewAgreementFixture);
            await expect(contract.connect(tenant).submitReview(1, 0, "QmHash"))
                .to.be.revertedWithCustomError(contract, "InvalidRating");
            await expect(contract.connect(tenant).submitReview(1, 6, "QmHash"))
                .to.be.revertedWithCustomError(contract, "InvalidRating");
        });
    });

    // ──────────────────────────────────────────────
    // Problem 9: Dispute Resolution
    // ──────────────────────────────────────────────

    describe("Dispute Resolution (Problem 9)", function () {
        it("Should allow party to raise dispute during Review", async function () {
            const { contract, landlord } = await loadFixture(reviewAgreementFixture);
            await expect(contract.connect(landlord).raiseDispute(1))
                .to.emit(contract, "DisputeRaised")
                .withArgs(1n, landlord.address);
        });

        it("Should block deposit refund when disputed", async function () {
            const { contract, landlord, tenant } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);

            const agreement = await contract.agreements(1);
            await time.increaseTo(Number(agreement.reviewDeadline) + 1);

            await expect(contract.connect(tenant).refundDeposit(1))
                .to.be.revertedWithCustomError(contract, "InvalidState");
        });

        it("Should allow arbitrator to resolve dispute (tenant favored)", async function () {
            const { contract, landlord, tenant, arbitrator } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);

            // 80% to tenant
            await expect(contract.connect(arbitrator).resolveDispute(1, 80))
                .to.emit(contract, "DisputeResolved");
        });

        it("Should reject non-arbitrator from resolving", async function () {
            const { contract, landlord, tenant } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);
            await expect(contract.connect(tenant).resolveDispute(1, 50))
                .to.be.revertedWithCustomError(contract, "NotArbitrator");
        });
    });

    // ──────────────────────────────────────────────
    // Problem 6: Governance
    // ──────────────────────────────────────────────

    describe("Governance (Problem 6)", function () {
        it("Should allow governance to update platform fee", async function () {
            const { contract, owner } = await loadFixture(deployFixture);
            await expect(contract.connect(owner).updatePlatformFee(200))
                .to.emit(contract, "PlatformFeeUpdated")
                .withArgs(100n, 200n);
            expect(await contract.platformFeePercent()).to.equal(200n);
        });

        it("Should reject fee above max (5%)", async function () {
            const { contract, owner } = await loadFixture(deployFixture);
            await expect(contract.connect(owner).updatePlatformFee(600))
                .to.be.revertedWithCustomError(contract, "FeeTooHigh");
        });

        it("Should allow governance to update arbitrator", async function () {
            const { contract, owner, other } = await loadFixture(deployFixture);
            await expect(contract.connect(owner).updateArbitrator(other.address))
                .to.emit(contract, "ArbitratorUpdated");
        });

        it("Should allow governance to update landlord stake", async function () {
            const { contract, owner } = await loadFixture(deployFixture);
            const newStake = ethers.parseEther("0.05");
            await expect(contract.connect(owner).updateLandlordStakeRequired(newStake))
                .to.emit(contract, "LandlordStakeUpdated");
        });

        it("Should allow governance to transfer governance", async function () {
            const { contract, owner, other } = await loadFixture(deployFixture);
            await expect(contract.connect(owner).transferGovernance(other.address))
                .to.emit(contract, "GovernanceTransferred");
            expect(await contract.governance()).to.equal(other.address);
        });

        it("Should reject non-governance calls", async function () {
            const { contract, tenant } = await loadFixture(deployFixture);
            await expect(contract.connect(tenant).updatePlatformFee(200))
                .to.be.revertedWithCustomError(contract, "Unauthorized");
        });
    });

    // ──────────────────────────────────────────────
    // Deposit Refund & Extension
    // ──────────────────────────────────────────────

    describe("Deposit Refund", function () {
        it("Should refund deposit after review period (no dispute)", async function () {
            const { contract, tenant } = await loadFixture(reviewAgreementFixture);
            const agreement = await contract.agreements(1);
            await time.increaseTo(Number(agreement.reviewDeadline) + 1);

            await expect(contract.connect(tenant).refundDeposit(1))
                .to.emit(contract, "DepositRefunded");
        });
    });

    describe("Extension", function () {
        it("Should extend active agreement with additional rent", async function () {
            const { contract, tenant, end } = await loadFixture(activeAgreementFixture);
            const newEnd = end + DAY * 7;
            await expect(contract.connect(tenant).extendAgreement(1, newEnd, { value: HALF_ETH }))
                .to.emit(contract, "AgreementExtended");
        });
    });

    // ──────────────────────────────────────────────
    // Problem 10: Event Auditability
    // ──────────────────────────────────────────────

    describe("Event Auditability (Problem 10)", function () {
        it("Should emit StayVerified on check-in", async function () {
            const { contract, tenant, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start);
            await expect(contract.connect(tenant).confirmCheckIn(1))
                .to.emit(contract, "StayVerified");
        });

        it("Should emit StayVerified on completion", async function () {
            const { contract, end } = await loadFixture(activeAgreementFixture);
            await time.increaseTo(end);
            await expect(contract.connect((await ethers.getSigners())[2]).completeAgreement(1))
                .to.emit(contract, "StayVerified");
        });
    });

    // ──────────────────────────────────────────────
    // Existence Guards
    // ──────────────────────────────────────────────

    describe("Existence Guards", function () {
        it("Should reject operations on non-existent agreements", async function () {
            const { contract, tenant } = await loadFixture(deployFixture);
            await expect(contract.connect(tenant).depositFunds(999, { value: ONE_ETH }))
                .to.be.revertedWithCustomError(contract, "AgreementNotFound");
        });
    });
});
