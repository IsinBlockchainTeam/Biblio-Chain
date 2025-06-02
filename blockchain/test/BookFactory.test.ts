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

describe("BookFactory Contract Tests", function () {

    let libraryManager: LibraryManagerContract;
    let userSystem: UserTrustSystem;
    let governance: OwnerGovernance;
    let bookFactory: BookFactory;
    let rentableBook: RentableBook;
    let sellableBook: SellableBook;

    let deployer: any;
    let creator: any;
    let user: any;
    let unregisteredUser: any;

    const ipfsMetadata = "ipfs://QmBookMetadataHash";
    const salePrice = ethers.parseEther("0.2");
    const depositAmount = ethers.parseEther("0.1");
    const lendingPeriod = 14;

    let rentableBookId: bigint;
    let sellableBookId: bigint;

    beforeEach(async function () {

        [deployer, creator, user, unregisteredUser] = await ethers.getSigners();

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

        await libraryManager.connect(creator).registerUser();
        await libraryManager.connect(user).registerUser();


        const rentableTx = await libraryManager.connect(creator).createRentableBook(
            ipfsMetadata,
            depositAmount,
            lendingPeriod
        );
        const sellableTx = await libraryManager.connect(creator).createSellableBook(
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

    describe("Initialization", function () {
        it("should initialize with correct contract addresses", async function () {

            const rentableAddress = await rentableBook.getAddress();
            const sellableAddress = await sellableBook.getAddress();

            expect(rentableAddress).to.not.equal(ethers.ZeroAddress);
            expect(sellableAddress).to.not.equal(ethers.ZeroAddress);
        });

        it("should emit FactoryInitialized event during deployment", async function () {

            const BookFactoryFactory = await ethers.getContractFactory("BookFactory");
            const newBookFactory = await BookFactoryFactory.connect(deployer).deploy(await userSystem.getAddress());

            const tx = newBookFactory.deploymentTransaction();
            const receipt = await tx?.wait();

            const factoryInitializedEvents = receipt?.logs
                .filter((log: any) => {
                    try {
                        return newBookFactory.interface.parseLog(log)?.name === "FactoryInitialized";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => newBookFactory.interface.parseLog(log));

            expect(factoryInitializedEvents?.length).to.be.greaterThan(0);
        });
    });

    describe("Book Creation", function () {
        it("should create rentable books through the LibraryManager", async function () {
            const newMetadata = "ipfs://QmNewRentableBookHash";

            const tx = await libraryManager.connect(creator).createRentableBook(
                newMetadata,
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
            expect(bookCreatedEvents.length).to.be.greaterThan(0);
            // @ts-ignore
            const newBookId = bookCreatedEvents[0]?.args[0];

            const details = await libraryManager.getBookDetails(newBookId);
            expect(details[0]).to.equal(await rentableBook.getAddress());
        });

        it("should create sellable books through the LibraryManager", async function () {
            const newMetadata = "ipfs://QmNewSellableBookHash";

            const tx = await libraryManager.connect(creator).createSellableBook(
                newMetadata,
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
            expect(bookCreatedEvents.length).to.be.greaterThan(0);
            // @ts-ignore
            const newBookId = bookCreatedEvents[0]?.args[0];

            const details = await libraryManager.getBookDetails(newBookId);
            expect(details[0]).to.equal(await sellableBook.getAddress());
        });
    });

    describe("Book Details through LibraryManager", function () {
        it("should retrieve correct book types through LibraryManager", async function () {

            const rentableTx = await libraryManager.connect(creator).createRentableBook(
                "ipfs://QmSimpleRentable",
                depositAmount,
                lendingPeriod
            );

            const rentableReceipt = await rentableTx.wait();
            const rentableEvents = rentableReceipt?.logs
                .filter((log: any) => {
                    try {
                        const parsed = libraryManager.interface.parseLog(log);
                        return parsed?.name === "BookCreated";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => libraryManager.interface.parseLog(log));

            // @ts-ignore
            const rentableId = rentableEvents[0]?.args[0];

            const rentableDetails = await libraryManager.getBookDetails(rentableId);
            expect(rentableDetails[1]).to.equal(0);

            const sellableTx = await libraryManager.connect(creator).createSellableBook(
                "ipfs://QmSimpleSellable",
                salePrice
            );

            const sellableReceipt = await sellableTx.wait();
            const sellableEvents = sellableReceipt?.logs
                .filter((log: any) => {
                    try {
                        const parsed = libraryManager.interface.parseLog(log);
                        return parsed?.name === "BookCreated";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => libraryManager.interface.parseLog(log));

            // @ts-ignore
            const sellableId = sellableEvents[0]?.args[0];

            const sellableDetails = await libraryManager.getBookDetails(sellableId);
            expect(sellableDetails[1]).to.equal(1);
        });
        it("should retrieve all book IDs through LibraryManager", async function () {
            const allBookIds = await libraryManager.getAllBookIds();

            expect(allBookIds.length).to.be.at.least(2);

            expect(allBookIds).to.include(rentableBookId);
            expect(allBookIds).to.include(sellableBookId);
        });

        it("should retrieve paginated book IDs through LibraryManager", async function () {
            for (let i = 0; i < 3; i++) {
                await libraryManager.connect(creator).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                );
            }

            const firstPage = await libraryManager.getBookIdsPaginated(0, 2);
            expect(firstPage.length).to.equal(2);

            const secondPage = await libraryManager.getBookIdsPaginated(2, 2);
            expect(secondPage.length).to.equal(2);

            const allBooks = await libraryManager.getAllBookIds();

            expect(allBooks.length).to.equal(5);
        });
        it("should revert when trying to get contract for non-existent book", async function () {
            const nonExistentBookId = ethers.MaxUint256;

            await expect(
                libraryManager.getBookDetails(nonExistentBookId)
            ).to.be.revertedWith("LibraryManager: book does not exist");

        });
    });

    describe("Edge Cases", function () {
        it("should handle non-existent book lookup through LibraryManager", async function () {
            const nonExistentId = ethers.MaxUint256;

            await expect(
                libraryManager.getBookDetails(nonExistentId)
            ).to.be.revertedWith("LibraryManager: book does not exist");
        });

        it("should handle pagination with offset beyond array bounds", async function () {
            const allBooks = await libraryManager.getAllBookIds();

            const beyondBounds = await libraryManager.getBookIdsPaginated(
                allBooks.length + 10,
                5
            );


            expect(beyondBounds.length).to.equal(0);
        });

        it("should handle pagination with limit greater than available books", async function () {

            const allBooks = await libraryManager.getAllBookIds();
            const allWithLargeLimit = await libraryManager.getBookIdsPaginated(0, allBooks.length + 10);

            expect(allWithLargeLimit.length).to.equal(allBooks.length);
        });
        it("should correctly report the total number of books", async function () {

            const initialCount = await libraryManager.getTotalBooks();

            const numNewBooks = 3n;
            for (let i = 0; i < 3; i++) {
                if (i % 2 === 0) {
                    await libraryManager.connect(creator).createRentableBook(
                        `ipfs://QmTotalTestRentable${i}`,
                        depositAmount,
                        lendingPeriod
                    );
                } else {
                    await libraryManager.connect(creator).createSellableBook(
                        `ipfs://QmTotalTestSellable${i}`,
                        salePrice
                    );
                }
            }

            const newTotalBigInt = await libraryManager.getTotalBooks();

            expect(newTotalBigInt).to.equal(initialCount + numNewBooks);

            const allBookIds = await libraryManager.getAllBookIds();
            expect(BigInt(allBookIds.length)).to.equal(newTotalBigInt);
        });
    });
    describe("BookFactory Access Control", function () {

        it("should prevent direct book creation by non-owners", async function () {
            await expect(
                bookFactory.connect(creator).createRentableBook(
                    creator.address,
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.be.reverted;

            await expect(
                bookFactory.connect(creator).createSellableBook(
                    creator.address,
                    ipfsMetadata,
                    salePrice
                )
            ).to.be.reverted;
        });

        it("should prevent direct access to book info functions by non-owners", async function () {

            await expect(
                bookFactory.connect(creator).getBookInfo(rentableBookId)
            ).to.be.reverted;


            await expect(
                bookFactory.connect(creator).getBookContract(rentableBookId)
            ).to.be.reverted;
        });

        it("should prevent direct access to book enumeration functions by non-owners", async function () {
            await expect(
                bookFactory.connect(creator).getAllBookIds()
            ).to.be.reverted;

            await expect(
                bookFactory.connect(creator).getBookIdsPaginated(0, 10)
            ).to.be.reverted;

            await expect(
                bookFactory.connect(creator).totalBooks()
            ).to.be.reverted;
        });

        it("should prevent direct access to contract addresses by non-owners", async function () {

            await expect(
                bookFactory.connect(creator).getBookContractAddresses()
            ).to.be.reverted;
        });

        it("should allow access to functions through LibraryManager by registered users", async function () {

            await expect(
                libraryManager.connect(creator).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.not.be.reverted;

            await expect(
                libraryManager.connect(creator).createSellableBook(
                    ipfsMetadata,
                    salePrice
                )
            ).to.not.be.reverted;

            await expect(
                libraryManager.getBookDetails(rentableBookId)
            ).to.not.be.reverted;

            await expect(
                libraryManager.getAllBookIds()
            ).to.not.be.reverted;

            await expect(
                libraryManager.getBookIdsPaginated(0, 10)
            ).to.not.be.reverted;
        });

        it("should verify deployment permissions", async function () {

            const BookFactoryFactory = await ethers.getContractFactory("BookFactory");
            const newBookFactory = await BookFactoryFactory.connect(creator).deploy(await userSystem.getAddress());
            await newBookFactory.waitForDeployment();

            expect(await newBookFactory.owner()).to.equal(creator.address);

            await expect(
                newBookFactory.connect(user).createRentableBook(
                    user.address,
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.be.reverted;
        });
        it("should not allow unregistered users to create books", async function () {
            await expect(
                libraryManager.connect(unregisteredUser).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.be.revertedWith("LibraryManager: user not registered");

            await expect(
                libraryManager.connect(unregisteredUser).createSellableBook(
                    ipfsMetadata,
                    salePrice
                )
            ).to.be.revertedWith("LibraryManager: user not registered");
        });

        it("should not allow banned users to create books", async function () {
            await libraryManager.connect(deployer).banUser(creator.address);

            await expect(
                libraryManager.connect(creator).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.be.revertedWith("LibraryManager: user is banned");

            await expect(
                libraryManager.connect(creator).createSellableBook(
                    ipfsMetadata,
                    salePrice
                )
            ).to.be.revertedWith("LibraryManager: user is banned");
        });
    });
});