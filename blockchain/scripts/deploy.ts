import { ethers } from "hardhat";
import {
    UserTrustSystem__factory,
    OwnerGovernance__factory,
    BookFactory__factory,
    LibraryManagerContract__factory
} from "../typechain-types";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🟢 Starting deploy process...");
    console.log("👤 Using deployer address:", deployer.address);

    try {
        console.log("\n📦 Deploying UserTrustSystem...");
        const userSystem = await new UserTrustSystem__factory(deployer).deploy();
        await userSystem.waitForDeployment();
        const userSystemAddress = await userSystem.getAddress();
        console.log("✅ UserTrustSystem deployed at:", userSystemAddress);

        console.log("\n📦 Deploying OwnerGovernance...");
        const governance = await new OwnerGovernance__factory(deployer).deploy(userSystemAddress);
        await governance.waitForDeployment();
        const governanceAddress = await governance.getAddress();
        console.log("✅ OwnerGovernance deployed at:", governanceAddress);

        console.log("\n📦 Deploying BookFactory...");
        const bookFactory = await new BookFactory__factory(deployer).deploy(userSystemAddress);
        await bookFactory.waitForDeployment();
        const bookFactoryAddress = await bookFactory.getAddress();
        console.log("✅ BookFactory deployed at:", bookFactoryAddress);


        console.log("\n📦 Deploying PauseController...");
        const PausableControllerFactory = await ethers.getContractFactory("PausableController");
        const pausableController = await PausableControllerFactory.connect(deployer).deploy();
        await pausableController.waitForDeployment();
        const pausableControllerAddress = await pausableController.getAddress();
        console.log("✅ BookFactory deployed at:", pausableControllerAddress);


        console.log("\n📦 Deploying LibraryManagerContract...");
        const manager = await new LibraryManagerContract__factory(deployer).deploy();
        await manager.waitForDeployment();
        const managerAddress = await manager.getAddress();
        console.log("✅ LibraryManagerContract deployed at:", managerAddress);

        // 🔐 Transfer ownership of system contracts to LibraryManager
        console.log("\n🔐 Transferring ownerships to LibraryManager...");
        const tx1 = await userSystem.transferOwnership(managerAddress);
        await tx1.wait();
        console.log("✅ Ownership of UserTrustSystem transferred");

        const tx2 = await governance.transferOwnership(managerAddress);
        await tx2.wait();
        console.log("✅ Ownership of OwnerGovernance transferred");

        const tx3 = await bookFactory.transferOwnership(managerAddress);
        await tx3.wait();
        console.log("✅ Ownership of BookFactory transferred");

        const tx4 = await pausableController.transferOwnership(managerAddress);
        await tx4.wait();
        console.log("✅ Ownership of pausableController transferred");

        console.log("\n🛠 Calling initialize()...");
        const tx = await manager.initialize(userSystemAddress, governanceAddress, bookFactoryAddress, pausableControllerAddress);
        await tx.wait();
        console.log("🚀 LibraryManagerContract initialized!");


        console.log("\n🎉 DEPLOY COMPLETE 🎉");
        console.log("📌 Addresses:");
        console.log("  - UserTrustSystem:     ", userSystemAddress);
        console.log("  - OwnerGovernance:     ", governanceAddress);
        console.log("  - BookFactory:         ", bookFactoryAddress);
        console.log("  - LibraryManagerContract:", managerAddress);
        console.log("  - PausableController:", pausableControllerAddress);
    } catch (err) {
        console.error("💥 Deploy error:", err);
        process.exit(1);
    }
}

main();
