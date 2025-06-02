// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PausableController
 * @dev Gestisce lo stato di pausa per diverse operazioni nel sistema
 */
contract PausableController is Ownable {

    enum OperationType { Rentable, Sellable, Borrowing, Purchasing, Returning }
    mapping(OperationType => bool) private _pausedOperations;

    event OperationPaused(OperationType indexed operationType);
    event OperationUnpaused(OperationType indexed operationType);
    event AllOperationsPaused();
    event AllOperationsUnpaused();

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Mette in pausa un tipo specifico di operazione
     * @param operationType Il tipo di operazione da mettere in pausa
     */
    function pauseOperation(OperationType operationType) external onlyOwner {
        _pausedOperations[operationType] = true;
        emit OperationPaused(operationType);
    }

    /**
     * @dev Riprende un tipo specifico di operazione
     * @param operationType Il tipo di operazione da riprendere
     */
    function unpauseOperation(OperationType operationType) external onlyOwner {
        _pausedOperations[operationType] = false;
        emit OperationUnpaused(operationType);
    }

    /**
     * @dev Mette in pausa tutte le operazioni
     */
    function pauseAll() external onlyOwner {
        for (uint i = 0; i < uint(type(OperationType).max) + 1; i++) {
            _pausedOperations[OperationType(i)] = true;
        }
        emit AllOperationsPaused();
    }

    /**
     * @dev Riprende tutte le operazioni
     */
    function unpauseAll() external onlyOwner {
        for (uint i = 0; i < uint(type(OperationType).max) + 1; i++) {
            _pausedOperations[OperationType(i)] = false;
        }
        emit AllOperationsUnpaused();
    }

    /**
     * @dev Verifica se un tipo di operazione è in pausa
     * @param operationType Il tipo di operazione da verificare
     * @return True se l'operazione è in pausa
     */
    function isOperationPaused(OperationType operationType) public view returns (bool) {
        return _pausedOperations[operationType];
    }

    /**
     * @dev Verifica se tutte le operazioni sono in pausa
     * @return True se tutte le operazioni sono in pausa
     */
    function areAllPaused() public view returns (bool) {
        for (uint i = 0; i < uint(type(OperationType).max) + 1; i++) {
            if (!_pausedOperations[OperationType(i)]) {
                return false;
            }
        }
        return true;
    }
}