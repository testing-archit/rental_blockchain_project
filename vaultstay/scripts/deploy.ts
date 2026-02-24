import { ethers } from "hardhat";

async function main() {
    console.log("Deploying VaultStayCore...");

    const EscrowFactory = await ethers.getContractFactory("VaultStayCore");
    const escrow = await EscrowFactory.deploy();
    await escrow.waitForDeployment();

    console.log(`VaultStayCore deployed to: ${await escrow.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
