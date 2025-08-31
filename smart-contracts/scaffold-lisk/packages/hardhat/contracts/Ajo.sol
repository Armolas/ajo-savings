// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Ajo {
    struct Group {
        string name;
        address token; // ERC20 token used
        uint256 contributionAmount;
        uint256 cyclePeriod; // in seconds (weeks * 1 weeks)
        address[] members;
        uint256 currentCycle; // index of current payout round
        uint256 startTime;
        mapping(uint256 => mapping(address => bool)) contributions; // cycle => member => contributed?
        mapping(uint256 => bool) payoutClaimed; // cycle => claimed?
        mapping(uint256 => uint256) cycleBalance; // cycle => current balance
    }

    uint256 public groupCount;
    mapping(uint256 => Group) public groups;

    event GroupCreated(uint256 indexed groupId, string name, address token, uint256 amount, uint256 cyclePeriod, address[] members);
    event ContributionMade(uint256 indexed groupId, uint256 indexed cycle, address member, uint256 amount);
    event PoolClaimed(uint256 indexed groupId, uint256 indexed cycle, address member, uint256 amount);

    modifier onlyMember(uint256 groupId) {
        require(isMember(groupId, msg.sender), "Not a member");
        _;
    }

    function createGroup(
        string memory _name,
        address _token,
        uint256 _amount,
        uint256 _cycleWeeks,
        address[] memory _members
    ) external returns (uint256) {
        require(_members.length > 1, "Need at least 2 members");
        require(_amount > 0, "Invalid amount");

        groupCount++;
        Group storage g = groups[groupCount];
        g.name = _name;
        g.token = _token;
        g.contributionAmount = _amount;
        g.cyclePeriod = _cycleWeeks * 1 weeks;
        g.members = _members;
        g.currentCycle = 0;
        g.startTime = block.timestamp;

        emit GroupCreated(groupCount, _name, _token, _amount, g.cyclePeriod, _members);
        return groupCount;
    }

    function contribute(uint256 groupId) external onlyMember(groupId) {
        Group storage g = groups[groupId];

        uint256 cycle = getCurrentCycle(groupId);
        require(!g.contributions[cycle][msg.sender], "Already contributed this cycle");

        IERC20 token = IERC20(g.token);
        require(token.transferFrom(msg.sender, address(this), g.contributionAmount), "Transfer failed");

        g.contributions[cycle][msg.sender] = true;
        g.cycleBalance[cycle] += g.contributionAmount;

        emit ContributionMade(groupId, cycle, msg.sender, g.contributionAmount);
    }

    function claimPool(uint256 groupId) external onlyMember(groupId) {
        Group storage g = groups[groupId];

        uint256 cycle = getCurrentCycle(groupId);
        require(!g.payoutClaimed[cycle], "Payout already claimed");

        address eligible = g.members[cycle % g.members.length];
        require(msg.sender == eligible, "Not your turn");

        // Check all members contributed
        for (uint256 i = 0; i < g.members.length; i++) {
            require(g.contributions[cycle][g.members[i]], "Not all members contributed");
        }

        uint256 poolAmount = g.cycleBalance[cycle];
        g.payoutClaimed[cycle] = true;
        g.cycleBalance[cycle] = 0;

        IERC20(g.token).transfer(eligible, poolAmount);

        emit PoolClaimed(groupId, cycle, eligible, poolAmount);
    }

    function getCurrentCycle(uint256 groupId) public view returns (uint256) {
        Group storage g = groups[groupId];
        return (block.timestamp - g.startTime) / g.cyclePeriod;
    }

    function isMember(uint256 groupId, address user) public view returns (bool) {
        Group storage g = groups[groupId];
        for (uint256 i = 0; i < g.members.length; i++) {
            if (g.members[i] == user) return true;
        }
        return false;
    }

    // Get members (since struct with array in mapping isn't easily readable)
    function getMembers(uint256 groupId) external view returns (address[] memory) {
        return groups[groupId].members;
    }

    function getCurrentCycleBalance(uint256 groupId) external view returns (uint256) {
        uint256 currentCycle = getCurrentCycle(groupId);
        return groups[groupId].cycleBalance[currentCycle];
    }


    function getGroupsForAddress(address user) external view returns (uint256[] memory) {
        uint256[] memory userGroups = new uint256[](groupCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= groupCount; i++) {
            if (isMember(i, user)) {
                userGroups[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userGroups[i];
        }
        
        return result;
    }
}
