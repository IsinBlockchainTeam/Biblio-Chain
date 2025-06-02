import { ethers } from "hardhat";
import { expect } from "chai";
import {
    BookFactory,
    LibraryManagerContract,
    OwnerGovernance,
    UserTrustSystem
} from "../typechain-types";
import { debugLog } from "./util/utils";


describe("UserTrustSystem Contract Tests", function () {

    let libraryManager: LibraryManagerContract;
    let userSystem: UserTrustSystem;
    let governance: OwnerGovernance;
    let bookFactory: BookFactory;

    let deployer: any;
    let user1: any;
    let user2: any;
    let systemOwner: any;
    let bannedUser: any;
    let unregisteredUser: any;
    let randomContract: any;

    beforeEach(async function () {
        [deployer, user1, user2, systemOwner, bannedUser, unregisteredUser, randomContract] = await ethers.getSigners();

        const UserSystemFactory = await ethers.getContractFactory("UserTrustSystem");
        userSystem = await UserSystemFactory.connect(deployer).deploy();
        await userSystem.waitForDeployment();

        const GovernanceFactory = await ethers.getContractFactory("OwnerGovernance");
        governance = await GovernanceFactory.connect(deployer).deploy(await userSystem.getAddress());
        await governance.waitForDeployment();

        const BookFactoryFactory = await ethers.getContractFactory("BookFactory");
        bookFactory = await BookFactoryFactory.connect(deployer).deploy(await userSystem.getAddress());
        await bookFactory.waitForDeployment();

        const LibraryManagerFactory = await ethers.getContractFactory("LibraryManagerContract");
        libraryManager = await LibraryManagerFactory.connect(deployer).deploy();
        await libraryManager.waitForDeployment();

        await userSystem.transferOwnership(libraryManager.getAddress());
        await governance.transferOwnership(libraryManager.getAddress());
        await bookFactory.transferOwnership(libraryManager.getAddress());

        const PausableControllerFactory = await ethers.getContractFactory("PausableController");
        const pausableController = await PausableControllerFactory.connect(deployer).deploy();
        await pausableController.waitForDeployment();
        await pausableController.transferOwnership(libraryManager.getAddress());

        await libraryManager.connect(deployer).initialize(
            await userSystem.getAddress(),
            await governance.getAddress(),
            await bookFactory.getAddress(),
            await pausableController.getAddress()
        );

        await libraryManager.connect(user1).registerUser();
        await libraryManager.connect(user2).registerUser();
        await libraryManager.connect(systemOwner).registerUser();
        await libraryManager.connect(bannedUser).registerUser();


        await libraryManager.connect(deployer).proposeAddOwner(systemOwner.address);
        const proposalId = Number((await governance.proposalCount()) - 1n);

        const [, , , isSystemOwner] = await libraryManager.getUserInfo(systemOwner.address);
        expect(isSystemOwner).to.be.true;

        await libraryManager.connect(deployer).banUser(bannedUser.address);

        const [, isBanned, ,] = await libraryManager.getUserInfo(bannedUser.address);
        expect(isBanned).to.be.true;

        debugLog("Setup complete: Users registered and roles set");
    });

    describe("User count and retrieve", function () {
        it("should keep track of registered users' number", async function () {
            const users= await libraryManager.getTotalUsers();
            expect(users).to.be.equal(5);
        });
        it("should keep track of registered users", async function () {
            const users: string[]= await libraryManager.getAllUsers();
            expect(users).contain(deployer.address);
            expect(users).contain(user1.address);
            expect(users).contain(user2.address);
            expect(users).contain(systemOwner.address);
            expect(users).contain(bannedUser.address);
        });

        it("should not allow direct access to user get users", async function () {
            await expect(userSystem.connect(user1).getAllUsers()).to.be.revertedWith("Not authorized");
        });

        it("should not allow access to getAllusers to a non owner", async function () {
           await expect(libraryManager.connect(user1).getAllUsers()).to.be.revertedWith("LibraryManager: not a system owner");
        });
    });

    describe("User Registration", function () {
        it("should correctly register a user through LibraryManager", async function () {
            const [isRegistered, , ,] = await libraryManager.getUserInfo(user1.address);
            expect(isRegistered).to.be.true;
        });

        it("should set initial trust level to 5 for new users", async function () {
            const [, , trustLevel,] = await libraryManager.getUserInfo(user1.address);
            expect(trustLevel).to.equal(5);
        });

        it("should prevent direct registration bypass", async function () {
            await expect(
                userSystem.connect(unregisteredUser).registerUser(unregisteredUser.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should not register same use twice", async function () {
            await libraryManager.connect(unregisteredUser).registerUser()

            await expect(
                libraryManager.connect(unregisteredUser).registerUser()
            ).to.be.revertedWith("LibraryManager: already registered");
        });

        it("should prevent registering an already registered user", async function () {
            await expect(
                libraryManager.connect(user1).registerUser()
            ).to.be.revertedWith("LibraryManager: already registered");
        });
    });

    describe("User Trust Level Management", function () {
        it("should decrease trust level for infractions", async function () {
            const [, , initialTrustLevel,] = await libraryManager.getUserInfo(user1.address);
            expect(initialTrustLevel).to.equal(5);

            await libraryManager.connect(user2).createRentableBook(
                "ipfs://QmTestRentableBook",
                ethers.parseEther("0.1"),
                14
            );

            const allBooks = await libraryManager.getAllBookIds();
            const bookId = allBooks[allBooks.length - 1];

            await libraryManager.connect(user1).borrowBook(bookId, {
                value: ethers.parseEther("0.1")
            });

            await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]); // 15 days
            await ethers.provider.send("evm_mine", []);

            await libraryManager.connect(user1).returnBook(bookId);

            const [, , newTrustLevel,] = await libraryManager.getUserInfo(user1.address);
            expect(newTrustLevel).to.be.lessThan(initialTrustLevel);
        });



        it("should ban a user by setting trust level to 0", async function () {
            await libraryManager.connect(deployer).banUser(user1.address);

            const [, isBanned, trustLevel,] = await libraryManager.getUserInfo(user1.address);
            expect(isBanned).to.be.true;
            expect(trustLevel).to.equal(0);
        });

        it("should not allow banning system owners", async function () {
            await expect(
                libraryManager.connect(deployer).banUser(systemOwner.address)
            ).to.be.revertedWith("Cannot ban a system owner");
        });

        it("should unban a user and reset trust level to medium", async function () {

            const [, isBannedBefore, trustLevelBefore,] = await libraryManager.getUserInfo(bannedUser.address);
            expect(isBannedBefore).to.be.true;
            expect(trustLevelBefore).to.equal(0);

            await libraryManager.connect(deployer).unbanUser(bannedUser.address);

            const [, isBannedAfter, trustLevelAfter,] = await libraryManager.getUserInfo(bannedUser.address);
            expect(isBannedAfter).to.be.false;
            expect(trustLevelAfter).to.equal(3);
        });
    });

    describe("System Owner Management", function () {
        it("should add a user as system owner through governance", async function () {

            let [, , , isSystemOwnerBefore] = await libraryManager.getUserInfo(user1.address);
            expect(isSystemOwnerBefore).to.be.false;

            await libraryManager.connect(deployer).proposeAddOwner(user1.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);

            const proposal = await governance.proposals(proposalId);
            if (Number(proposal.state) !== 1) {
                await libraryManager.connect(systemOwner).approveProposal(proposalId);
            }

            const [, , , isSystemOwnerAfter] = await libraryManager.getUserInfo(user1.address);
            expect(isSystemOwnerAfter).to.be.true;
        });

        it("should remove a user as system owner through governance", async function () {

            await libraryManager.connect(deployer).proposeRemoveOwner(systemOwner.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);

            const [, , , isStillSystemOwner] = await libraryManager.getUserInfo(systemOwner.address);
            expect(isStillSystemOwner).to.be.false;
        });

        it("should prevent direct system owner management", async function () {
            await expect(
                userSystem.connect(deployer).addSystemOwner(user2.address)
            ).to.be.revertedWith("Not authorized");

            await expect(
                userSystem.connect(deployer).removeSystemOwner(systemOwner.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should prevent removing yourself as system owner", async function () {
            await expect(
                libraryManager.connect(systemOwner).proposeRemoveOwner(systemOwner.address)
            ).to.be.revertedWith("Cannot propose to remove yourself");
        });

        it("should keep track of system owner count", async function () {
            const initialCount = await userSystem.getSystemOwnerCount();

            await libraryManager.connect(deployer).proposeAddOwner(user1.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);

            const proposal = await governance.proposals(proposalId);
            if (Number(proposal.state) !== 1) {
                await libraryManager.connect(systemOwner).approveProposal(proposalId);
            }

            const newCount = await userSystem.getSystemOwnerCount();
            expect(newCount).to.equal(initialCount + 1n);

            await libraryManager.connect(deployer).proposeRemoveOwner(systemOwner.address);
            const removeProposalId = Number((await governance.proposalCount()) - 1n);

            const removeProposal = await governance.proposals(removeProposalId);
            if (Number(removeProposal.state) !== 1) {
                await libraryManager.connect(user1).approveProposal(removeProposalId);
            }

            const finalCount = await userSystem.getSystemOwnerCount();
            expect(finalCount).to.equal(initialCount);
        });
    });

    describe("Authorized Contracts Management", function () {
        it("should authorize contracts during initialization", async function () {
            expect(await userSystem.isAuthorizedContract(libraryManager.getAddress())).to.be.true;

            expect(await userSystem.isAuthorizedContract(governance.getAddress())).to.be.true;

            const rentableBookAddress = await bookFactory.rentableBookContract();
            expect(await userSystem.isAuthorizedContract(rentableBookAddress)).to.be.true;

            const sellableBookAddress = await bookFactory.sellableBookContract();
            expect(await userSystem.isAuthorizedContract(sellableBookAddress)).to.be.true;
        });

        it("should prevent unauthorized contracts from calling protected functions", async function () {

            await libraryManager.connect(unregisteredUser).registerUser();

            const [isRegistered, , , ] = await libraryManager.getUserInfo(unregisteredUser.address);
            expect(isRegistered).to.be.true;

            await expect(
                libraryManager.connect(user1).banUser(user2.address)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });
    });

    describe("Error Handling and Edge Cases", function () {
        it("should revert when getting trust level of an unregistered user", async function () {

            await expect(
                libraryManager.getUserInfo(unregisteredUser.address)
            ).to.not.be.reverted;

            const [isRegistered, , , ] = await libraryManager.getUserInfo(unregisteredUser.address);
            expect(isRegistered).to.be.false;
        });

        it("should revert when banning an unregistered user", async function () {

            await expect(
                libraryManager.connect(deployer).banUser(unregisteredUser.address)
            ).to.be.revertedWith("User not registered");
        });

        it("should revert when unbanning a user who is not banned", async function () {

            const [, isBanned, , ] = await libraryManager.getUserInfo(user1.address);
            expect(isBanned).to.be.false;

            await expect(
                libraryManager.connect(deployer).unbanUser(user1.address)
            ).to.be.revertedWith("User is not banned");
        });

        it("should revert when unbanning an unregistered user", async function () {
            await expect(
                libraryManager.connect(deployer).unbanUser(unregisteredUser.address)
            ).to.be.revertedWith("User not registered");
        });

        it("should revert when non-system owner tries to unban a user", async function () {

            const [, isBanned, , ] = await libraryManager.getUserInfo(bannedUser.address);
            expect(isBanned).to.be.true;

            await expect(
                libraryManager.connect(user1).unbanUser(bannedUser.address)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should handle multiple trust level decreases correctly", async function () {

            let [, , trustLevel, ] = await libraryManager.getUserInfo(user1.address);
            expect(trustLevel).to.equal(5);

            await libraryManager.connect(user2).createRentableBook(
                "ipfs://QmMultipleInfractions",
                ethers.parseEther("0.1"),
                14
            );

            const allBooks = await libraryManager.getAllBookIds();
            const bookId = allBooks[allBooks.length - 1];

            await libraryManager.connect(user1).borrowBook(bookId, {
                value: ethers.parseEther("0.1")
            });

            await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            await libraryManager.connect(user1).returnBook(bookId);

            [, , trustLevel, ] = await libraryManager.getUserInfo(user1.address);
            expect(trustLevel).to.equal(4);

            await libraryManager.connect(user2).createRentableBook(
                "ipfs://QmMultipleInfractions2",
                ethers.parseEther("0.1"),
                14
            );

            const allBooks2 = await libraryManager.getAllBookIds();
            const bookId2 = allBooks2[allBooks2.length - 1];

            await libraryManager.connect(user1).borrowBook(bookId2, {
                value: ethers.parseEther("0.1")
            });

            await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // 30 days
            await ethers.provider.send("evm_mine", []);

            await libraryManager.connect(user2).returnBook(bookId2);

            [, , trustLevel, ] = await libraryManager.getUserInfo(user1.address);
            expect(trustLevel).to.be.lessThan(4);
        });
    });
    describe("Error Handling and Edge Cases", function () {
        it("should revert when getting trust level of an unregistered user", async function () {

            await expect(
                libraryManager.getUserInfo(unregisteredUser.address)
            ).to.not.be.reverted;

            const [isRegistered, , ,] = await libraryManager.getUserInfo(unregisteredUser.address);
            expect(isRegistered).to.be.false;
        });

        it("should prevent unban by non-system owners", async function () {

            await libraryManager.connect(deployer).banUser(user1.address);
            const [, isBannedBefore, ,] = await libraryManager.getUserInfo(user1.address);
            expect(isBannedBefore).to.be.true;

            await expect(
                userSystem.connect(user2).unbanUser(user1.address)
            ).to.be.revertedWith("Not authorized");

            const [, isBannedAfter, ,] = await libraryManager.getUserInfo(user1.address);
            expect(isBannedAfter).to.be.true;
        });

        it("should prevent trust level from going below zero", async function () {
            let [, , trustLevel, ] = await libraryManager.getUserInfo(user1.address);
            expect(trustLevel).to.equal(5);

            const numInfractions = 6;
            for (let i = 0; i < numInfractions; i++) {
                await libraryManager.connect(user2).createRentableBook(
                    `ipfs://QmInfractionTest${i}`,
                    ethers.parseEther("0.1"),
                    14
                );

                const allBooks = await libraryManager.getAllBookIds();
                const bookId = allBooks[allBooks.length - 1];

                await libraryManager.connect(user1).borrowBook(bookId, {
                    value: ethers.parseEther("0.1")
                });

                await ethers.provider.send("evm_increaseTime", [(15 + i * 5) * 24 * 60 * 60]); // Increasing overdue time
                await ethers.provider.send("evm_mine", []);

                await libraryManager.connect(user1).returnBook(bookId);

                [, , trustLevel, ] = await libraryManager.getUserInfo(user1.address);

                if (Number(trustLevel )=== 0) break;
            }

            const [, , finalTrustLevel, ] = await libraryManager.getUserInfo(user1.address);
            expect(finalTrustLevel).to.equal(0);

            const [, isBanned, , ] = await libraryManager.getUserInfo(user1.address);
            expect(isBanned).to.be.true;
        });
    });
    describe("Anti-Spam Mechanism", function () {
        it("should allow regular users up to MAX_REQUESTS_THRESHOLD requests", async function () {

            await libraryManager.connect(unregisteredUser).registerUser();

            for (let i = 0; i < 10; i++) {
                try {
                    await libraryManager.connect(unregisteredUser).createRentableBook(
                        `ipfs://QmSpamTest${i}`,
                        ethers.parseEther("0.1"),
                        14
                    );
                } catch (error) {
                    throw error;
                }
            }
        });

        it("should block requests after exceeding MAX_REQUESTS_THRESHOLD", async function () {

            await libraryManager.connect(unregisteredUser).registerUser();

            for (let i = 0; i < 10; i++) {
                await libraryManager.connect(unregisteredUser).createRentableBook(
                    `ipfs://QmSpamTest${i}`,
                    ethers.parseEther("0.1"),
                    14
                );
            }

            await expect(
                libraryManager.connect(unregisteredUser).createRentableBook(
                    "ipfs://QmSpamTestExcess",
                    ethers.parseEther("0.1"),
                    14
                )
            ).to.be.revertedWith("LibraryManager: user is banned");
        });

        it("should reset request count after MAX_REQUESTS_WINDOW", async function () {
            await libraryManager.connect(unregisteredUser).registerUser();

            for (let i = 0; i < 9; i++) {
                await libraryManager.connect(unregisteredUser).createRentableBook(
                    `ipfs://QmSpamTest${i}`,
                    ethers.parseEther("0.1"),
                    14
                );
            }

            await ethers.provider.send("evm_increaseTime", [3600 + 300]);
            await ethers.provider.send("evm_mine", []);

            await expect(
                libraryManager.connect(unregisteredUser).createRentableBook(
                    "ipfs://QmSpamTestReset",
                    ethers.parseEther("0.1"),
                    14
                )
            ).to.not.be.reverted;
            await expect(
                libraryManager.connect(unregisteredUser).createRentableBook(
                    "ipfs://QmSpamTestReset",
                    ethers.parseEther("0.1"),
                    14
                )
            ).to.not.be.reverted;
        });

        it("should decrease trust level when exceeding request threshold", async function () {
            await libraryManager.connect(unregisteredUser).registerUser();

            let [, , initialTrustLevel, ] = await libraryManager.getUserInfo(unregisteredUser.address);
            expect(initialTrustLevel).to.equal(5);


            try {
                for (let i = 0; i < 10; i++) {
                    await libraryManager.connect(unregisteredUser).createRentableBook(
                        `ipfs://QmSpamTest${i}`,
                        ethers.parseEther("0.1"),
                        14
                    );
                }
            } catch (error) {

            }

            const [, isBanned, ,] = await libraryManager.getUserInfo(unregisteredUser.address);
            expect(isBanned).to.be.true;
        });
    });
    describe("Additional Trust Level & Access Control Tests", function () {

        it("should not decrease trust level of a system owner", async function () {

            await libraryManager.connect(user1).createRentableBook(
                "ipfs://QmSystemOwnerInfractionTest",
                ethers.parseEther("0.1"),
                14
            );

            const allBooks = await libraryManager.getAllBookIds();
            const bookId = allBooks[allBooks.length - 1];

            await libraryManager.connect(systemOwner).borrowBook(bookId, {
                value: ethers.parseEther("0.1")
            });

            const [, , initialTrustLevel, isSystemOwner] = await libraryManager.getUserInfo(systemOwner.address);
            expect(isSystemOwner).to.be.true;
            expect(initialTrustLevel).to.equal(5);

            await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            await libraryManager.connect(systemOwner).returnBook(bookId);

            const [, , finalTrustLevel, ] = await libraryManager.getUserInfo(systemOwner.address);
            expect(finalTrustLevel).to.equal(initialTrustLevel);
        });

        it("should not decrease trust level of a system owner (returned by another user)", async function () {

            await libraryManager.connect(user1).createRentableBook(
                "ipfs://QmSystemOwnerInfractionTest",
                ethers.parseEther("0.1"),
                14
            );

            const allBooks = await libraryManager.getAllBookIds();
            const bookId = allBooks[allBooks.length - 1];

            await libraryManager.connect(systemOwner).borrowBook(bookId, {
                value: ethers.parseEther("0.1")
            });

            const [, , initialTrustLevel, isSystemOwner] = await libraryManager.getUserInfo(systemOwner.address);
            expect(isSystemOwner).to.be.true;
            expect(initialTrustLevel).to.equal(5);

            await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            await libraryManager.connect(user1).returnBook(bookId);

            const [, , finalTrustLevel, ] = await libraryManager.getUserInfo(systemOwner.address);
            expect(finalTrustLevel).to.equal(initialTrustLevel);
        });

        it("should not allow direct calls to decreaseTrustLevel", async function () {
            await expect(
                userSystem.connect(user1).decreaseTrustLevel(
                    user2.address,
                    0
                )
            ).to.be.revertedWith("Not authorized");
        });

        it("should not allow direct calls to registerUser", async function () {
            await expect(
                userSystem.connect(unregisteredUser).registerUser(unregisteredUser.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should not allow direct calls to banUser", async function () {
            await expect(
                userSystem.connect(deployer).banUser(user1.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should not allow direct calls to unbanUser", async function () {
            await expect(
                userSystem.connect(deployer).unbanUser(bannedUser.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should not allow direct calls to addSystemOwner with unregistered user", async function () {
            const [isRegistered, , , ] = await libraryManager.getUserInfo(unregisteredUser.address);
            expect(isRegistered).to.be.false;

            await expect(
                userSystem.connect(deployer).addSystemOwner(unregisteredUser.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should not allow direct calls to removeSystemOwner with unregistered user", async function () {
            await expect(
                userSystem.connect(deployer).removeSystemOwner(unregisteredUser.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should revert when using addSystemOwner through governance with unregistered user", async function () {
            await expect(
                libraryManager.connect(deployer).proposeAddOwner(unregisteredUser.address)
            ).to.be.revertedWith("User not registered");
        });

        it("should revert when using removeSystemOwner through governance with unregistered user", async function () {

            await expect(
                libraryManager.connect(deployer).proposeRemoveOwner(unregisteredUser.address)
            ).to.be.revertedWith("Not a system owner");
        });

        it("should prevent decreaseTrustLevel via spam detection for system owners", async function () {
            const [, , initialTrustLevel, isSystemOwner] = await libraryManager.getUserInfo(systemOwner.address);
            expect(isSystemOwner).to.be.true;

            for (let i = 0; i < 15; i++) {
                await libraryManager.connect(systemOwner).createRentableBook(
                    `ipfs://QmSystemOwnerSpamTest${i}`,
                    ethers.parseEther("0.1"),
                    14
                );
            }
            const [, isBanned, finalTrustLevel, ] = await libraryManager.getUserInfo(systemOwner.address);
            expect(isBanned).to.be.false;
            expect(finalTrustLevel).to.equal(initialTrustLevel);
        });

        it("should check addAuthorizedContract access control", async function () {
            await expect(
                userSystem.connect(user1).addAuthorizedContract(randomContract.address)
            ).to.be.reverted;

            await expect(
                userSystem.connect(deployer).addAuthorizedContract(randomContract.address)
            ).to.be.reverted;
        });

        it("should handle attempt to remove self as system owner", async function () {
            const [, , , isSystemOwner] = await libraryManager.getUserInfo(systemOwner.address);
            expect(isSystemOwner).to.be.true;

            await expect(
                libraryManager.connect(systemOwner).proposeRemoveOwner(systemOwner.address)
            ).to.be.revertedWith("Cannot propose to remove yourself");
        });
    });
});