import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("VaultStayCore", function () {
    async function deployEscrowFixture() {
        const [landlord, tenant, otherAccount] = await ethers.getSigners();
        const Escrow = await ethers.getContractFactory("VaultStayCore");
        const escrow = await Escrow.deploy();

        const rent = ethers.parseEther("1");
        const deposit = ethers.parseEther("0.5");
        return { escrow, landlord, tenant, otherAccount, rent, deposit };
    }

    // Helper: Create+Fund a standard agreement
    async function createAndFund(escrow: any, landlord: any, tenant: any, rent: bigint, deposit: bigint) {
        const startDate = (await time.latest()) + 86400 * 2; // 2 days from now
        const endDate = startDate + 86400 * 5; // 5 days long

        await escrow.connect(landlord).createAgreement(tenant.address, rent, deposit, startDate, endDate, true);
        await escrow.connect(tenant).depositFunds(1, { value: rent + deposit });
        return { startDate, endDate };
    }

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            const { escrow } = await loadFixture(deployEscrowFixture);
            expect(await escrow.agreementCount()).to.equal(0);
        });
    });

    // ──────────────────────────────────────────────
    // Agreement Creation
    // ──────────────────────────────────────────────

    describe("Agreement Creation", function () {
        it("Should create an agreement successfully", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const startDate = (await time.latest()) + 86400 * 2;
            const endDate = startDate + 86400 * 5;

            await expect(escrow.createAgreement(tenant.address, rent, deposit, startDate, endDate, true))
                .to.emit(escrow, "AgreementCreated")
                .withArgs(1, landlord.address, tenant.address, rent, deposit);

            const agreement = await escrow.agreements(1);
            expect(agreement.status).to.equal(0); // Created
        });

        it("Should reject zero address tenant", async function () {
            const { escrow, rent, deposit } = await loadFixture(deployEscrowFixture);
            const startDate = (await time.latest()) + 86400;
            await expect(escrow.createAgreement(ethers.ZeroAddress, rent, deposit, startDate, startDate + 86400, true))
                .to.be.revertedWithCustomError(escrow, "ZeroAddress");
        });

        it("Should reject self-rental (landlord = tenant)", async function () {
            const { escrow, landlord, rent, deposit } = await loadFixture(deployEscrowFixture);
            const startDate = (await time.latest()) + 86400;
            await expect(escrow.createAgreement(landlord.address, rent, deposit, startDate, startDate + 86400, true))
                .to.be.revertedWithCustomError(escrow, "InvalidAmount");
        });

        it("Should reject deposit below MIN_DEPOSIT", async function () {
            const { escrow, tenant, rent } = await loadFixture(deployEscrowFixture);
            const startDate = (await time.latest()) + 86400;
            const tinyDeposit = ethers.parseEther("0.0001"); // Below 0.001 ETH
            await expect(escrow.createAgreement(tenant.address, rent, tinyDeposit, startDate, startDate + 86400, true))
                .to.be.revertedWithCustomError(escrow, "InvalidAmount");
        });
    });

    // ──────────────────────────────────────────────
    // Funding
    // ──────────────────────────────────────────────

    describe("Funding", function () {
        it("Should allow tenant to deposit funds", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const startDate = (await time.latest()) + 86400 * 2;
            const endDate = startDate + 86400 * 5;

            await escrow.createAgreement(tenant.address, rent, deposit, startDate, endDate, true);
            const total = rent + deposit;

            await expect(escrow.connect(tenant).depositFunds(1, { value: total }))
                .to.emit(escrow, "FundsDeposited")
                .withArgs(1, tenant.address);

            const agreement = await escrow.agreements(1);
            expect(agreement.status).to.equal(1); // Funded
        });

        it("Should reject incorrect deposit amount", async function () {
            const { escrow, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const startDate = (await time.latest()) + 86400 * 2;
            const endDate = startDate + 86400 * 5;
            await escrow.createAgreement(tenant.address, rent, deposit, startDate, endDate, true);

            await expect(escrow.connect(tenant).depositFunds(1, { value: rent })) // Missing deposit
                .to.be.revertedWithCustomError(escrow, "InvalidAmount");
        });

        it("Should reject non-existent agreement", async function () {
            const { escrow, tenant } = await loadFixture(deployEscrowFixture);
            await expect(escrow.connect(tenant).depositFunds(999, { value: ethers.parseEther("1") }))
                .to.be.revertedWithCustomError(escrow, "AgreementNotFound");
        });
    });

    // ──────────────────────────────────────────────
    // Check-In (Tenant OR Landlord)
    // ──────────────────────────────────────────────

    describe("Check-In", function () {
        it("Should allow tenant to confirm check-in", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate + 1);
            await expect(escrow.connect(tenant).confirmCheckIn(1))
                .to.emit(escrow, "CheckInConfirmed")
                .withArgs(1, tenant.address);

            const agreement = await escrow.agreements(1);
            expect(agreement.status).to.equal(2); // Active
        });

        it("Should allow LANDLORD to confirm check-in (audit fix #2)", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate + 1);
            await expect(escrow.connect(landlord).confirmCheckIn(1))
                .to.emit(escrow, "CheckInConfirmed")
                .withArgs(1, landlord.address);

            const agreement = await escrow.agreements(1);
            expect(agreement.status).to.equal(2); // Active
        });

        it("Should reject check-in from unauthorized user", async function () {
            const { escrow, landlord, tenant, otherAccount, rent, deposit } = await loadFixture(deployEscrowFixture);
            await createAndFund(escrow, landlord, tenant, rent, deposit);
            await expect(escrow.connect(otherAccount).confirmCheckIn(1))
                .to.be.revertedWithCustomError(escrow, "Unauthorized");
        });
    });

    // ──────────────────────────────────────────────
    // No-Show Protection (Audit Fix #1)
    // ──────────────────────────────────────────────

    describe("No-Show Protection", function () {
        it("Should allow no-show refund after grace period", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            // Advance time past startDate + 1 day grace
            await time.increaseTo(startDate + 86400 + 1);

            const tenantBalBefore = await ethers.provider.getBalance(tenant.address);
            await escrow.connect(landlord).handleNoShow(1); // Anyone can call
            const tenantBalAfter = await ethers.provider.getBalance(tenant.address);

            expect(tenantBalAfter - tenantBalBefore).to.equal(rent + deposit);

            const agreement = await escrow.agreements(1);
            expect(agreement.status).to.equal(5); // Cancelled
        });

        it("Should reject no-show before grace period expires", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate); // Exactly at start, not past grace
            await expect(escrow.connect(landlord).handleNoShow(1))
                .to.be.revertedWithCustomError(escrow, "TimeWindowNotMet");
        });
    });

    // ──────────────────────────────────────────────
    // Cancellation (Audit Fix #3 — underflow-safe)
    // ──────────────────────────────────────────────

    describe("Cancellation", function () {
        it("Should allow tenant to cancel before 24h window", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            // We are at "now" which is ~2 days before startDate, so 24h check passes
            await expect(escrow.connect(tenant).cancelBooking(1))
                .to.emit(escrow, "BookingCancelled");

            const agreement = await escrow.agreements(1);
            expect(agreement.status).to.equal(5); // Cancelled
        });

        it("Should reject tenant cancel within 24h of startDate", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate - 3600); // 1 hour before start (within 24h)
            await expect(escrow.connect(tenant).cancelBooking(1))
                .to.be.revertedWithCustomError(escrow, "TimeWindowNotMet");
        });

        it("Should allow landlord to cancel when funded", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            await createAndFund(escrow, landlord, tenant, rent, deposit);

            await expect(escrow.connect(landlord).cancelBooking(1))
                .to.emit(escrow, "BookingCancelled");
        });
    });

    // ──────────────────────────────────────────────
    // Completion + Review Window (Audit Fix #4)
    // ──────────────────────────────────────────────

    describe("Completion and Review Window", function () {
        it("Should transition to Review state on completion", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate, endDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate + 1);
            await escrow.connect(tenant).confirmCheckIn(1);

            await time.increaseTo(endDate + 1);
            await escrow.completeAgreement(1);

            const agreement = await escrow.agreements(1);
            expect(agreement.status).to.equal(4); // Review (index 4)
            expect(agreement.reviewDeadline).to.be.gt(0);
        });

        it("Should reject deposit refund before review period ends", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate, endDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate + 1);
            await escrow.connect(tenant).confirmCheckIn(1);
            await time.increaseTo(endDate + 1);
            await escrow.completeAgreement(1);

            // Try to refund immediately (before 2-day review)
            await expect(escrow.refundDeposit(1))
                .to.be.revertedWithCustomError(escrow, "ReviewPeriodNotOver");
        });

        it("Should allow deposit refund after review period", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate, endDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate + 1);
            await escrow.connect(tenant).confirmCheckIn(1);
            await time.increaseTo(endDate + 1);
            await escrow.completeAgreement(1);

            const agreement = await escrow.agreements(1);
            await time.increaseTo(Number(agreement.reviewDeadline) + 1);

            await expect(escrow.refundDeposit(1))
                .to.emit(escrow, "DepositRefunded")
                .withArgs(1, deposit);

            const final = await escrow.agreements(1);
            expect(final.status).to.equal(3); // Completed
        });
    });

    // ──────────────────────────────────────────────
    // Extension Feature (Audit Fix #7)
    // ──────────────────────────────────────────────

    describe("Agreement Extension", function () {
        it("Should allow tenant to extend an active agreement", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate, endDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate + 1);
            await escrow.connect(tenant).confirmCheckIn(1);

            const newEndDate = endDate + 86400 * 7; // Extend by 7 days
            const additionalRent = ethers.parseEther("0.5");

            await expect(escrow.connect(tenant).extendAgreement(1, newEndDate, { value: additionalRent }))
                .to.emit(escrow, "AgreementExtended")
                .withArgs(1, newEndDate, additionalRent);

            const agreement = await escrow.agreements(1);
            expect(agreement.endDate).to.equal(newEndDate);
            expect(agreement.rent).to.equal(rent + additionalRent);
        });

        it("Should reject extension with same or earlier end date", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const { startDate, endDate } = await createAndFund(escrow, landlord, tenant, rent, deposit);

            await time.increaseTo(startDate + 1);
            await escrow.connect(tenant).confirmCheckIn(1);

            await expect(escrow.connect(tenant).extendAgreement(1, endDate, { value: ethers.parseEther("0.1") }))
                .to.be.revertedWithCustomError(escrow, "InvalidDates");
        });
    });

    // ──────────────────────────────────────────────
    // Existence Checks (Audit Fix #5)
    // ──────────────────────────────────────────────

    describe("Agreement Existence Guards", function () {
        it("Should revert on non-existent agreement for all functions", async function () {
            const { escrow, tenant } = await loadFixture(deployEscrowFixture);

            await expect(escrow.connect(tenant).depositFunds(999, { value: ethers.parseEther("1") }))
                .to.be.revertedWithCustomError(escrow, "AgreementNotFound");

            await expect(escrow.connect(tenant).confirmCheckIn(999))
                .to.be.revertedWithCustomError(escrow, "AgreementNotFound");

            await expect(escrow.handleNoShow(999))
                .to.be.revertedWithCustomError(escrow, "AgreementNotFound");

            await expect(escrow.cancelBooking(999))
                .to.be.revertedWithCustomError(escrow, "AgreementNotFound");

            await expect(escrow.completeAgreement(999))
                .to.be.revertedWithCustomError(escrow, "AgreementNotFound");

            await expect(escrow.refundDeposit(999))
                .to.be.revertedWithCustomError(escrow, "AgreementNotFound");
        });
    });
});
