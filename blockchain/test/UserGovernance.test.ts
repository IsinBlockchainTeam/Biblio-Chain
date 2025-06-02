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

describe("OwnerGovernance Contract Tests", function () {

    let libraryManager: LibraryManagerContract;
    let userSystem: UserTrustSystem;
    let governance: OwnerGovernance;
    let bookFactory: BookFactory;

    let deployer: any;
    let owner1: any;
    let owner2: any;
    let regularUser: any;
    let newOwnerCandidate: any;
    let newOwnerCandidate2: any;
    let unregisteredUser: any;

    beforeEach(async function () {

        [deployer, owner1, owner2, regularUser, newOwnerCandidate, unregisteredUser, newOwnerCandidate2] = await ethers.getSigners();

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

        await libraryManager.connect(owner1).registerUser();
        await libraryManager.connect(owner2).registerUser();
        await libraryManager.connect(regularUser).registerUser();
        await libraryManager.connect(newOwnerCandidate).registerUser();
        await libraryManager.connect(newOwnerCandidate2).registerUser();

        await libraryManager.connect(deployer).proposeAddOwner(owner1.address);

        const [, , , isOwner1] = await libraryManager.getUserInfo(owner1.address);
        expect(isOwner1).to.be.true;

        await libraryManager.connect(deployer).proposeAddOwner(owner2.address);
        const proposalId2 = Number((await governance.proposalCount()) - 1n);
        await libraryManager.connect(owner1).approveProposal(proposalId2);

        const [, , , isOwner2] = await libraryManager.getUserInfo(owner2.address);
        expect(isOwner2).to.be.true;

        debugLog("Setup complete: Deployer, Owner1, and Owner2 are system owners");
    });

    describe("Proposal Creation", function () {
        it("should allow system owners to propose adding a new owner", async function () {
            await expect(
                libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address)
            ).to.not.be.reverted;

            const proposalId = (await governance.proposalCount()) - 1n;
            const proposal = await governance.proposals(proposalId);

            expect(proposal.proposalType).to.equal(0);
            expect(proposal.target).to.equal(newOwnerCandidate.address);
            expect(proposal.proposer).to.equal(owner1.address);
            expect(proposal.state).to.be.equal(0);
            expect(proposal.approvalCount).to.equal(1n);
            expect(proposal.rejectionCount).to.equal(0n);
        });

        it("should allow system owners to propose removing an existing owner", async function () {
            await expect(
                libraryManager.connect(owner1).proposeRemoveOwner(owner2.address)
            ).to.not.be.reverted;

            const proposalId = (await governance.proposalCount()) - 1n;
            const proposal = await governance.proposals(proposalId);

            expect(proposal.proposalType).to.equal(1);
            expect(proposal.target).to.equal(owner2.address);
            expect(proposal.proposer).to.equal(owner1.address);
            expect(proposal.state).to.be.equal(0);
            expect(proposal.approvalCount).to.equal(1n);
            expect(proposal.rejectionCount).to.equal(0n);
        });

        it("should not allow regular users to propose adding a new owner", async function () {
            await expect(
                libraryManager.connect(regularUser).proposeAddOwner(newOwnerCandidate.address)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should not allow proposing a user that is already a system owner", async function () {
            await expect(
                libraryManager.connect(owner1).proposeAddOwner(owner2.address)
            ).to.be.revertedWith("Already a system owner");
        });

        it("should not allow proposing to remove yourself as a system owner", async function () {
            await expect(
                libraryManager.connect(owner1).proposeRemoveOwner(owner1.address)
            ).to.be.revertedWith("Cannot propose to remove yourself");
        });

        it("should not allow proposing an unregistered user as system owner", async function () {
            await expect(
                libraryManager.connect(owner1).proposeAddOwner(unregisteredUser.address)
            ).to.be.revertedWith("User not registered");
        });

        it("should not allow proposing to remove a user that is not a system owner", async function () {
            await expect(
                libraryManager.connect(owner1).proposeRemoveOwner(regularUser.address)
            ).to.be.revertedWith("Not a system owner");
        });
    });

    describe("Proposal Approval", function () {
        let addOwnerProposalId: number;
        let removeOwnerProposalId: number;

        beforeEach(async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            addOwnerProposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            removeOwnerProposalId = Number((await governance.proposalCount()) - 1n);
        });

        it("should allow other system owners to approve a proposal", async function () {
            await expect(
                libraryManager.connect(deployer).approveProposal(addOwnerProposalId)
            ).to.not.be.reverted;

            const proposal = await governance.proposals(addOwnerProposalId);
            expect(proposal.approvalCount).to.equal(2n);

        });

        it("should not allow a system owner to approve the same proposal twice", async function () {
            await libraryManager.connect(deployer).proposeRemoveOwner(owner2.address);
            const removeProposalId = Number((await governance.proposalCount()) - 1n);

            const proposalBefore = await governance.proposals(removeProposalId);
            expect(proposalBefore.state).to.be.equal(0);

            await expect(
                libraryManager.connect(deployer).approveProposal(removeProposalId)
            ).to.be.revertedWith("Already voted");
        });

        it("should not allow approving a proposal targeting yourself", async function () {
            await expect(
                libraryManager.connect(owner2).approveProposal(removeOwnerProposalId)
            ).to.be.revertedWith("Cannot approve action on yourself");
        });

        it("should not allow regular users to approve proposals", async function () {
            await expect(
                libraryManager.connect(regularUser).approveProposal(addOwnerProposalId)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should not allow approving non-existent proposals", async function () {
            const nonExistentProposalId = 999;
            await expect(
                libraryManager.connect(deployer).approveProposal(nonExistentProposalId)
            ).to.be.revertedWith("Proposal does not exist");
        });

        it("should not allow approving already executed proposals", async function () {
            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            const removeProposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(deployer).approveProposal(removeProposalId);

            const proposal = await governance.proposals(removeProposalId);
            expect(proposal.state).to.be.equal(1);

            await expect(
                libraryManager.connect(owner1).approveProposal(removeProposalId)
            ).to.be.revertedWith("Proposal is not pending");
        });

        it("should not allow approving a proposal after rejecting it", async function () {
            await libraryManager.connect(deployer).rejectProposal(addOwnerProposalId);

            await expect(
                libraryManager.connect(deployer).approveProposal(addOwnerProposalId)
            ).to.be.revertedWith('Already voted');
        });
    });

    describe("Proposal Rejection", function () {
        let addOwnerProposalId: number;
        let removeOwnerProposalId: number;

        beforeEach(async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            addOwnerProposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            removeOwnerProposalId = Number((await governance.proposalCount()) - 1n);
        });

        it("should allow system owners to reject a proposal", async function () {
            await expect(
                libraryManager.connect(deployer).rejectProposal(addOwnerProposalId)
            ).to.not.be.reverted;

            const proposal = await governance.proposals(addOwnerProposalId);
            expect(proposal.rejectionCount).to.equal(1n);

        });

        it("should not allow rejecting a non-existing proposal", async function () {;
            await expect(
                libraryManager.connect(deployer).rejectProposal(65677788)
            ).to.be.revertedWith("Proposal does not exist");
        });

        it("should not allow rejecting a proposal twice", async function () {
            await libraryManager.connect(deployer).rejectProposal(addOwnerProposalId);

            await expect(
                libraryManager.connect(deployer).rejectProposal(addOwnerProposalId)
            ).to.be.revertedWith("Already voted");
        });

        it("should not allow rejecting a proposal after approving it", async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate2.address);
            const newProposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(deployer).approveProposal(newProposalId);

            const voted = await libraryManager.connect(deployer).hasVoted(newProposalId);
            expect(voted).to.be.equal(true);

            const proposals: any[] = await libraryManager.getPendingProposals();
            expect(proposals).does.not.contain(newProposalId); //eseguita

            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const p2 = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(deployer).approveProposal(p2);

            await expect(
                libraryManager.connect(deployer).rejectProposal(p2)
            ).to.be.revertedWith("Already voted");
        });

        it("should automatically reject AddOwner proposal when majority rejects", async function () {
            await libraryManager.connect(deployer).rejectProposal(addOwnerProposalId);

            let proposal = await governance.proposals(addOwnerProposalId);
            expect(proposal.state).to.equal(0); // Pending

            await libraryManager.connect(owner2).rejectProposal(addOwnerProposalId);


            proposal = await governance.proposals(addOwnerProposalId);
            expect(proposal.state).to.equal(2); // Rejected

            const [, , , isOwner] = await libraryManager.getUserInfo(newOwnerCandidate.address);
            expect(isOwner).to.be.false;
        });

        it("should automatically reject RemoveOwner proposal with just one rejection", async function () {
            await libraryManager.connect(deployer).rejectProposal(removeOwnerProposalId);
            expect(await libraryManager.connect(deployer).hasVoted(removeOwnerProposalId)).to.be.equal(true);

            const proposal = await governance.proposals(removeOwnerProposalId);
            expect(proposal.state).to.equal(2); // Rejected

            const [, , , isStillOwner] = await libraryManager.getUserInfo(owner2.address);
            expect(isStillOwner).to.be.true;
        });

        it("should not allow approving or rejecting rejected proposals", async function () {
            await libraryManager.connect(deployer).rejectProposal(addOwnerProposalId);
            await libraryManager.connect(owner2).rejectProposal(addOwnerProposalId);

            const proposal = await governance.proposals(addOwnerProposalId);
            expect(proposal.state).to.equal(2);

            await expect(
                libraryManager.connect(owner1).approveProposal(addOwnerProposalId)
            ).to.be.revertedWith("Proposal is not pending");

            await expect(
                libraryManager.connect(owner1).rejectProposal(addOwnerProposalId)
            ).to.be.revertedWith("Proposal is not pending");
        });
    });

    describe("⚙Proposal Execution", function () {
        let addOwnerProposalId: number;
        let removeOwnerProposalId: number;

        beforeEach(async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            addOwnerProposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            removeOwnerProposalId = Number((await governance.proposalCount()) - 1n);
        });

        it("should auto-execute adding owner proposal when majority approves", async function () {
            await libraryManager.connect(deployer).approveProposal(addOwnerProposalId);

            const proposal = await governance.proposals(addOwnerProposalId);
            expect(proposal.state).to.be.equal(1);

            const [, , , isNewOwner] = await libraryManager.getUserInfo(newOwnerCandidate.address);
            expect(isNewOwner).to.be.true;
        });

        it("should require unanimous approval minus target for removing owner", async function () {
            const canExec = await libraryManager.canExecuteProposal(removeOwnerProposalId);
            expect(
                canExec
            ).to.be.false;

            await libraryManager.connect(deployer).approveProposal(removeOwnerProposalId);

            const proposal = await governance.proposals(removeOwnerProposalId);
            expect(proposal.state).to.be.equal(1);

            // Verify owner was removed
            const [, , , isStillOwner] = await libraryManager.getUserInfo(owner2.address);
            expect(isStillOwner).to.be.false;
        });

        it("should not allow executing proposal without sufficient approvals", async function () {
            const canExec = await libraryManager.canExecuteProposal(addOwnerProposalId);
            expect(
                canExec
            ).to.be.false;
        });

        it("should not allow executing non-existent proposals", async function () {
            const nonExistentProposalId = 999;
            expect(
                await libraryManager.canExecuteProposal(nonExistentProposalId)
            ).to.be.false;
        });
    });

    describe("Governance Information Retrieval", function () {
        let proposalId: number;

        beforeEach(async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            proposalId = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).approveProposal(proposalId);
        });

        it("should correctly check if a proposal can be executed", async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate2.address);
            const addOwnerProposalId = Number((await governance.proposalCount()) - 1n);

            const canExecuteBeforeSecondApproval = await libraryManager.canExecuteProposal(addOwnerProposalId);
            expect(canExecuteBeforeSecondApproval).to.be.false;

            await libraryManager.connect(deployer).approveProposal(addOwnerProposalId);
            await libraryManager.connect(owner2).approveProposal(addOwnerProposalId);

            const proposalAfterApproval = await governance.proposals(addOwnerProposalId);
            expect(proposalAfterApproval.state).to.be.equal(1);

            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            const removeProposalId = Number((await governance.proposalCount()) - 1n);

            const canExecuteRemove = await libraryManager.canExecuteProposal(removeProposalId);
            expect(canExecuteRemove).to.be.false;

            await libraryManager.connect(deployer).approveProposal(removeProposalId);
            await libraryManager.connect(newOwnerCandidate2).approveProposal(removeProposalId);
            await libraryManager.connect(newOwnerCandidate).approveProposal(removeProposalId);

            const proposalAfterAllApprovals = await governance.proposals(removeProposalId);
            expect(proposalAfterAllApprovals.state).to.be.equal(1);
        });
        it("should not get detail for non-existing requests", async function () {

            await expect(
                libraryManager.connect(deployer).getProposalInfo(98766)
            ).to.be.revertedWith("Proposal does not exist");
        });
    });

    describe("Access Control", function () {
        it("should prevent direct calls to governance contract functions", async function () {

            await expect(
                governance.connect(owner1).proposeAddOwner(owner1.address, newOwnerCandidate.address)
            ).to.be.revertedWith("Not authorized");

            await expect(
                governance.connect(owner1).hasVoted(0, owner1.address)
            ).to.be.revertedWith("Not authorized");

            await expect(
                governance.connect(owner1).proposeRemoveOwner(owner1.address, owner2.address)
            ).to.be.revertedWith("Not authorized");

            await expect(
                governance.connect(owner1).getProposalInfo(0)
            ).to.be.revertedWith("Not authorized");

            await expect(
                governance.connect(owner1).approveProposal(owner1.address, 0)
            ).to.be.revertedWith("Not authorized");

            await expect(
                governance.connect(owner1).rejectProposal(owner1.address, 0)
            ).to.be.revertedWith("Not authorized");
        });

        it("should require system owner access for governance functions", async function () {

            await expect(
                libraryManager.connect(regularUser).proposeAddOwner(newOwnerCandidate.address)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await expect(
                libraryManager.connect(regularUser).getProposalInfo(0)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await expect(
                libraryManager.connect(regularUser).proposeRemoveOwner(owner1.address)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);

            await expect(
                libraryManager.connect(regularUser).approveProposal(proposalId)
            ).to.be.revertedWith("LibraryManager: not a system owner");


            await expect(
                libraryManager.connect(regularUser).hasVoted(proposalId)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await expect(
                libraryManager.connect(regularUser).rejectProposal(proposalId)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await expect(
                libraryManager.connect(regularUser).canExecuteProposal(proposalId)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await expect(
                libraryManager.connect(regularUser).getPendingProposals()
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });
    });

    describe("Edge Cases", function () {
        it("should handle multiple proposals simultaneously", async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const proposalId1 = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(unregisteredUser).registerUser();

            await libraryManager.connect(owner2).proposeAddOwner(unregisteredUser.address);
            const proposalId2 = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(deployer).approveProposal(proposalId1);
            await libraryManager.connect(deployer).approveProposal(proposalId2);
            await libraryManager.connect(owner1).approveProposal(proposalId2);

            const proposal1 = await governance.proposals(proposalId1);
            const proposal2 = await governance.proposals(proposalId2);

            expect(proposal1.state).to.be.equal(1);
            expect(proposal2.state).to.be.equal(1);

            const [, , , isNewOwner1] = await libraryManager.getUserInfo(newOwnerCandidate.address);
            const [, , , isNewOwner2] = await libraryManager.getUserInfo(unregisteredUser.address);

            expect(isNewOwner1).to.be.true;
            expect(isNewOwner2).to.be.true;
        });

        it("should correctly update system owner count after adding and removing owners", async function () {
            const initialCount = await userSystem.getSystemOwnerCount();

            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const addProposalId = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).approveProposal(addProposalId);

            const countAfterAdd = await userSystem.getSystemOwnerCount();
            expect(countAfterAdd).to.be.gt(initialCount);

            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            const removeProposalId = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).approveProposal(removeProposalId);
            await libraryManager.connect(newOwnerCandidate).approveProposal(removeProposalId);

            const finalCount = await userSystem.getSystemOwnerCount();
            expect(finalCount).to.equal(initialCount);
        });

        it("should allow a newly added system owner to approve proposals", async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const addProposalId = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).approveProposal(addProposalId);

            const [, , , isNewOwner] = await libraryManager.getUserInfo(newOwnerCandidate.address);
            expect(isNewOwner).to.be.true;

            await libraryManager.connect(unregisteredUser).registerUser();
            await libraryManager.connect(owner1).proposeAddOwner(unregisteredUser.address);
            const anotherProposalId = Number((await governance.proposalCount()) - 1n);

            await expect(
                libraryManager.connect(newOwnerCandidate).approveProposal(anotherProposalId)
            ).to.not.be.reverted;
        });

        it("should not allow approvals from removed owners", async function () {
            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            const removeProposalId = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).approveProposal(removeProposalId);

            await libraryManager.connect(unregisteredUser).registerUser();
            await libraryManager.connect(owner1).proposeAddOwner(unregisteredUser.address);
            const newProposalId = Number((await governance.proposalCount()) - 1n);

            await expect(
                libraryManager.connect(owner2).approveProposal(newProposalId)
            ).to.be.revertedWith("LibraryManager: not a system owner");

            await expect(
                libraryManager.connect(owner2).rejectProposal(newProposalId)
            ).to.be.revertedWith("LibraryManager: not a system owner");
        });

        it("should handle mixed approvals and rejections correctly", async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(owner2).rejectProposal(proposalId);

            let proposal = await governance.proposals(proposalId);
            expect(proposal.state).to.equal(0);

            await libraryManager.connect(deployer).approveProposal(proposalId);

            proposal = await governance.proposals(proposalId);
            expect(proposal.state).to.equal(1);

            const [, , , isOwner] = await libraryManager.getUserInfo(newOwnerCandidate.address);
            expect(isOwner).to.be.true;
        });
    });

    describe("Pending Proposals", function () {
        it("should return list of pending proposals correctly", async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const proposalId1 = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate2.address);
            const proposalId2 = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(deployer).approveProposal(proposalId1);

            const pendingProposals = await libraryManager.getPendingProposals();

            expect(pendingProposals.length).to.equal(1);
            expect(Number(pendingProposals[0])).to.equal(proposalId2);
        });

        it("should return empty array when no pending proposals exist", async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).approveProposal(proposalId);

            const pendingProposals = await libraryManager.getPendingProposals();

            expect(pendingProposals.length).to.equal(0);
        });

        it("should handle proposals in different states", async function () {
            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const proposalId1 = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).approveProposal(proposalId1);

            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate2.address);
            const proposalId2 = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).rejectProposal(proposalId2);
            await libraryManager.connect(owner2).rejectProposal(proposalId2);

            await libraryManager.connect(unregisteredUser).registerUser();
            await libraryManager.connect(owner1).proposeAddOwner(unregisteredUser.address);
            const proposalId3 = Number((await governance.proposalCount()) - 1n);

            const pendingProposals = await libraryManager.getPendingProposals();

            expect(pendingProposals.length).to.equal(1);
            expect(Number(pendingProposals[0])).to.equal(proposalId3);
        });
    });

    describe("Rejection and Approval Thresholds", function () {
        it("should correctly implement majority threshold for AddOwner proposals", async function () {

            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(deployer).approveProposal(proposalId);


            const proposal = await governance.proposals(proposalId);
            expect(proposal.state).to.equal(1);
        });

        it("should correctly implement unanimity threshold for RemoveOwner proposals", async function () {

            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(deployer).approveProposal(proposalId);

            const proposal = await governance.proposals(proposalId);
            expect(proposal.state).to.equal(1);
        });

        it("should reject AddOwner proposal when majority rejects", async function () {

            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate.address);
            let proposalId = Number((await governance.proposalCount()) - 1n);
            await libraryManager.connect(deployer).approveProposal(proposalId);


            await libraryManager.connect(owner1).proposeAddOwner(newOwnerCandidate2.address);
            proposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(owner2).rejectProposal(proposalId);

            let [id, type, target, proposer, ,  ] = await libraryManager.connect(deployer).getProposalInfo(proposalId);
            expect(id).to.equal(proposalId);
            expect(type).to.equal(0);
            expect(target).to.equal(newOwnerCandidate2.address);
            expect(proposer).to.equal(owner1.address);

            let proposal = await governance.proposals(proposalId);
            expect(proposal.state).to.equal(0);

            await libraryManager.connect(newOwnerCandidate).rejectProposal(proposalId);

            proposal = await governance.proposals(proposalId);
            expect(proposal.state).to.equal(2);
        });

        it("should reject RemoveOwner proposal with just one rejection", async function () {

            await libraryManager.connect(owner1).proposeRemoveOwner(owner2.address);
            const proposalId = Number((await governance.proposalCount()) - 1n);

            await libraryManager.connect(deployer).rejectProposal(proposalId);

            const proposal = await governance.proposals(proposalId);

            expect(proposal.state).to.equal(2);
        });
    });
});