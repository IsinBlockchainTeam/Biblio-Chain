import { ethers } from "hardhat";
import { expect } from "chai";
import {
    BookFactory,
    LibraryManagerContract,
    OwnerGovernance,
    RentableBook,
    UserTrustSystem
} from "../typechain-types";
import { debugLog } from "./util/utils";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("RentableBook Contract Tests", function () {

    let libraryManager: LibraryManagerContract;
    let userSystem: UserTrustSystem;
    let governance: OwnerGovernance;
    let bookFactory: BookFactory;
    let rentableBook: RentableBook;

    let deployer: any;
    let bookOwner: any;
    let borrower: any;
    let thirdParty: any;
    let unregisteredUser: any;

    const ipfsMetadata = "ipfs://QmRentableBookMetadataHash";
    const depositAmount = ethers.parseEther("0.1");
    const lendingPeriod = 14;
    let bookId: bigint;

    async function createRentableBook() {
        const tx = await libraryManager.connect(bookOwner).createRentableBook(
            ipfsMetadata,
            depositAmount,
            lendingPeriod
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
        return bookCreatedEvents[0]?.args[0];
    }

    async function borrowTestBook() {
        await libraryManager.connect(borrower).borrowBook(bookId, {
            value: depositAmount
        });
    }

    beforeEach(async function () {

        [deployer, bookOwner, borrower, thirdParty, unregisteredUser] = await ethers.getSigners();

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
        rentableBook = await ethers.getContractAt("RentableBook", rentableBookAddress);

        await libraryManager.connect(bookOwner).registerUser();
        await libraryManager.connect(borrower).registerUser();
        await libraryManager.connect(thirdParty).registerUser();

        bookId = await createRentableBook();
        debugLog("Created rentable book with ID:", bookId);
    });

    describe("Book Creation", function () {
        it("should create a rentable book with correct properties", async function () {

            const [baseData, rentalData] = await rentableBook.getFullBookData(bookId);

            expect(baseData.ipfsMetadata).to.equal(ipfsMetadata);

            expect(rentalData.borrower).to.equal(ethers.ZeroAddress);
            expect(rentalData.startDate).to.equal(0n);
            expect(rentalData.depositAmount).to.equal(depositAmount);
            expect(rentalData.lendingPeriod).to.equal(BigInt(lendingPeriod));
        });

        it("should not allow creation with invalid lending period", async function () {
            const invalidPeriod = 0;

            await expect(
                rentableBook.connect(deployer).createRentableBook(
                    bookOwner.address,
                    ipfsMetadata,
                    depositAmount,
                    invalidPeriod
                )
            ).to.be.reverted;

            await expect(
                libraryManager.connect(bookOwner).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    invalidPeriod
                )
            ).to.be.reverted;
        });

        it("should emit RentableBookCreated event", async function () {

            await expect(
                libraryManager.connect(bookOwner).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.emit(rentableBook, "RentableBookCreated");
        });
    });

    describe("Book Borrowing", function () {
        it("should allow a user to borrow a book", async function () {
            await borrowTestBook();

            const [, rentalData] = await rentableBook.getFullBookData(bookId);

            expect(rentalData.borrower).to.equal(borrower.address);
            expect(rentalData.startDate).to.be.gt(0n);
        });

        it("should not allow borrowing without sufficient deposit", async function () {
            const insufficientDeposit = depositAmount / 2n;

            await expect(
                libraryManager.connect(borrower).borrowBook(bookId, {
                    value: insufficientDeposit
                })
            ).to.be.revertedWith("RentableBook: insufficient deposit");
        });

        it("should not allow borrowing an already borrowed book", async function () {

            await borrowTestBook();

            await expect(
                libraryManager.connect(thirdParty).borrowBook(bookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("RentableBook: book is already borrowed");
        });

        it("should not allow book owner to borrow their own book", async function () {
            await expect(
                libraryManager.connect(bookOwner).borrowBook(bookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("RentableBook: owner cannot borrow their own book");
        });

        it("should refund excess deposit amount", async function () {
            const excessAmount = depositAmount * 2n;
            const borrowerBalanceBefore = await ethers.provider.getBalance(borrower.address);

            const tx = await libraryManager.connect(borrower).borrowBook(bookId, {
                value: excessAmount
            });
            const receipt = await tx.wait();
            // @ts-ignore
            const gasCost = receipt?.gasUsed * receipt?.gasPrice;

            const borrowerBalanceAfter = await ethers.provider.getBalance(borrower.address);
            const expectedBalance = borrowerBalanceBefore - depositAmount - gasCost;

            expect(borrowerBalanceAfter).to.be.closeTo(expectedBalance, 1000000000n);
        });

    });

    describe("Book Return", function () {
        beforeEach(async function () {
            await borrowTestBook();
        });

        it("should allow borrower to return the book", async function () {

            const borrowerBalanceBefore = await ethers.provider.getBalance(borrower.address);

            const tx = await libraryManager.connect(borrower).returnBook(bookId);
            const receipt = await tx.wait();
            // @ts-ignore
            const gasCost = receipt?.gasUsed * receipt?.gasPrice;

            const [, rentalData] = await rentableBook.getFullBookData(bookId);

            expect(rentalData.borrower).to.equal(ethers.ZeroAddress);
            expect(rentalData.startDate).to.equal(0n);

            const borrowerBalanceAfter = await ethers.provider.getBalance(borrower.address);
            const expectedBalance = borrowerBalanceBefore + depositAmount - gasCost;
            expect(borrowerBalanceAfter).to.be.closeTo(expectedBalance, 1000000000n);
        });

        it("should not allow non-borrower to return the book within lending period", async function () {
            await expect(
                libraryManager.connect(thirdParty).returnBook(bookId)
            ).to.be.revertedWith("LibraryManager: only borrower can return this book");
        });

        it("should emit BookReturned event", async function () {
            await expect(
                libraryManager.connect(borrower).returnBook(bookId)
            ).to.emit(rentableBook, "BookReturned")
                .withArgs(bookId, borrower.address);
        });
    });

    describe("Overdue Book Return", function () {
        beforeEach(async function () {

            await borrowTestBook();
            await time.increase(lendingPeriod * 24 * 60 * 60 + 1);
        });

        it("should allow third party to return an overdue book", async function () {
            const thirdPartyBalanceBefore = await ethers.provider.getBalance(thirdParty.address);
            const bookOwnerBalanceBefore = await ethers.provider.getBalance(bookOwner.address);

            const tx = await libraryManager.connect(thirdParty).returnBook(bookId);
            const receipt = await tx.wait();

            // @ts-ignore
            const gasCost = receipt?.gasUsed * receipt?.gasPrice;
            const [, rentalData] = await rentableBook.getFullBookData(bookId);

            expect(rentalData.borrower).to.equal(ethers.ZeroAddress);
            expect(rentalData.startDate).to.equal(0n);

            const rewardPercentage = await rentableBook.returnerRewardPercentage();
            const rewardAmount = (depositAmount * rewardPercentage) / 100n;
            const ownerAmount = depositAmount - rewardAmount;

            const thirdPartyBalanceAfter = await ethers.provider.getBalance(thirdParty.address);
            expect(thirdPartyBalanceAfter).to.be.closeTo(
                thirdPartyBalanceBefore + rewardAmount - gasCost,
                1000000000n
            );

            const bookOwnerBalanceAfter = await ethers.provider.getBalance(bookOwner.address);
            expect(bookOwnerBalanceAfter).to.be.closeTo(
                bookOwnerBalanceBefore + ownerAmount,
                1000000000n
            );
        });

        it("should decrease borrower's trust level when book is returned overdue", async function () {

            const [, , trustLevelBefore, ] = await libraryManager.getUserInfo(borrower.address);
            await libraryManager.connect(borrower).returnBook(bookId);
            const [, , trustLevelAfter, ] = await libraryManager.getUserInfo(borrower.address);

            expect(trustLevelAfter).to.be.lessThan(trustLevelBefore);
        });

        it("should emit BookReturnedByThirdParty event with correct reward", async function () {

            const rewardPercentage = await rentableBook.returnerRewardPercentage();
            const rewardAmount = (depositAmount * rewardPercentage) / 100n;


            await expect(libraryManager.connect(thirdParty).returnBook(bookId))
                .to.emit(rentableBook, "BookReturnedByThirdParty")
                .withArgs(bookId, thirdParty.address, borrower.address, rewardAmount);
        });
    });

    describe("Reward Percentage Configuration", function () {
        it("should allow system owner to change reward percentage", async function () {
            const newPercentage = 30n;
            await libraryManager.connect(deployer).setReturnerRewardPercentage(Number(newPercentage));
            expect(await rentableBook.returnerRewardPercentage()).to.equal(newPercentage);
        });

        it("should not allow non-system owners to change reward percentage", async function () {
            await expect(
                libraryManager.connect(bookOwner).setReturnerRewardPercentage(30)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should not allow setting reward percentage above 100", async function () {
            await expect(
                libraryManager.connect(deployer).setReturnerRewardPercentage(101)
            ).to.be.revertedWith("RentableBook: percentage must be between 0 and 100");
        });
    });

    describe("Access Control", function () {
        it("should not allow banned users to borrow books", async function () {

            await libraryManager.connect(deployer).banUser(borrower.address);

            await expect(
                libraryManager.connect(borrower).borrowBook(bookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("LibraryManager: user is banned");
        });

        it("should not allow direct access to rentableBook contract methods", async function () {

            await expect(
                rentableBook.connect(borrower).borrowBook(
                    borrower.address,
                    bookId,
                    { value: depositAmount }
                )
            ).to.be.revertedWith("Not authorized");

            await expect(
                rentableBook.connect(borrower).returnBook(
                    borrower.address,
                    bookId
                )
            ).to.be.revertedWith("Not authorized");

            await expect(
                rentableBook.connect(deployer).setReturnerRewardPercentage(
                    30
                )
            ).to.be.revertedWith("Not authorized");
        });
    });

    describe("Book Data Retrieval", function () {
        it("should retrieve complete book data", async function () {

            const [baseData, rentalData] = await rentableBook.getFullBookData(bookId);

            expect(baseData.ipfsMetadata).to.equal(ipfsMetadata);
            expect(rentalData.depositAmount).to.equal(depositAmount);
            expect(rentalData.lendingPeriod).to.equal(BigInt(lendingPeriod));
        });

        it("should retrieve borrowed book data correctly", async function () {

            await borrowTestBook();
            const [, rentalData] = await rentableBook.getFullBookData(bookId);

            expect(rentalData.borrower).to.equal(borrower.address);
            expect(rentalData.startDate).to.be.gt(0n);
        });
    });

    describe("Edge Cases", function () {
        it("should handle borrowing with exact deposit amount", async function () {
            await libraryManager.connect(borrower).borrowBook(bookId, {
                value: depositAmount
            });

            const [, rentalData] = await rentableBook.getFullBookData(bookId);
            expect(rentalData.borrower).to.equal(borrower.address);
        });

        it("should allow borrowing after a book is returned", async function () {
            await borrowTestBook();

            await libraryManager.connect(borrower).returnBook(bookId);

            await libraryManager.connect(thirdParty).borrowBook(bookId, {
                value: depositAmount
            });

            const [, rentalData] = await rentableBook.getFullBookData(bookId);

            expect(rentalData.borrower).to.equal(thirdParty.address);
        });

        it("should not allow borrowing an already borrowed book (even if overdue)", async function () {
            await borrowTestBook();

            await time.increase(lendingPeriod * 24 * 60 * 60 + 1);

            await expect(
                libraryManager.connect(thirdParty).borrowBook(bookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("RentableBook: book is already borrowed");
        });

        it("should not allow banned users to borrow books", async function () {

            await libraryManager.connect(deployer).banUser(borrower.address);

            const [, isBanned, ,] = await libraryManager.getUserInfo(borrower.address);
            expect(isBanned).to.be.true;
            await expect(
                libraryManager.connect(borrower).borrowBook(bookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("LibraryManager: user is banned");
        });

        it("should not allow non-borrowers to return the book", async function () {

            await libraryManager.connect(borrower).borrowBook(bookId, {
                value: depositAmount
            });

            await expect(
                libraryManager.connect(thirdParty).returnBook(bookId)
            ).to.be.revertedWith("LibraryManager: only borrower can return this book");
        });

        it("should handle books with zero deposit amount", async function () {

            const zeroDeposit = ethers.parseEther("0");
            const tx = await libraryManager.connect(bookOwner).createRentableBook(
                ipfsMetadata,
                zeroDeposit,
                lendingPeriod
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
            const zeroDepositBookId = bookCreatedEvents[0]?.args[0];

            const [, rentalData] = await rentableBook.getFullBookData(zeroDepositBookId);
            expect(rentalData.depositAmount).to.equal(zeroDeposit);

            await libraryManager.connect(borrower).borrowBook(zeroDepositBookId, {
                value: zeroDeposit
            });

            const [, rentalDataAfterBorrow] = await rentableBook.getFullBookData(zeroDepositBookId);
            expect(rentalDataAfterBorrow.borrower).to.equal(borrower.address);

            await libraryManager.connect(borrower).returnBook(zeroDepositBookId);

            const [, rentalDataAfterReturn] = await rentableBook.getFullBookData(zeroDepositBookId);
            expect(rentalDataAfterReturn.borrower).to.equal(ethers.ZeroAddress);
        });

        it("should not allow borrowing a sellable book", async function () {

            const tx = await libraryManager.connect(bookOwner).createSellableBook(
                ipfsMetadata,
                ethers.parseEther("0.1")
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
            const sellableBookId = bookCreatedEvents[0]?.args[0];


            await expect(
                libraryManager.connect(borrower).borrowBook(sellableBookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("LibraryManager: book is not rentable");
        });

        it("should not allow borrowing a non-existent book", async function () {

            const nonExistentBookId = ethers.MaxUint256;

            await expect(
                libraryManager.connect(borrower).borrowBook(nonExistentBookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("LibraryManager: book does not exist");
        });

        it("should not allow banned users to create a rentable book", async function () {

            await libraryManager.connect(deployer).banUser(bookOwner.address);

            const [, isBanned, ,] = await libraryManager.getUserInfo(bookOwner.address);
            expect(isBanned).to.be.true;

            await expect(
                libraryManager.connect(bookOwner).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.be.revertedWith("LibraryManager: user is banned");
        });


        it("should not allow unregistered users to return a book", async function () {

            await libraryManager.connect(borrower).borrowBook(bookId, {
                value: depositAmount
            });

            await expect(
                libraryManager.connect(unregisteredUser).returnBook(bookId)
            ).to.be.revertedWith("LibraryManager: user not registered");
        });

        it("should not allow returning a non-existent book", async function () {

            const nonExistentBookId = ethers.MaxUint256;

            await expect(
                libraryManager.connect(borrower).returnBook(nonExistentBookId)
            ).to.be.revertedWith("LibraryManager: book does not exist");
        });

        it("should not allow returning a sellable book", async function () {

            const tx = await libraryManager.connect(bookOwner).createSellableBook(
                ipfsMetadata,
                ethers.parseEther("0.1")
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
            const sellableBookId = bookCreatedEvents[0]?.args[0];

            await expect(
                libraryManager.connect(borrower).returnBook(sellableBookId)
            ).to.be.revertedWith("LibraryManager: book is not rentable");
        });

        it("should handle overdue return of a book with zero deposit", async function () {

            const zeroDeposit = ethers.parseEther("0");
            const tx = await libraryManager.connect(bookOwner).createRentableBook(
                ipfsMetadata,
                zeroDeposit,
                lendingPeriod
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
            const zeroDepositBookId = bookCreatedEvents[0]?.args[0];

            await libraryManager.connect(borrower).borrowBook(zeroDepositBookId, {
                value: zeroDeposit
            });

            await time.increase(lendingPeriod * 24 * 60 * 60 + 1);

            const [, rentalData] = await rentableBook.getFullBookData(zeroDepositBookId);
            expect(rentalData.borrower).to.equal(borrower.address);
            await libraryManager.connect(thirdParty).returnBook(zeroDepositBookId);

            const [, rentalDataAfterReturn] = await rentableBook.getFullBookData(zeroDepositBookId);
            expect(rentalDataAfterReturn.borrower).to.equal(ethers.ZeroAddress);
        });

        it("should not allow returning a book that is not borrowed", async function () {
            const [, rentalData] = await rentableBook.getFullBookData(bookId);
            expect(rentalData.borrower).to.equal(ethers.ZeroAddress);

            await expect(
                libraryManager.connect(thirdParty).returnBook(bookId)
            ).to.be.revertedWith("RentableBook: book is not borrowed");
        });

        it("should not allow third-party return of a book that is not overdue", async function () {
            await libraryManager.connect(borrower).borrowBook(bookId, {
                value: depositAmount
            });

            await expect(
                libraryManager.connect(thirdParty).returnBook(bookId)
            ).to.be.revertedWith("LibraryManager: only borrower can return this book");
        });

        it("should not allow direct calls to returnOverdueBook", async function () {
            await libraryManager.connect(borrower).borrowBook(bookId, {
                value: depositAmount
            });

            await time.increase(lendingPeriod * 24 * 60 * 60 + 1);

            await expect(
                rentableBook.connect(thirdParty).returnOverdueBook(thirdParty.address, bookId)
            ).to.be.revertedWith("Not authorized");
        });

    });
});