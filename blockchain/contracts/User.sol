// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UserTrustSystem
 * @dev Manages user trust level and system ownership privileges
 */
contract UserTrustSystem is Ownable {
    enum InfractionSeverity { Low, High }
    struct User {
        bool isRegistered;
        bool isSystemOwner;
        uint8 trustLevel;
    }

    struct UserRequests {
        uint256 requestCount;
        uint256 lastResetTime;
    }

    uint256 public constant MAX_REQUESTS_WINDOW = 1 hours;
    uint256 public constant MAX_REQUESTS_THRESHOLD = 10;

    address[] private _allUsers;

    mapping(address => UserRequests) private _userRequests;
    mapping(address => bool) private _authorizedContracts;
    mapping(address => User) private _users;
    uint256 private _systemOwnerCount;

    event UserRegistered(address indexed user);
    event SystemOwnerAdded(address indexed user);
    event SystemOwnerRemoved(address indexed user);
    event TrustLevelDecreased(address indexed user, uint8 oldLevel, uint8 newLevel, InfractionSeverity severity);
    event UserUnbanned(address indexed user, address indexed by);
    event GovernanceContractSet(address indexed governanceContract);


    function addAuthorizedContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = true;
    }

    function isAuthorizedContract(address contractAddress) public view returns (bool) {
        return _authorizedContracts[contractAddress];
    }

    constructor() Ownable(msg.sender) {
    }
    modifier onlyAuthorizedOrOwner() {
        require(
            _authorizedContracts[msg.sender] ||
            msg.sender == owner(),
            "Not authorized"
        );
        _;
    }
    // Modifiers
    modifier onlyRegistered(address user) {
        require(_users[user].isRegistered, "User not registered");
        _;
    }
    /**
     * @dev Registers a new user with maximum trust level
     * @param user The address of the user to register
     */
    function registerUser(address user) public onlyAuthorizedOrOwner {

        _users[user] = User({
            isRegistered: true,
            isSystemOwner: false,
            trustLevel: 5
        });

        _allUsers.push(user);

        emit UserRegistered(user);
    }

    function checkIfSpam(address user) public returns(bool) {
        if (isSystemOwner(user)) {
            return true;
        }

        UserRequests storage userRequest = _userRequests[user];

        if (block.timestamp - userRequest.lastResetTime > MAX_REQUESTS_WINDOW -1) {
            userRequest.requestCount = 0;
            userRequest.lastResetTime = block.timestamp;
        }
        if (++userRequest.requestCount > MAX_REQUESTS_THRESHOLD -1) {
            decreaseTrustLevel(user, InfractionSeverity.High);
            return false;
        }
        return true;
    }
    /**
     * @dev Grants system owner privileges to a user
     * @param user The address of the user
     */
    function addSystemOwner(address user) external onlyAuthorizedOrOwner {

        _users[user].isSystemOwner = true;
        _incrementSystemOwnerCount();
        emit SystemOwnerAdded(user);
    }

    /**
     * @dev Revokes system owner privileges from a user
     * @param user The address of the user
     */
    function removeSystemOwner(address user) public onlyAuthorizedOrOwner  {

        _users[user].isSystemOwner = false;
        _decrementSystemOwnerCount();
        emit SystemOwnerRemoved(user);
    }

    /**
     * @dev Record an infraction and decrease user's trust level
     * @param user The address of the user
     * @param severity The severity of the infraction
     */
    function decreaseTrustLevel(address user, InfractionSeverity severity) public onlyAuthorizedOrOwner {

        uint8 oldLevel = _users[user].trustLevel;
        uint8 decrease;


        if (severity == InfractionSeverity.Low) {
            decrease = 1;
        }else {
            decrease = 5;
        }

        uint8 newLevel = oldLevel - decrease;

        if(newLevel == 0){
            banUser(user);
        }else{
            _users[user].trustLevel = newLevel;
        }

        emit TrustLevelDecreased(user, oldLevel, newLevel, severity);
    }

    /**
     * @dev Unban a user by resetting their trust level to medium
     * @param user The address of the user to unban
     */
    function unbanUser(address user) public onlyAuthorizedOrOwner onlyRegistered(user) {
        require(_users[user].trustLevel == 0, "User is not banned");

        _users[user].trustLevel = 3;

        emit UserUnbanned(user, msg.sender);
    }

    /**
     * @dev Check if user is a system owner
     * @param user The address to check
     * @return True if the user is a system owner
     */
    function isSystemOwner(address user) public view returns (bool) {
        return _users[user].isSystemOwner;
    }

    /**
     * @dev Check if user is registered
     * @param user The address to check
     * @return True if the user is registered
     */
    function isRegistered(address user) public view returns (bool) {
        return _users[user].isRegistered;
    }

    /**
     * @dev Check if user is banned (trust level 0)
     * @param user The address to check
     * @return True if the user is banned
     */
    function isBanned(address user) public view returns (bool) {
        return _users[user].isRegistered && _users[user].trustLevel == 0;
    }

    /**
     * @dev Ban a user by setting their trust level to 0
     * @param user The address of the user to ban
     */
    function banUser(address user) public onlyAuthorizedOrOwner onlyRegistered(user) {

        require(!_users[user].isSystemOwner, "Cannot ban a system owner");

        uint8 oldLevel = _users[user].trustLevel;
        _users[user].trustLevel = 0;

        emit TrustLevelDecreased(user, oldLevel, 0, InfractionSeverity.High);
    }
    /**
     * @dev Get user's current trust level
     * @param user The address of the user
     * @return The user's trust level (0-5)
     */
    function getTrustLevel(address user) public view returns (uint8) {
        return _users[user].trustLevel;
    }

    /**
     * @dev Get the number of system owners
     * @return The count of system owners
     */
    function getSystemOwnerCount() public view returns (uint256) {
        return _systemOwnerCount;
    }

    /**
     * @dev Get all registered users
     * @return Array of all registered user addresses
     */
    function getAllUsers() external view onlyAuthorizedOrOwner returns (address[] memory) {
        return _allUsers;
    }

    /**
     * @dev Get total number of registered users
     * @return Total number of users
     */
    function totalUsers() external view returns (uint256) {
        return _allUsers.length;
    }

    function _incrementSystemOwnerCount() internal {
        _systemOwnerCount += 1;
    }

    function _decrementSystemOwnerCount() internal {
        _systemOwnerCount -= 1;
        //ITA sempre maggiore o uguale ad 1, non posso autorimuovermi
    }
}