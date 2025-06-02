import { ethers } from "hardhat";
import { expect } from "chai";
import {
    BookFactory,
    LibraryManagerContract,
    OwnerGovernance,
    RentableBook,
    SellableBook,
    UserTrustSystem
} from "../typechain-types";
import { debugLog } from "./util/utils";

describe("Book Rating Tests", function () {

    let libraryManager: LibraryManagerContract;
    let userSystem: UserTrustSystem;
    let governance: OwnerGovernance;
    let bookFactory: BookFactory;
    let rentableBook: RentableBook;
    let sellableBook: SellableBook;

    let deployer: any;
    let bookOwner: any;
    let user1: any;
    let user2: any;
    let unregistered: any;

    const ipfsMetadata = "ipfs://QmBookMetadataHash";
    const salePrice = ethers.parseEther("0.2");
    const depositAmount = ethers.parseEther("0.1");
    const lendingPeriod = 14;

    let rentableBookId: bigint;
    let sellableBookId: bigint;

    beforeEach(async function () {

        [deployer, bookOwner, user1, user2, unregistered] = await ethers.getSigners();

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

        const rentableBookAddress = await bookFactory.rentableBookContract();
        const sellableBookAddress = await bookFactory.sellableBookContract();

        rentableBook = await ethers.getContractAt("RentableBook", rentableBookAddress);
        sellableBook = await ethers.getContractAt("SellableBook", sellableBookAddress);

        await libraryManager.connect(bookOwner).registerUser();
        await libraryManager.connect(user1).registerUser();
        await libraryManager.connect(user2).registerUser();

        const rentableTx = await libraryManager.connect(bookOwner).createRentableBook(
            ipfsMetadata,
            depositAmount,
            lendingPeriod
        );
        const sellableTx = await libraryManager.connect(bookOwner).createSellableBook(
            ipfsMetadata,
            salePrice
        );

        const rentableReceipt = await rentableTx.wait();
        const sellableReceipt = await sellableTx.wait();

        const rentableBookCreatedEvents = rentableReceipt?.logs
            .filter((log: any) => {
                try {
                    return libraryManager.interface.parseLog(log)?.name === "BookCreated";
                } catch (e) {
                    return false;
                }
            })
            .map((log: any) => libraryManager.interface.parseLog(log));

        const sellableBookCreatedEvents = sellableReceipt?.logs
            .filter((log: any) => {
                try {
                    return libraryManager.interface.parseLog(log)?.name === "BookCreated";
                } catch (e) {
                    return false;
                }
            })
            .map((log: any) => libraryManager.interface.parseLog(log));

        // @ts-ignore
        rentableBookId = rentableBookCreatedEvents[0]?.args[0];
        // @ts-ignore
        sellableBookId = sellableBookCreatedEvents[0]?.args[0];

        debugLog("Created rentable book with ID:", rentableBookId);
        debugLog("Created sellable book with ID:", sellableBookId);
    });

    describe("Rating Rentable Books", function () {
        it("should allow a borrower to rate a rentable book", async function () {
            await libraryManager.connect(user1).borrowBook(rentableBookId, {
                value: depositAmount
            });

            await libraryManager.connect(user1).returnBook(rentableBookId);

            await expect(
                libraryManager.connect(user1).rateRentableBook(rentableBookId, 450)
            ).to.not.be.reverted;

            const [avgRating, count] = await libraryManager.getBookRating(rentableBookId);
            expect(avgRating).to.equal(450);
            expect(count).to.equal(1);
        });
        it("should get 0 with no reviews", async function () {

            const [rating, raters] = await libraryManager.connect(user1).getBookRating(rentableBookId);

            expect(rating).to.equal(0);
            expect(raters).to.equal(0);
        });

        it("should not allow a non-borrower to rate a rentable book", async function () {
            await expect(
                libraryManager.connect(user2).rateRentableBook(rentableBookId, 400)
            ).to.be.revertedWith("RentableBook: only borrowers can rate the book");
        });

        it("should not allow a borrower to rate a book twice", async function () {

            await libraryManager.connect(user1).borrowBook(rentableBookId, {
                value: depositAmount
            });

            await libraryManager.connect(user1).returnBook(rentableBookId);

            await libraryManager.connect(user1).rateRentableBook(rentableBookId, 450);

            await expect(
                libraryManager.connect(user1).rateRentableBook(rentableBookId, 300)
            ).to.be.revertedWith("Book: user has already rated this book");
        });

        it("should calculate correct average rating with multiple reviewers", async function () {
            await libraryManager.connect(user1).borrowBook(rentableBookId, {
                value: depositAmount
            });
            await libraryManager.connect(user1).returnBook(rentableBookId);
            await libraryManager.connect(user1).rateRentableBook(rentableBookId, 400);

            await libraryManager.connect(user2).borrowBook(rentableBookId, {
                value: depositAmount
            });
            await libraryManager.connect(user2).returnBook(rentableBookId);
            await libraryManager.connect(user2).rateRentableBook(rentableBookId, 300);

            const [avgRating, count] = await libraryManager.getBookRating(rentableBookId);
            expect(avgRating).to.equal(350);
            expect(count).to.equal(2);
        });
    });

    describe("Rating Sellable Books", function () {
        it("should allow a buyer to rate a sellable book", async function () {

            await libraryManager.connect(user1).buyBook(sellableBookId, {
                value: salePrice
            });

            await expect(
                libraryManager.connect(user1).rateSellableBook(sellableBookId, 480)
            ).to.not.be.reverted;

            const [avgRating, count] = await libraryManager.getBookRating(sellableBookId);
            expect(avgRating).to.equal(480);
            expect(count).to.equal(1);
        });

        it("should not allow a non-buyer to rate a sellable book", async function () {
            await expect(
                libraryManager.connect(user2).rateSellableBook(sellableBookId, 400)
            ).to.be.revertedWith("SellableBook: only buyers can rate the book");
        });

        it("should not allow a buyer to rate a book twice", async function () {
            await libraryManager.connect(user1).buyBook(sellableBookId, {
                value: salePrice
            });

            await libraryManager.connect(user1).rateSellableBook(sellableBookId, 450);

            await expect(
                libraryManager.connect(user1).rateSellableBook(sellableBookId, 300)
            ).to.be.revertedWith("Book: user has already rated this book");
        });

        it("should handle mixed ratings from borrowers and buyers correctly", async function () {
            const newRentableTx = await libraryManager.connect(bookOwner).createRentableBook(
                "ipfs://QmMixedRatingsTest",
                depositAmount,
                lendingPeriod
            );

            const newSellableTx = await libraryManager.connect(bookOwner).createSellableBook(
                "ipfs://QmMixedRatingsTest",
                salePrice
            );

            const newRentableReceipt = await newRentableTx.wait();
            const newSellableReceipt = await newSellableTx.wait();

            const newRentableBookCreatedEvents = newRentableReceipt?.logs
                .filter((log: any) => {
                    try {
                        return libraryManager.interface.parseLog(log)?.name === "BookCreated";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => libraryManager.interface.parseLog(log));

            const newSellableBookCreatedEvents = newSellableReceipt?.logs
                .filter((log: any) => {
                    try {
                        return libraryManager.interface.parseLog(log)?.name === "BookCreated";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => libraryManager.interface.parseLog(log));

            // @ts-ignore
            const newRentableBookId = newRentableBookCreatedEvents[0]?.args[0];
            // @ts-ignore
            const newSellableBookId = newSellableBookCreatedEvents[0]?.args[0];

            await libraryManager.connect(user1).borrowBook(newRentableBookId, {
                value: depositAmount
            });
            await libraryManager.connect(user1).returnBook(newRentableBookId);
            await libraryManager.connect(user1).rateRentableBook(newRentableBookId, 500);


            await libraryManager.connect(user2).buyBook(newSellableBookId, {
                value: salePrice
            });
            await libraryManager.connect(user2).rateSellableBook(newSellableBookId, 200);


            const [rentableAvgRating, rentableCount] = await libraryManager.getBookRating(newRentableBookId);
            expect(rentableAvgRating).to.equal(500);
            expect(rentableCount).to.equal(1);

            const [sellableAvgRating, sellableCount] = await libraryManager.getBookRating(newSellableBookId);
            expect(sellableAvgRating).to.equal(200);
            expect(sellableCount).to.equal(1);
        });
    });

    describe("Book Rating Utility Functions", function () {
        it("should correctly check if a user has rated a book", async function () {

            await libraryManager.connect(user1).borrowBook(rentableBookId, {
                value: depositAmount
            });
            await libraryManager.connect(user1).returnBook(rentableBookId);
            await libraryManager.connect(user1).rateRentableBook(rentableBookId, 450);

            expect(await libraryManager.hasUserRatedBook(rentableBookId, user1.address)).to.be.true;
            expect(await libraryManager.hasUserRatedBook(rentableBookId, user2.address)).to.be.false;
        });

        it("should enforce valid rating range", async function () {
            await libraryManager.connect(user1).borrowBook(rentableBookId, {
                value: depositAmount
            });
            await libraryManager.connect(user1).returnBook(rentableBookId);

            await expect(
                libraryManager.connect(user1).rateRentableBook(rentableBookId, 501)
            ).to.be.revertedWith("Book: rating must be between 0-500 (0-5 with 2 decimals)");

            await expect(
                libraryManager.connect(user1).rateRentableBook(rentableBookId, 500)
            ).to.not.be.reverted;
        });
        it("should not allow non existing id", async function () {
            await expect(
                libraryManager.connect(user1).hasUserRatedBook(24363, user1.address)
            ).to.be.revertedWith("LibraryManager: book does not exist");

            await expect(
                libraryManager.connect(user1).getBookRating(24363)
            ).to.be.revertedWith("LibraryManager: book does not exist");

            await expect(
                libraryManager.connect(user1).getBookRating(24363)
            ).to.be.revertedWith("LibraryManager: book does not exist");

            await expect(
                libraryManager.connect(user1).rateSellableBook(24363, 5)
            ).to.be.revertedWith("LibraryManager: book does not exist");

            await expect(
                libraryManager.connect(user1).rateRentableBook(24363, 5)
            ).to.be.revertedWith("LibraryManager: book does not exist");
        });

        it("should not allow rating rentable with sellable book", async function () {
            await expect(
                libraryManager.connect(user1).rateRentableBook(sellableBookId, user1.address)
            ).to.be.revertedWith("LibraryManager: book is not rentable");
        });


        it("should not allow rating sellable with rentable book", async function () {
            await expect(
                libraryManager.connect(user1).rateSellableBook(rentableBookId, user1.address)
            ).to.be.revertedWith("LibraryManager: book is not sellable");
        });

        it("should not allow rating sellable to unregistered user", async function () {
            await expect(
                libraryManager.connect(unregistered).rateSellableBook(sellableBookId, unregistered.address)
            ).to.be.revertedWith("LibraryManager: user not registered");
        });

        it("should not allow rating rentable to unregistered user", async function () {
            await expect(
                libraryManager.connect(unregistered).rateRentableBook(rentableBookId, unregistered.address)
            ).to.be.revertedWith("LibraryManager: user not registered");
        });

        it("should not allow rating rentable directly", async function () {
            await expect(
                rentableBook.connect(unregistered).rateBook(unregistered.address, rentableBookId, 5)
            ).to.be.revertedWith("Not authorized");
        });

        it("should not allow rating sellable directly", async function () {
            await expect(
                sellableBook.connect(unregistered).rateBook(unregistered.address, rentableBookId, 5)
            ).to.be.revertedWith("Not authorized");
        });

        it("should not allow rating rentable to banned user", async function () {
            await libraryManager.connect(user1).borrowBook(rentableBookId, {
                value: depositAmount
            });

            await libraryManager.connect(user1).returnBook(rentableBookId);
            await libraryManager.connect(deployer).banUser(user1.address);

            await expect(
                libraryManager.connect(user1).rateRentableBook(rentableBookId, 450)
            ).to.be.revertedWith("LibraryManager: user is banned");
        });

        it("should not allow rating sellable to banned user", async function () {
            await libraryManager.connect(user1).buyBook(sellableBookId, {
                value: salePrice
            });

            await libraryManager.connect(deployer).banUser(user1.address);

            await expect(
                libraryManager.connect(user1).rateSellableBook(sellableBookId, 450)
            ).to.be.revertedWith("LibraryManager: user is banned");
        });
    });
});