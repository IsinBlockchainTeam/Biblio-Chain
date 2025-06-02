import { ethers } from "hardhat";
import { expect } from "chai";
import {
    BookFactory,
    LibraryManagerContract,
    OwnerGovernance,
    PausableController,
    RentableBook,
    SellableBook,
    UserTrustSystem
} from "../typechain-types";
import { debugLog } from "./util/utils";

describe("PausableController Contract Tests", function () {

    let libraryManager: LibraryManagerContract;
    let userSystem: UserTrustSystem;
    let governance: OwnerGovernance;
    let bookFactory: BookFactory;
    let pausableController: PausableController;
    let rentableBook: RentableBook;
    let sellableBook: SellableBook;

    let deployer: any;
    let systemOwner: any;
    let regularUser1: any;
    let regularUser2: any;
    let unregisteredUser: any;

    const ipfsMetadata = "ipfs://QmBookMetadataHash";
    const salePrice = ethers.parseEther("0.2");
    const depositAmount = ethers.parseEther("0.1");
    const lendingPeriod = 14;

    let rentableBookId: bigint;
    let sellableBookId: bigint;

    enum OperationType { Rentable, Sellable, Borrowing, Purchasing, Returning, All }

    beforeEach(async function () {

        [deployer, systemOwner, regularUser1, regularUser2, unregisteredUser] = await ethers.getSigners();

        const UserSystemFactory = await ethers.getContractFactory("UserTrustSystem");
        userSystem = await UserSystemFactory.connect(deployer).deploy();
        await userSystem.waitForDeployment();

        const GovernanceFactory = await ethers.getContractFactory("OwnerGovernance");
        governance = await GovernanceFactory.connect(deployer).deploy(await userSystem.getAddress());
        await governance.waitForDeployment();

        const BookFactoryFactory = await ethers.getContractFactory("BookFactory");
        bookFactory = await BookFactoryFactory.connect(deployer).deploy(await userSystem.getAddress());
        await bookFactory.waitForDeployment();

        const PausableControllerFactory = await ethers.getContractFactory("PausableController");
        pausableController = await PausableControllerFactory.connect(deployer).deploy();
        await pausableController.waitForDeployment();

        const LibraryManagerFactory = await ethers.getContractFactory("LibraryManagerContract");
        libraryManager = await LibraryManagerFactory.connect(deployer).deploy();
        await libraryManager.waitForDeployment();

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

        await libraryManager.connect(regularUser1).registerUser();
        await libraryManager.connect(regularUser2).registerUser();
        await libraryManager.connect(systemOwner).registerUser();


        await libraryManager.connect(deployer).proposeAddOwner(systemOwner.address);
        const proposalId = Number((await governance.proposalCount()) - 1n);

        const [, , , isSystemOwner] = await libraryManager.getUserInfo(systemOwner.address);
        expect(isSystemOwner).to.be.true;


        const rentableTx = await libraryManager.connect(regularUser1).createRentableBook(
            ipfsMetadata,
            depositAmount,
            lendingPeriod
        );
        const sellableTx = await libraryManager.connect(regularUser1).createSellableBook(
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

    describe("Initialization and Setup", function () {
        it("should add the Pausable Controller as an authorized contract", async function () {
            expect(await userSystem.isAuthorizedContract(pausableController.getAddress())).to.be.true;
        });
    });

    describe("Pausing Specific Operations", function () {
        it("should allow system owner to pause rentable book creation", async function () {

            await libraryManager.connect(systemOwner).pauseOperation(OperationType.Rentable);

            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.true;

            await expect(
                libraryManager.connect(regularUser1).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.be.revertedWith("LibraryManager: operation is paused");

            await expect(
                libraryManager.connect(regularUser1).createSellableBook(
                    ipfsMetadata,
                    salePrice
                )
            ).to.not.be.reverted;
        });

        it("should allow system owner to pause sellable book creation", async function () {

            await libraryManager.connect(systemOwner).pauseOperation(OperationType.Sellable);

            expect(await libraryManager.isOperationPaused(OperationType.Sellable)).to.be.true;

            await expect(
                libraryManager.connect(regularUser1).createSellableBook(
                    ipfsMetadata,
                    salePrice
                )
            ).to.be.revertedWith("LibraryManager: operation is paused");

            await expect(
                libraryManager.connect(regularUser1).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.not.be.reverted;
        });

        it("should allow system owner to pause borrowing", async function () {

            await libraryManager.connect(systemOwner).pauseOperation(OperationType.Borrowing);
            expect(await libraryManager.isOperationPaused(OperationType.Borrowing)).to.be.true;


            await expect(
                libraryManager.connect(regularUser2).borrowBook(rentableBookId, {
                    value: depositAmount
                })
            ).to.be.revertedWith("LibraryManager: operation is paused");

            await expect(
                libraryManager.connect(regularUser2).buyBook(sellableBookId, {
                    value: salePrice
                })
            ).to.not.be.reverted;
        });

        it("should allow system owner to pause purchasing", async function () {

            await libraryManager.connect(systemOwner).pauseOperation(OperationType.Purchasing);
            expect(await libraryManager.isOperationPaused(OperationType.Purchasing)).to.be.true;

            await expect(
                libraryManager.connect(regularUser2).buyBook(sellableBookId, {
                    value: salePrice
                })
            ).to.be.revertedWith("LibraryManager: operation is paused");

        });

        it("should allow system owner to pause returning and test with actual book return", async function () {

            const newRentableTx = await libraryManager.connect(regularUser1).createRentableBook(
                "ipfs://QmTestReturnBook",
                depositAmount,
                lendingPeriod
            );
            const newRentableReceipt = await newRentableTx.wait();

            const newRentableEvents = newRentableReceipt?.logs
                .filter((log: any) => {
                    try {
                        return libraryManager.interface.parseLog(log)?.name === "BookCreated";
                    } catch (e) {
                        return false;
                    }
                })
                .map((log: any) => libraryManager.interface.parseLog(log));

            // @ts-ignore
            const newRentableBookId = newRentableEvents[0]?.args[0];

            await libraryManager.connect(regularUser2).borrowBook(newRentableBookId, {
                value: depositAmount
            });


            const rentableBookAddress = await bookFactory.rentableBookContract();
            const rentable = await ethers.getContractAt("RentableBook", rentableBookAddress);
            const [, rentalData] = await rentable.getFullBookData(newRentableBookId);

            expect(rentalData.borrower).to.equal(regularUser2.address);

            await libraryManager.connect(systemOwner).pauseOperation(OperationType.Returning);

            expect(await libraryManager.isOperationPaused(OperationType.Returning)).to.be.true;

            await expect(
                libraryManager.connect(regularUser2).returnBook(newRentableBookId)
            ).to.be.revertedWith("LibraryManager: operation is paused");

            await libraryManager.connect(systemOwner).unpauseOperation(OperationType.Returning);

            await expect(
                libraryManager.connect(regularUser2).returnBook(newRentableBookId)
            ).to.not.be.reverted;

            const [, rentalDataAfter] = await rentable.getFullBookData(newRentableBookId);
            expect(rentalDataAfter.borrower).to.equal(ethers.ZeroAddress);
        });

        it("should allow system owner to unpause operations", async function () {

            await libraryManager.connect(systemOwner).pauseOperation(OperationType.Rentable);
            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.true;

            await libraryManager.connect(systemOwner).unpauseOperation(OperationType.Rentable);
            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.false;

            await expect(
                libraryManager.connect(regularUser1).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.not.be.reverted;
        });

        it("should pause all operations and then unpause all operations", async function () {

            await libraryManager.connect(systemOwner).pauseAll();

            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.true;
            expect(await libraryManager.isOperationPaused(OperationType.Sellable)).to.be.true;
            expect(await libraryManager.isOperationPaused(OperationType.Borrowing)).to.be.true;
            expect(await libraryManager.isOperationPaused(OperationType.Purchasing)).to.be.true;
            expect(await libraryManager.isOperationPaused(OperationType.Returning)).to.be.true;
            expect(await libraryManager.areAllPaused()).to.be.true;

            await libraryManager.connect(systemOwner).unpauseAll();

            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.false;
            expect(await libraryManager.isOperationPaused(OperationType.Sellable)).to.be.false;
            expect(await libraryManager.isOperationPaused(OperationType.Borrowing)).to.be.false;
            expect(await libraryManager.isOperationPaused(OperationType.Purchasing)).to.be.false;
            expect(await libraryManager.isOperationPaused(OperationType.Returning)).to.be.false;
            expect(await libraryManager.areAllPaused()).to.be.false;

            await expect(
                libraryManager.connect(regularUser1).createRentableBook(
                    ipfsMetadata,
                    depositAmount,
                    lendingPeriod
                )
            ).to.not.be.reverted;
        });

        it("should not allow non-system owners to unpause all operations", async function () {

            await libraryManager.connect(systemOwner).pauseAll();

            await expect(
                libraryManager.connect(regularUser1).unpauseAll()
            ).to.be.revertedWith("LibraryManager: not a system owner");

            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.true;
            expect(await libraryManager.areAllPaused()).to.be.true;
        });
    });


    describe("Access Control", function () {
        it("should not allow regular users to pause operations", async function () {
            await expect(
                libraryManager.connect(regularUser1).pauseOperation(OperationType.Rentable)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await expect(
                libraryManager.connect(regularUser1).pauseAll()
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should not allow regular users to unpause operations", async function () {

            await libraryManager.connect(systemOwner).pauseOperation(OperationType.Rentable);

            await expect(
                libraryManager.connect(regularUser1).unpauseOperation(OperationType.Rentable)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await expect(
                libraryManager.connect(regularUser1).unpauseAll()
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should not allow direct calls to PausableController", async function () {

            await expect(
                pausableController.connect(systemOwner).pauseOperation(OperationType.Rentable)
            ).to.be.reverted;

            await expect(
                pausableController.connect(systemOwner).unpauseOperation(OperationType.Rentable)
            ).to.be.reverted;
        });

        it("should reject pauseAll and unpauseAll from non-owner", async function () {

            await expect(
                pausableController.connect(regularUser1).pauseAll()
            ).to.be.reverted;

            await expect(
                pausableController.connect(regularUser1).unpauseAll()
            ).to.be.reverted;

            await expect(
                pausableController.connect(systemOwner).pauseAll()
            ).to.be.reverted;

            await expect(
                pausableController.connect(systemOwner).unpauseAll()
            ).to.be.reverted;
        });
    });

    describe("Edge Cases", function () {
        it("should handle pausing already paused operations", async function () {

            await libraryManager.connect(systemOwner).pauseOperation(OperationType.Rentable);

            await expect(
                libraryManager.connect(systemOwner).pauseOperation(OperationType.Rentable)
            ).to.not.be.reverted;

            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.true;
        });

        it("should handle unpausing already unpaused operations", async function () {
            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.false;

            await expect(
                libraryManager.connect(systemOwner).unpauseOperation(OperationType.Rentable)
            ).to.not.be.reverted;

            expect(await libraryManager.isOperationPaused(OperationType.Rentable)).to.be.false;
        });

        it("should allow read operations even when all operations are paused", async function () {

            await libraryManager.connect(systemOwner).pauseAll();

            await expect(
                libraryManager.getBookDetails(rentableBookId)
            ).to.not.be.reverted;

            await expect(
                libraryManager.getAllBookIds()
            ).to.not.be.reverted;

            await expect(
                libraryManager.getUserInfo(regularUser1.address)
            ).to.not.be.reverted;
        });
    });
});