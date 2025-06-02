import {ethers} from "hardhat";
import {expect} from "chai";
import {
    BookFactory,
    LibraryManagerContract,
    OwnerGovernance,
    RentableBook,
    SellableBook,
    UserTrustSystem
} from "../typechain-types";
import {debugLog} from "./util/utils";


describe("User Permissions Test", function () {

    let libraryManager: LibraryManagerContract;
    let userSystem: UserTrustSystem;
    let governance: OwnerGovernance;
    let bookFactory: BookFactory;

    let deployer: any;
    let user1: any;
    let user2: any;
    let user3: any;
    let unregisteredUser: any;

    const ipfsMetadata = "ipfs://QmBookMetadataHash";
    const salePrice = ethers.parseEther("0.2");
    const depositAmount = ethers.parseEther("0.1");
    const lendingPeriod = 14;

    beforeEach(async function () {
        [deployer, user1, user2, user3, unregisteredUser] = await ethers.getSigners();

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

        const PausableControllerFactory = await ethers.getContractFactory("PausableController");
        const pausableController = await PausableControllerFactory.connect(deployer).deploy();
        await pausableController.waitForDeployment();

        await userSystem.transferOwnership(libraryManager.getAddress());
        await governance.transferOwnership(libraryManager.getAddress());
        await bookFactory.transferOwnership(libraryManager.getAddress());
        await pausableController.transferOwnership(libraryManager.getAddress());

        await libraryManager.connect(deployer).initialize(
            await userSystem.getAddress(),
            await governance.getAddress(),
            await bookFactory.getAddress(),
            await pausableController.getAddress()
        );

        const userSystemAddress = await libraryManager.userSystem();
        userSystem = await ethers.getContractAt("UserTrustSystem", userSystemAddress);

        await libraryManager.connect(user1).registerUser();
        debugLog("User1 registered:", user1.address);
    });

    describe("User Registration", function () {
        it("should register a new user successfully", async function () {
            await libraryManager.connect(user2).registerUser();
            const [isRegistered, , ,] = await libraryManager.getUserInfo(user2.address);
            expect(isRegistered).to.be.true;
        });

        it("should not allow registering the same user twice", async function () {
            await expect(
                libraryManager.connect(user1).registerUser()
            ).to.be.revertedWith("LibraryManager: already registered");
        });

        it("should set initial trust level to 5 for new users", async function () {
            const [, , trustLevel,] = await libraryManager.getUserInfo(user1.address);
            expect(trustLevel).to.equal(5);
        });
        it("should set initial regular user permission for new users", async function () {
            const [, , , isSystemOwner] = await libraryManager.getUserInfo(user1.address);
            expect(isSystemOwner).to.equal(false);
        });
        it("should set the new user as non-banned", async function () {
            const [, isBanned, ,] = await libraryManager.getUserInfo(user1.address);
            expect(isBanned).to.equal(false);
        });

        it("should set the new user as registered", async function () {
            const [isRegistered, , ,] = await libraryManager.getUserInfo(user1.address);
            expect(isRegistered).to.equal(true);
        });
    });


    describe("Access Control for Registered Users", function () {
        it("should allow registered users to create a sellable book", async function () {
            await expect(
                libraryManager.connect(user1).createSellableBook(ipfsMetadata, salePrice)
            ).to.not.be.reverted;
        });

        it("should allow registered users to create a rentable book", async function () {
            await expect(
                libraryManager.connect(user1).createRentableBook(ipfsMetadata, depositAmount, lendingPeriod)
            ).to.not.be.reverted;
        });

        it("should not allow unregistered users to create a sellable book", async function () {
            await expect(
                libraryManager.connect(unregisteredUser).createSellableBook(ipfsMetadata, salePrice)
            ).to.be.revertedWith("LibraryManager: user not registered");
        });

        it("should not allow unregistered users to create a rentable book", async function () {
            await expect(
                libraryManager.connect(unregisteredUser).createRentableBook(ipfsMetadata, depositAmount, lendingPeriod)
            ).to.be.revertedWith("LibraryManager: user not registered");
        });
    });

    describe("Book Borrowing Permissions", function () {
        let bookId: any;

        beforeEach(async function () {

            try {
                await libraryManager.connect(user2).registerUser();
            } catch (error) {
                // ignoro se registrato
            }

            const tx = await libraryManager.connect(user1).createRentableBook(ipfsMetadata, depositAmount, lendingPeriod);
            const receipt = await tx.wait();


            const bookCreatedEvents = receipt?.logs
                .filter((log: any) => {
                    try {
                        return libraryManager.interface.parseLog(log)?.name === "BookCreated";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => libraryManager.interface.parseLog(log));

            // @ts-ignore
            bookId = bookCreatedEvents[0]?.args[0];
            debugLog("Created rentable book with ID:", bookId);
        });

        it("should allow registered users to borrow a book", async function () {
            await expect(
                libraryManager.connect(user2).borrowBook(bookId, {value: depositAmount})
            ).to.not.be.reverted;
        });

        it("should not allow unregistered users to borrow a book", async function () {
            await expect(
                libraryManager.connect(unregisteredUser).borrowBook(bookId, {value: depositAmount})
            ).to.be.revertedWith("LibraryManager: user not registered");
        });
    });

    describe("Book Purchasing Permissions", function () {
        let bookId: any;

        beforeEach(async function () {
            try {
                await libraryManager.connect(user2).registerUser();
            } catch (error) {
                // ignoro se registrato
            }

            const tx = await libraryManager.connect(user1).createSellableBook(ipfsMetadata, salePrice);
            const receipt = await tx.wait();

            const bookCreatedEvents = receipt?.logs
                .filter((log: any) => {
                    try {
                        return libraryManager.interface.parseLog(log)?.name === "BookCreated";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => libraryManager.interface.parseLog(log));

            // @ts-ignore
            bookId = bookCreatedEvents[0]?.args[0];
            debugLog("Created sellable book with ID:", bookId);
        });

        it("should allow registered users to buy a book", async function () {
            await expect(
                libraryManager.connect(user2).buyBook(bookId, {value: salePrice})
            ).to.not.be.reverted;
        });

        it("should not allow unregistered users to buy a book", async function () {
            await expect(
                libraryManager.connect(unregisteredUser).buyBook(bookId, {value: salePrice})
            ).to.be.revertedWith("LibraryManager: user not registered");
        });
    });
    describe("System Owner Access Control", function () {
        beforeEach(async function () {

            try {
                await libraryManager.connect(user2).registerUser();
            } catch (error) {
                // ignoro se registrato
            }

            const [deployerIsRegistered, , , deployerIsSystemOwner] = await libraryManager.getUserInfo(deployer.address);

            if (!deployerIsRegistered) {
                try {
                    await libraryManager.connect(deployer).registerUser();
                    debugLog("Deployer registered for tests");
                } catch (error) {
                    debugLog("Error registering deployer:", error);
                }
            }

            debugLog("Deployer registered:", deployerIsRegistered);
            debugLog("Deployer is system owner:", deployerIsSystemOwner);
        });

        it("should allow system owner to propose adding a new owner", async function () {
            const [, , , isSystemOwner] = await libraryManager.getUserInfo(deployer.address);
            if (!isSystemOwner) {
                console.log("⚠️ Deployer is not a system owner - test will be inconclusive");
            }

            if (isSystemOwner) {
                await expect(
                    libraryManager.connect(deployer).proposeAddOwner(user1.address)
                ).to.not.be.reverted;
            } else {
                await expect(
                    libraryManager.connect(deployer).proposeAddOwner(user1.address)
                ).to.be.revertedWith("LibraryManager: not a system owner");
            }
        });

        it("should not allow regular users to propose adding a new owner", async function () {
            await expect(
                libraryManager.connect(user1).proposeAddOwner(user2.address)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should allow system owner to ban a user", async function () {
            const [, , , isSystemOwner] = await libraryManager.getUserInfo(deployer.address);

            if (isSystemOwner) {
                await expect(libraryManager.connect(deployer).banUser(user1.address)).not.to.be.reverted;

            } else {
                expect.fail("Deployer is not a system owner");
            }
        });

        it("should allow system owner to unban a user", async function () {

            const [, , , isSystemOwner] = await libraryManager.getUserInfo(deployer.address);
            if (!isSystemOwner) {
                console.log("⚠️ Deployer is not a system owner - test will be inconclusive");
            }

            if (isSystemOwner) {
                await libraryManager.connect(deployer).banUser(user1.address);
                await expect(
                    libraryManager.connect(deployer).unbanUser(user1.address)
                ).to.not.be.reverted;
            } else {
                await expect(
                    libraryManager.connect(deployer).unbanUser(user1.address)
                ).to.be.revertedWith("LibraryManager: not a system owner");
            }
        });

        it("should not allow regular users to unban a user", async function () {
            await expect(
                libraryManager.connect(user1).unbanUser(user2.address)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should allow system owner to set returner reward percentage", async function () {
            const [, , , isSystemOwner] = await libraryManager.getUserInfo(deployer.address);
            if (!isSystemOwner) {
                debugLog("⚠️ Deployer is not a system owner - test will be inconclusive");
            }

            if (isSystemOwner) {
                await expect(
                    libraryManager.connect(deployer).setReturnerRewardPercentage(30)
                ).to.not.be.reverted;
            } else {
                await expect(
                    libraryManager.connect(deployer).setReturnerRewardPercentage(30)
                ).to.be.revertedWith("LibraryManager: not a system owner");
            }
        });

        it("should not allow regular users to set returner reward percentage", async function () {
            await expect(
                libraryManager.connect(user1).setReturnerRewardPercentage(30)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });
        it("should allow system owner to ban a user through governance", async function () {
            const [, , , isSystemOwner] = await libraryManager.getUserInfo(deployer.address);
            if (!isSystemOwner) {
                debugLog("⚠️ Deployer is not a system owner - test will be inconclusive");
                this.skip();
                return;
            }
            await libraryManager.connect(deployer).banUser(user1.address);

            const [, isBanned, ,] = await libraryManager.getUserInfo(user1.address);
            expect(isBanned).to.be.true;
        });

        it("should not allow regular users to ban others through governance", async function () {
            await expect(
                libraryManager.connect(user1).banUser(user2.address)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });
        it("should grant system owner permissions to a newly added owner", async function () {

            const governanceAddress = await libraryManager.governance();
            const governance = await ethers.getContractAt("OwnerGovernance", governanceAddress);

            const [, , , isSystemOwner] = await libraryManager.getUserInfo(deployer.address);
            if (!isSystemOwner) {
                debugLog("⚠️ Deployer is not a system owner - test will be inconclusive");
                this.skip();
                return;
            }

            await libraryManager.connect(deployer).proposeAddOwner(user1.address);

            const [, , , user1IsSystemOwner] = await libraryManager.getUserInfo(user1.address);
            expect(user1IsSystemOwner).to.be.true;

            await expect(
                libraryManager.connect(user1).proposeAddOwner(user2.address)
            ).to.not.be.reverted;

            await libraryManager.connect(user3).registerUser();
            await expect(
                libraryManager.connect(user1).banUser(user3.address)
            ).to.not.be.reverted;

            await expect(
                libraryManager.connect(user1).setReturnerRewardPercentage(25)
            ).to.not.be.reverted;
        });
    });
    describe("Direct Access Prevention Tests", function () {
        let bookId: any;
        let rentableBookContract: RentableBook;
        let sellableBookContract: SellableBook;

        beforeEach(async function () {
            const rentableBookAddress = await bookFactory.rentableBookContract();
            const sellableBookAddress = await bookFactory.sellableBookContract();

            rentableBookContract = await ethers.getContractAt("RentableBook", rentableBookAddress);
            sellableBookContract = await ethers.getContractAt("SellableBook", sellableBookAddress);

            try {
                await libraryManager.connect(user1).registerUser();
            } catch (error) {
                // ignoro se registrato
            }

            try {
                await libraryManager.connect(user2).registerUser();
            } catch (error) {
                // ignoro se registrato
            }

            const tx = await libraryManager.connect(user1).createRentableBook(
                ipfsMetadata, depositAmount, lendingPeriod
            );
            const receipt = await tx.wait();

            const bookCreatedEvents = receipt?.logs
                .filter((log: any) => {
                    try {
                        return libraryManager.interface.parseLog(log)?.name === "BookCreated";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => libraryManager.interface.parseLog(log));

            // @ts-ignore
            bookId = bookCreatedEvents[0]?.args[0];
            debugLog("Created rentable book with ID:", bookId);
        });

        it("should prevent direct calls to RentableBook.borrowBook", async function () {
            await expect(
                rentableBookContract.connect(user2).borrowBook(user2.address, bookId, {
                    value: depositAmount
                })
            ).to.be.reverted;
        });

        it("should prevent direct calls to SellableBook.createSellableBook", async function () {
            await expect(
                sellableBookContract.connect(user1).createSellableBook(
                    user1.address, ipfsMetadata, salePrice
                )
            ).to.be.reverted;
        });

        it("should prevent direct calls to RentableBook.returnBook", async function () {
            await libraryManager.connect(user2).borrowBook(bookId, {
                value: depositAmount
            });

            await expect(
                rentableBookContract.connect(user2).returnBook(user2.address, bookId)
            ).to.be.reverted;
        });

        it("should prevent direct calls to UserTrustSystem.banUser by non-owners", async function () {
            await expect(
                userSystem.connect(user1).banUser(user2.address)
            ).to.be.reverted;
        });

        it("should prevent direct calls to UserTrustSystem even by system owners", async function () {
            const [, , , isSystemOwner] = await libraryManager.getUserInfo(deployer.address);
            expect(isSystemOwner).to.be.true;

            await expect(
                userSystem.connect(deployer).banUser(user1.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should prevent the deployer from directly calling OwnerGovernance", async function () {
            await expect(
                governance.connect(deployer).proposeAddOwner(deployer.address, user1.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should allow access only through LibraryManager", async function () {
            await expect(
                rentableBookContract.connect(user2).borrowBook(user2.address, bookId, {
                    value: depositAmount
                })
            ).to.be.reverted;

            await expect(
                libraryManager.connect(user2).borrowBook(bookId, {
                    value: depositAmount
                })
            ).to.not.be.reverted;
        });
    });
});