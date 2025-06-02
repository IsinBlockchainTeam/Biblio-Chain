// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./User.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OwnerGovernance
 * @dev Sistema di governance multifirma per system owner con possibilità di voto contro
 */
contract OwnerGovernance is Ownable {
    UserTrustSystem public userSystem;

    enum ProposalType {AddOwner, RemoveOwner}
    enum ProposalState {Pending, Executed, Rejected}

    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        address target;
        address proposer;
        ProposalState state;
        uint256 approvalCount;
        uint256 rejectionCount;
        uint256 createdAt;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // Events
    event ProposalCreated(uint256 indexed proposalId, ProposalType proposalType, address target, address proposer);
    event ProposalApproved(uint256 indexed proposalId, address approver);
    event ProposalRejected(uint256 indexed proposalId, address rejecter);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalRejectionFinalized(uint256 indexed proposalId);

    /**
     * @dev Constructor to set the UserTrustSystem address
     * @param _userSystem Address of the UserTrustSystem contract
     */
    constructor(address _userSystem) Ownable(msg.sender) {
        userSystem = UserTrustSystem(_userSystem);
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    /**
     * @dev Approve a proposal
     * @param sender Address of the approver
     * @param proposalId ID of the proposal to approve
     */
    function approveProposal(address sender, uint256 proposalId) public onlyAuthorized {
        require(proposalId < proposalCount, "Proposal does not exist");

        Proposal storage proposal = proposals[proposalId];

        require(proposal.state == ProposalState.Pending, "Proposal is not pending");
        require(!proposal.hasVoted[sender], "Already voted");
        require(proposal.target != sender, "Cannot approve action on yourself");

        proposal.hasVoted[sender] = true;
        proposal.approvalCount++;

        emit ProposalApproved(proposalId, sender);

        if (_canExecute(proposalId)) {
            _executeProposal(proposalId);
        }
    }

    /**
     * @dev Reject a proposal
     * @param sender Address of the rejecter
     * @param proposalId ID of the proposal to reject
     */
    function rejectProposal(address sender, uint256 proposalId) public onlyAuthorized {
        require(proposalId < proposalCount, "Proposal does not exist");

        Proposal storage proposal = proposals[proposalId];

        require(proposal.state == ProposalState.Pending, "Proposal is not pending");
        require(!proposal.hasVoted[sender], "Already voted");

        proposal.hasVoted[sender] = true;
        proposal.rejectionCount++;

        emit ProposalRejected(proposalId, sender);

        if (_cannotReachQuorum(proposalId)) {
            proposal.state = ProposalState.Rejected;
            emit ProposalRejectionFinalized(proposalId);
        }
    }

    /**
     * @dev Create a proposal to add a new system owner
     * @param sender Address proposing the addition
     * @param newOwner Address to be added as system owner
     * @return proposalId The ID of the created proposal
     */
    function proposeAddOwner(address sender, address newOwner) external onlyAuthorized returns (uint256) {
        require(!userSystem.isSystemOwner(newOwner), "Already a system owner");
        require(userSystem.isRegistered(newOwner), "User not registered");

        uint256 proposalId = proposalCount++;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposalType = ProposalType.AddOwner;
        newProposal.target = newOwner;
        newProposal.proposer = sender;
        newProposal.state = ProposalState.Pending;
        newProposal.approvalCount = 0;
        newProposal.rejectionCount = 0;
        newProposal.createdAt = block.timestamp;

        approveProposal(sender, proposalId);

        emit ProposalCreated(proposalId, ProposalType.AddOwner, newOwner, sender);

        return proposalId;
    }


    function getProposalInfo(uint256 proposalId) external onlyAuthorized view returns (
        uint pId,
        uint proposalType,
        address target,
        address proposer,
        uint256 approvalCount,
        uint256 rejectionCount
    ) {
        require(proposalId < proposalCount, "Proposal does not exist");

        Proposal storage proposal = proposals[proposalId];

        return (
            proposal.id,
            uint(proposal.proposalType),
            proposal.target,
            proposal.proposer,
            proposal.approvalCount,
            proposal.rejectionCount
        );
    }

    /**
     * @dev Create a proposal to remove a system owner
     * @param sender Address proposing the removal
     * @param owner Address to be removed from system owners
     * @return proposalId The ID of the created proposal
     */
    function proposeRemoveOwner(address sender, address owner) external onlyAuthorized returns (uint256) {
        require(userSystem.isSystemOwner(owner), "Not a system owner");
        require(owner != sender, "Cannot propose to remove yourself");

        uint256 proposalId = proposalCount++;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposalType = ProposalType.RemoveOwner;
        newProposal.target = owner;
        newProposal.proposer = sender;
        newProposal.state = ProposalState.Pending;
        newProposal.approvalCount = 0;
        newProposal.rejectionCount = 0;
        newProposal.createdAt = block.timestamp;

        approveProposal(sender, proposalId);

        emit ProposalCreated(proposalId, ProposalType.RemoveOwner, owner, sender);

        return proposalId;
    }

    /**
     * @dev Check if a proposal can be executed based on approval thresholds
     * @param proposalId ID of the proposal
     * @return True if the proposal can be executed
     */
    function canExecute(uint256 proposalId) external view returns (bool) {
        return _canExecute(proposalId);
    }

    /**
     * @dev Check if a proposal can be executed based on approval thresholds
     * @param proposalId ID of the proposal
     * @return True if the proposal can be executed
     */
    function _canExecute(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];

        uint256 ownerCount = userSystem.getSystemOwnerCount();
        uint256 approvalCount = proposal.approvalCount;

        if (proposal.proposalType == ProposalType.AddOwner) {
            return approvalCount > ownerCount / 2;
        } else {

            uint256 requiredApprovals = ownerCount - 1;
            return approvalCount >= requiredApprovals && !proposal.hasVoted[proposal.target];
        }
    }

    /**
     * @dev Check if a proposal cannot reach quorum anymore due to rejections
     * @param proposalId ID of the proposal
     * @return True if the proposal cannot reach quorum
     */
    function _cannotReachQuorum(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 ownerCount = userSystem.getSystemOwnerCount();
        uint256 rejectionCount = proposal.rejectionCount;

        if (proposal.proposalType == ProposalType.AddOwner) {
            uint256 maxPossibleApprovals = ownerCount - rejectionCount;
            return maxPossibleApprovals <= ownerCount / 2;
        } else {
            return rejectionCount > 0;
        }
    }

    function hasVoted(uint256 proposalId, address wallet) public view onlyAuthorized returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.hasVoted[wallet];
    }
    /**
     * @dev Execute a proposal
     * @param proposalId ID of the proposal to execute
     */
    function _executeProposal(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.proposalType == ProposalType.AddOwner) {
            userSystem.addSystemOwner(proposal.target);
        } else {
            userSystem.removeSystemOwner(proposal.target);
        }

        proposal.state = ProposalState.Executed;

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Returns all pending proposals
     * @return proposalIds Array of pending proposal IDs
     */
    function getPendingProposals() external view returns (uint256[] memory) {
        uint256 pendingCount = 0;

        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].state == ProposalState.Pending) {
                pendingCount++;
            }
        }

        uint256[] memory result = new uint256[](pendingCount);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].state == ProposalState.Pending) {
                result[resultIndex] = i;
                resultIndex++;
            }
        }

        return result;
    }
}