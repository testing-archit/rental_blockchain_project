import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("VaultStayCore V2", function () {
    const ONE_ETH = ethers.parseEther("1");
    const DEPOSIT = ethers.parseEther("0.1");
    const MIN_STAKE = ethers.parseEther("0.01");
    const DAY = 86400;

    // Status enum: Created=0, Funded=1, Active=2, Review=3, Completed=4, Cancelled=5, Disputed=6

    async function deployFixture() {
        const [owner, landlord, tenant, arbitrator, treasury, other] = await ethers.getSigners();
        const VaultStay = await ethers.getContractFactory("VaultStayCore");
        const contract = await VaultStay.deploy(treasury.address, arbitrator.address);
        await contract.waitForDeployment();
        return { contract, owner, landlord, tenant, arbitrator, treasury, other };
    }

    async function stakedLandlordFixture() {
        const base = await deployFixture();
        await base.contract.connect(base.landlord).stake({ value: MIN_STAKE });
        return base;
    }

    async function createdAgreementFixture() {
        const base = await stakedLandlordFixture();
        const now = await time.latest();
        const start = now + DAY * 2;
        const end = now + DAY * 9;
        await base.contract.connect(base.landlord).createAgreement(
            base.tenant.address, ethers.ZeroAddress, ONE_ETH, DEPOSIT, start, end
        );
        return { ...base, start, end };
    }

    async function fundedAgreementFixture() {
        const base = await createdAgreementFixture();
        const total = ONE_ETH + DEPOSIT;
        await base.contract.connect(base.tenant).deposit(1, { value: total });
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
        await base.contract.connect(base.tenant).complete(1);
        return base;
    }

    async function completedAgreementFixture() {
        const base = await reviewAgreementFixture();
        const a = await base.contract.agreements(1);
        await time.increaseTo(Number(a.reviewDeadline) + 1);
        await base.contract.connect(base.tenant).refundDeposit(1);
        return base;
    }

    // ──────────────────────────────────────────────
    // Deployment
    // ──────────────────────────────────────────────

    describe("Deployment", function () {
        it("Should set governance, treasury, arbitrator, and default fee", async function () {
            const { contract, owner, treasury, arbitrator } = await loadFixture(deployFixture);
            expect(await contract.governance()).to.equal(owner.address);
            expect(await contract.treasury()).to.equal(treasury.address);
            expect(await contract.arbitrator()).to.equal(arbitrator.address);
            expect(await contract.platformFeeBps()).to.equal(100n); // 1%
            expect(await contract.landlordStakeRequired()).to.equal(MIN_STAKE);
        });
    });

    // ──────────────────────────────────────────────
    // Staking (Problem 5)
    // ──────────────────────────────────────────────

    describe("Landlord Staking (Problem 5)", function () {
        it("Should allow landlord to stake ETH", async function () {
            const { contract, landlord } = await loadFixture(deployFixture);
            await contract.connect(landlord).stake({ value: MIN_STAKE });
            expect(await contract.landlordStake(landlord.address)).to.equal(MIN_STAKE);
        });

        it("Should allow landlord to unstake when no active agreements", async function () {
            const { contract, landlord } = await loadFixture(stakedLandlordFixture);
            await contract.connect(landlord).unstake(MIN_STAKE);
            expect(await contract.landlordStake(landlord.address)).to.equal(0n);
        });

        it("Should reject unstake with active agreements", async function () {
            const { contract, landlord } = await loadFixture(createdAgreementFixture);
            await expect(contract.connect(landlord).unstake(MIN_STAKE))
                .to.be.revertedWith("Active agreements exist");
        });

        it("Should reject agreement creation without stake", async function () {
            const { contract, landlord, tenant } = await loadFixture(deployFixture);
            const now = await time.latest();
            await expect(
                contract.connect(landlord).createAgreement(
                    tenant.address, ethers.ZeroAddress, ONE_ETH, DEPOSIT, now + DAY, now + DAY * 8
                )
            ).to.be.reverted;
        });
    });

    // ──────────────────────────────────────────────
    // Agreement Creation
    // ──────────────────────────────────────────────

    describe("Agreement Creation", function () {
        it("Should create an agreement with staked landlord", async function () {
            const { contract } = await loadFixture(createdAgreementFixture);
            expect(await contract.agreementCount()).to.equal(1n);
        });

        it("Should increment activeAgreements for landlord", async function () {
            const { contract, landlord } = await loadFixture(createdAgreementFixture);
            expect(await contract.activeAgreements(landlord.address)).to.equal(1n);
        });

        it("Should reject self-rental", async function () {
            const { contract, landlord } = await loadFixture(stakedLandlordFixture);
            const now = await time.latest();
            await expect(
                contract.connect(landlord).createAgreement(
                    landlord.address, ethers.ZeroAddress, ONE_ETH, DEPOSIT, now + DAY, now + DAY * 8
                )
            ).to.be.reverted;
        });

        it("Should reject duration exceeding MAX_DURATION", async function () {
            const { contract, landlord, tenant } = await loadFixture(stakedLandlordFixture);
            const now = await time.latest();
            await expect(
                contract.connect(landlord).createAgreement(
                    tenant.address, ethers.ZeroAddress, ONE_ETH, DEPOSIT, now + DAY, now + DAY * 400
                )
            ).to.be.reverted;
        });
    });

    // ──────────────────────────────────────────────
    // Funding & Check-In
    // ──────────────────────────────────────────────

    describe("Funding", function () {
        it("Should accept exact deposit amount", async function () {
            const { contract, tenant } = await loadFixture(createdAgreementFixture);
            await contract.connect(tenant).deposit(1, { value: ONE_ETH + DEPOSIT });
            const a = await contract.agreements(1);
            expect(a.status).to.equal(1n); // Funded
        });

        it("Should reject wrong amount", async function () {
            const { contract, tenant } = await loadFixture(createdAgreementFixture);
            await expect(contract.connect(tenant).deposit(1, { value: ONE_ETH }))
                .to.be.reverted;
        });
    });

    describe("Check-In", function () {
        it("Should allow tenant to check in after start date", async function () {
            const { contract, tenant, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start);
            await contract.connect(tenant).confirmCheckIn(1);
            const a = await contract.agreements(1);
            expect(a.status).to.equal(2n); // Active
        });

        it("Should allow landlord to check in", async function () {
            const { contract, landlord, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start);
            await contract.connect(landlord).confirmCheckIn(1);
            const a = await contract.agreements(1);
            expect(a.status).to.equal(2n); // Active
        });

        it("Should reject check-in before start date", async function () {
            const { contract, tenant } = await loadFixture(fundedAgreementFixture);
            await expect(contract.connect(tenant).confirmCheckIn(1)).to.be.reverted;
        });
    });

    // ──────────────────────────────────────────────
    // No-Show
    // ──────────────────────────────────────────────

    describe("No-Show Handling", function () {
        it("Should refund tenant and decrement activeAgreements", async function () {
            const { contract, other, landlord, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start + DAY + 1);
            await contract.connect(other).handleNoShow(1);
            const a = await contract.agreements(1);
            expect(a.status).to.equal(5n); // Cancelled
            expect(await contract.activeAgreements(landlord.address)).to.equal(0n);
        });

        it("Should reject before grace period", async function () {
            const { contract, other, start } = await loadFixture(fundedAgreementFixture);
            await time.increaseTo(start);
            await expect(contract.connect(other).handleNoShow(1)).to.be.reverted;
        });
    });

    // ──────────────────────────────────────────────
    // Completion & Platform Fee (Problem 1)
    // ──────────────────────────────────────────────

    describe("Completion & Platform Fee (Problem 1)", function () {
        it("Should deduct 1% platform fee and send to treasury", async function () {
            const { contract, treasury, end } = await loadFixture(activeAgreementFixture);
            const balBefore = await ethers.provider.getBalance(treasury.address);

            await time.increaseTo(end);
            await contract.connect((await ethers.getSigners())[5]).complete(1);

            const balAfter = await ethers.provider.getBalance(treasury.address);
            const expectedFee = ONE_ETH * 100n / 10000n; // 1%
            expect(balAfter - balBefore).to.equal(expectedFee);
        });

        it("Should move to Review status with reviewDeadline", async function () {
            const { contract, end } = await loadFixture(activeAgreementFixture);
            await time.increaseTo(end);
            await contract.connect((await ethers.getSigners())[5]).complete(1);
            const a = await contract.agreements(1);
            expect(a.status).to.equal(3n); // Review
            expect(a.reviewDeadline).to.be.greaterThan(0n);
        });
    });

    // ──────────────────────────────────────────────
    // Deposit Refund
    // ──────────────────────────────────────────────

    describe("Deposit Refund", function () {
        it("Should refund deposit after review period", async function () {
            const { contract, tenant } = await loadFixture(reviewAgreementFixture);
            const a = await contract.agreements(1);
            await time.increaseTo(Number(a.reviewDeadline) + 1);
            await contract.connect(tenant).refundDeposit(1);
            const updated = await contract.agreements(1);
            expect(updated.status).to.equal(4n); // Completed
        });

        it("Should decrement activeAgreements on refund", async function () {
            const { contract, landlord, tenant } = await loadFixture(reviewAgreementFixture);
            const a = await contract.agreements(1);
            await time.increaseTo(Number(a.reviewDeadline) + 1);
            await contract.connect(tenant).refundDeposit(1);
            expect(await contract.activeAgreements(landlord.address)).to.equal(0n);
        });

        it("Should reject refund before review deadline", async function () {
            const { contract, tenant } = await loadFixture(reviewAgreementFixture);
            await expect(contract.connect(tenant).refundDeposit(1)).to.be.reverted;
        });
    });

    // ──────────────────────────────────────────────
    // Reviews (Problem 2)
    // ──────────────────────────────────────────────

    describe("Bidirectional Reviews (Problem 2)", function () {
        it("Should allow tenant to review landlord", async function () {
            const { contract, tenant } = await loadFixture(completedAgreementFixture);
            await contract.connect(tenant).reviewLandlord(1, 5, "QmTenantReview");
            const review = await contract.landlordReviews(1);
            expect(review.rating).to.equal(5);
            expect(review.reviewer).to.equal(tenant.address);
        });

        it("Should allow landlord to review tenant", async function () {
            const { contract, landlord } = await loadFixture(completedAgreementFixture);
            await contract.connect(landlord).reviewTenant(1, 4, "QmLandlordReview");
            const review = await contract.tenantReviews(1);
            expect(review.rating).to.equal(4);
            expect(review.reviewer).to.equal(landlord.address);
        });

        it("Should reject review from wrong party", async function () {
            const { contract, tenant } = await loadFixture(completedAgreementFixture);
            await expect(contract.connect(tenant).reviewTenant(1, 5, "QmHash"))
                .to.be.reverted;
        });

        it("Should reject invalid rating (0 or 6)", async function () {
            const { contract, tenant } = await loadFixture(completedAgreementFixture);
            await expect(contract.connect(tenant).reviewLandlord(1, 0, "QmHash"))
                .to.be.reverted;
            await expect(contract.connect(tenant).reviewLandlord(1, 6, "QmHash"))
                .to.be.reverted;
        });
    });

    // ──────────────────────────────────────────────
    // Dispute Resolution (Problem 9)
    // ──────────────────────────────────────────────

    describe("Dispute Resolution (Problem 9)", function () {
        it("Should allow party to raise dispute during Review", async function () {
            const { contract, landlord } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);
            const a = await contract.agreements(1);
            expect(a.status).to.equal(6n); // Disputed
        });

        it("Should record disputeRaisedAt timestamp", async function () {
            const { contract, landlord } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);
            expect(await contract.disputeRaisedAt(1)).to.be.greaterThan(0n);
        });

        it("Should block deposit refund when disputed", async function () {
            const { contract, landlord, tenant } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);
            await expect(contract.connect(tenant).refundDeposit(1)).to.be.reverted;
        });

        it("Should allow arbitrator to resolve dispute", async function () {
            const { contract, landlord, arbitrator } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);
            await contract.connect(arbitrator).resolveDispute(1, 80);
            const a = await contract.agreements(1);
            expect(a.status).to.equal(4n); // Completed
        });

        it("Should reject non-arbitrator from resolving", async function () {
            const { contract, landlord, tenant } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);
            await expect(contract.connect(tenant).resolveDispute(1, 50)).to.be.reverted;
        });

        it("Should allow emergency resolve after timeout (50/50 split)", async function () {
            const { contract, landlord, tenant } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);
            const disputeTime = await contract.disputeRaisedAt(1);
            const timeout = await contract.DISPUTE_TIMEOUT();
            await time.increaseTo(Number(disputeTime) + Number(timeout) + 1);
            await contract.connect(tenant).emergencyResolve(1);
            const a = await contract.agreements(1);
            expect(a.status).to.equal(4n); // Completed
        });

        it("Should reject emergency resolve before timeout", async function () {
            const { contract, landlord, tenant } = await loadFixture(reviewAgreementFixture);
            await contract.connect(landlord).raiseDispute(1);
            await expect(contract.connect(tenant).emergencyResolve(1)).to.be.reverted;
        });
    });

    // ──────────────────────────────────────────────
    // Governance (Problem 6)
    // ──────────────────────────────────────────────

    describe("Governance (Problem 6)", function () {
        it("Should allow governance to update platform fee", async function () {
            const { contract, owner } = await loadFixture(deployFixture);
            await contract.connect(owner).setFee(200);
            expect(await contract.platformFeeBps()).to.equal(200n);
        });

        it("Should reject fee above max (5%)", async function () {
            const { contract, owner } = await loadFixture(deployFixture);
            await expect(contract.connect(owner).setFee(600)).to.be.reverted;
        });

        it("Should allow governance to update arbitrator", async function () {
            const { contract, owner, other } = await loadFixture(deployFixture);
            await contract.connect(owner).setArbitrator(other.address);
            expect(await contract.arbitrator()).to.equal(other.address);
        });

        it("Should allow governance to update landlord stake", async function () {
            const { contract, owner } = await loadFixture(deployFixture);
            const newStake = ethers.parseEther("0.05");
            await contract.connect(owner).setStakeRequired(newStake);
            expect(await contract.landlordStakeRequired()).to.equal(newStake);
        });

        it("Should allow governance to transfer governance", async function () {
            const { contract, owner, other } = await loadFixture(deployFixture);
            await contract.connect(owner).transferGovernance(other.address);
            expect(await contract.governance()).to.equal(other.address);
        });

        it("Should reject non-governance calls", async function () {
            const { contract, tenant } = await loadFixture(deployFixture);
            await expect(contract.connect(tenant).setFee(200))
                .to.be.revertedWith("Not governance");
        });
    });

    // ──────────────────────────────────────────────
    // Existence Guards
    // ──────────────────────────────────────────────

    describe("Existence Guards", function () {
        it("Should reject operations on non-existent agreements", async function () {
            const { contract, tenant } = await loadFixture(deployFixture);
            await expect(contract.connect(tenant).deposit(999, { value: ONE_ETH }))
                .to.be.revertedWith("Invalid ID");
        });
    });
});
