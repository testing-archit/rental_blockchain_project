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

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            const { escrow } = await loadFixture(deployEscrowFixture);
            expect(await escrow.agreementCount()).to.equal(0);
        });
    });

    describe("Transactions", function () {
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

        it("Should allow check-in confirmation", async function () {
            const { escrow, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const startDate = (await time.latest()) + 86400 * 2;

            await escrow.createAgreement(tenant.address, rent, deposit, startDate, startDate + 86400, true);
            await escrow.connect(tenant).depositFunds(1, { value: rent + deposit });

            await time.increaseTo(startDate + 1);

            await expect(escrow.connect(tenant).confirmCheckIn(1))
                .to.emit(escrow, "CheckInConfirmed")
                .withArgs(1);

            const agreement = await escrow.agreements(1);
            expect(agreement.status).to.equal(2); // Active
        });

        it("Should allow completion and refund", async function () {
            const { escrow, landlord, tenant, rent, deposit } = await loadFixture(deployEscrowFixture);
            const startDate = (await time.latest()) + 86400;
            const endDate = startDate + 86400;

            await escrow.createAgreement(tenant.address, rent, deposit, startDate, endDate, true);
            await escrow.connect(tenant).depositFunds(1, { value: rent + deposit });

            await time.increaseTo(startDate + 1);
            await escrow.connect(tenant).confirmCheckIn(1);

            await time.increaseTo(endDate + 1);

            // Complete transfers rent to landlord
            await expect(escrow.completeAgreement(1))
                .to.emit(escrow, "AgreementCompleted")
                .withArgs(1);

            // Refund transfers deposit to tenant
            await expect(escrow.refundDeposit(1))
                .to.emit(escrow, "DepositRefunded")
                .withArgs(1, deposit);
        });
    });
});
