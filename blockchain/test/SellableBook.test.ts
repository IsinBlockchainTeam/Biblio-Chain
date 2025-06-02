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


describe("SellableBook Contract Tests", function () {
    let libraryManager: LibraryManagerContract;
    let userSystem: UserTrustSystem;
    let governance: OwnerGovernance;
    let bookFactory: BookFactory;
    let sellableBook: SellableBook;

    let deployer: any;
    let bookOwner: any;
    let buyer: any;
    let thirdParty: any;
    let unregisteredUser: any;

    const ipfsMetadata = "ipfs://QmSellableBookMetadataHash";
    const salePrice = ethers.parseEther("0.2");
    let bookId: bigint;

    async function createSellableBook() {
        const tx = await libraryManager.connect(bookOwner).createSellableBook(
            ipfsMetadata,
            salePrice
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

    beforeEach(async function () {

        [deployer, bookOwner, buyer, thirdParty, unregisteredUser] = await ethers.getSigners();

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

        const sellableBookAddress = await bookFactory.sellableBookContract();
        sellableBook = await ethers.getContractAt("SellableBook", sellableBookAddress);

        await libraryManager.connect(bookOwner).registerUser();
        await libraryManager.connect(buyer).registerUser();
        await libraryManager.connect(thirdParty).registerUser();

        bookId = await createSellableBook();
        debugLog("Created sellable book with ID:", bookId);
    });

    describe("Book Creation", function () {
        it("should create a sellable book with correct properties", async function () {
            const [baseData, saleData] = await sellableBook.getFullBookData(bookId);

            expect(baseData.ipfsMetadata).to.equal(ipfsMetadata);

            expect(saleData.price).to.equal(salePrice);
            expect(saleData.isForSale).to.be.true;
        });

        it("should not allow creation with zero price", async function () {
            const zeroPrice = ethers.parseEther("0");

            await expect(
                sellableBook.connect(deployer).createSellableBook(
                    bookOwner.address,
                    ipfsMetadata,
                    zeroPrice
                )
            ).to.be.reverted;

            await expect(
                libraryManager.connect(bookOwner).createSellableBook(
                    ipfsMetadata,
                    zeroPrice
                )
            ).to.be.reverted;
        });

        it("should emit SellableBookCreated event", async function () {
            await expect(
                libraryManager.connect(bookOwner).createSellableBook(
                    ipfsMetadata,
                    salePrice
                )
            ).to.emit(sellableBook, "SellableBookCreated");
        });

        it("should not allow banned users to create a sellable book", async function () {
            await libraryManager.connect(deployer).banUser(bookOwner.address);

            const [, isBanned, ,] = await libraryManager.getUserInfo(bookOwner.address);
            expect(isBanned).to.be.true;

            await expect(
                libraryManager.connect(bookOwner).createSellableBook(
                    ipfsMetadata,
                    salePrice
                )
            ).to.be.revertedWith("LibraryManager: user is banned");
        });

        it("should not allow unregistered users to create a sellable book", async function () {
            await expect(
                libraryManager.connect(unregisteredUser).createSellableBook(
                    ipfsMetadata,
                    salePrice
                )
            ).to.be.revertedWith("LibraryManager: user not registered");
        });
    });

    describe("Book Purchasing", function () {
        it("should allow a user to buy a book", async function () {
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
            const ownerBalanceBefore = await ethers.provider.getBalance(bookOwner.address);

            const tx = await libraryManager.connect(buyer).buyBook(bookId, {
                value: salePrice
            });
            const receipt = await tx.wait();
            // @ts-ignore
            const gasCost = receipt?.gasUsed * receipt?.gasPrice;

            expect(await sellableBook.ownerOf(bookId)).to.equal(buyer.address);
            const [, saleData] = await sellableBook.getFullBookData(bookId);
            expect(saleData.isForSale).to.be.false;

            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
            expect(buyerBalanceAfter).to.be.closeTo(
                buyerBalanceBefore - salePrice - gasCost,
                1000000000n
            );

            const ownerBalanceAfter = await ethers.provider.getBalance(bookOwner.address);
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + salePrice);
        });

        it("should not allow buying without sufficient payment", async function () {
            const insufficientPayment = salePrice / 2n;

            await expect(
                libraryManager.connect(buyer).buyBook(bookId, {
                    value: insufficientPayment
                })
            ).to.be.revertedWith("SellableBook: insufficient payment");
        });

        it("should refund excess payment", async function () {
            const excessPayment = salePrice * 2n;
            const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);


            const tx = await libraryManager.connect(buyer).buyBook(bookId, {
                value: excessPayment
            });
            const receipt = await tx.wait();
            // @ts-ignore
            const gasCost = receipt?.gasUsed * receipt?.gasPrice;
            const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

            const expectedBalance = buyerBalanceBefore - salePrice - gasCost;
            expect(buyerBalanceAfter).to.be.closeTo(expectedBalance, 1000000000n);
        });

        it("should emit BookSold event", async function () {
            await expect(
                libraryManager.connect(buyer).buyBook(bookId, {
                    value: salePrice
                })
            ).to.emit(sellableBook, "BookSold")
                .withArgs(bookId, bookOwner.address, buyer.address, salePrice);
        });

        it("should not allow the owner to buy their own book", async function () {
            await expect(
                libraryManager.connect(bookOwner).buyBook(bookId, {
                    value: salePrice
                })
            ).to.be.revertedWith("SellableBook: owner cannot buy their own book");
        });

        it("should not allow banned users to buy books", async function () {
            await libraryManager.connect(deployer).banUser(buyer.address);

            const [, isBanned, ,] = await libraryManager.getUserInfo(buyer.address);
            expect(isBanned).to.be.true;

            await expect(
                libraryManager.connect(buyer).buyBook(bookId, {
                    value: salePrice
                })
            ).to.be.revertedWith("LibraryManager: user is banned");
        });

        it("should not allow unregistered users to buy books", async function () {
            await expect(
                libraryManager.connect(unregisteredUser).buyBook(bookId, {
                    value: salePrice
                })
            ).to.be.revertedWith("LibraryManager: user not registered");
        });
    });

    describe("Edge Cases", function () {
        it("should not allow buying a book after it has been sold", async function () {
            await libraryManager.connect(buyer).buyBook(bookId, {
                value: salePrice
            });

            await expect(
                libraryManager.connect(thirdParty).buyBook(bookId, {
                    value: salePrice
                })
            ).to.be.revertedWith("SellableBook: book not for sale");
        });

        it("should not allow buying a rentable book", async function () {
            const depositAmount = ethers.parseEther("0.1");
            const lendingPeriod = 14;
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
            const rentableBookId = bookCreatedEvents[0]?.args[0];

            await expect(
                libraryManager.connect(buyer).buyBook(rentableBookId, {
                    value: salePrice
                })
            ).to.be.revertedWith("LibraryManager: book is not for sale");
        });

        it("should not allow buying a non-existent book", async function () {
            const nonExistentBookId = ethers.MaxUint256;

            await expect(
                libraryManager.connect(buyer).buyBook(nonExistentBookId, {
                    value: salePrice
                })
            ).to.be.revertedWith("LibraryManager: book does not exist");
        });
    });

    describe("Access Control", function () {
        it("should not allow direct access to sellableBook contract methods", async function () {
            await expect(
                sellableBook.connect(buyer).buyBook(
                    buyer.address,
                    bookId,
                    { value: salePrice }
                )
            ).to.be.revertedWith("Not authorized");

            await expect(
                sellableBook.connect(bookOwner).createSellableBook(
                    bookOwner.address,
                    ipfsMetadata,
                    salePrice
                )
            ).to.be.reverted;
        });
    });

    describe("Book Data Retrieval", function () {
        it("should retrieve complete book data", async function () {
            const [baseData, saleData] = await sellableBook.getFullBookData(bookId);

            expect(baseData.ipfsMetadata).to.equal(ipfsMetadata);
            expect(saleData.price).to.equal(salePrice);
            expect(saleData.isForSale).to.be.true;
        });

        it("should retrieve correct book data after purchase", async function () {
            await libraryManager.connect(buyer).buyBook(bookId, {
                value: salePrice
            });

            const [baseData, saleData] = await sellableBook.getFullBookData(bookId);

            expect(baseData.ipfsMetadata).to.equal(ipfsMetadata);
            expect(saleData.isForSale).to.be.false;
        });
    });

    describe("Other Cases", function () {
        it("should not allow borrowing a sellable book", async function () {
            const depositAmount = ethers.parseEther("0.1");

            await expect(
                libraryManager.connect(buyer).borrowBook(bookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("LibraryManager: book is not rentable");
        });

        it("should not allow returning a sellable book", async function () {
            await expect(
                libraryManager.connect(buyer).returnBook(bookId)
            ).to.be.revertedWith("LibraryManager: book is not rentable");
        });
    });
});