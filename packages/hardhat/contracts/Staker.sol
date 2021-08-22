pragma solidity >=0.6.0 <0.7.0;

import "hardhat/console.sol";
import "./ExampleExternalContract.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract Staker {
    ExampleExternalContract public exampleExternalContract;

    mapping(address => uint256) public balances;
    uint256 public constant threshold = 1 ether;
    uint256 public deadline = now + 30 seconds;
    bool public openForWithdraw = false;

    event Stake(address, uint256);

    constructor(address exampleExternalContractAddress) public {
        exampleExternalContract = ExampleExternalContract(
            exampleExternalContractAddress
        );
    }

    modifier deadlinePassed() {
        require(now >= deadline, "Deadline has not passed");
        _;
    }

    modifier notCompleted() {
        require(!exampleExternalContract.completed(), "Already completed");
        _;
    }

    // Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
    //  ( make sure to add a `Stake(address,uint256)` event and emit it for the frontend <List/> display )
    function stake() public payable {
        require(now < deadline, "Deadline has passed");
        balances[msg.sender] += msg.value;
        emit Stake(msg.sender, msg.value);
    }

    // After some `deadline` allow anyone to call an `execute()` function
    //  It should either call `exampleExternalContract.complete{value: address(this).balance}()` to send all the value
    function execute() public deadlinePassed notCompleted {
        require(!openForWithdraw, "Already executed");

        if (address(this).balance >= threshold) {
            exampleExternalContract.complete{value: address(this).balance}();
        } else {
            openForWithdraw = true;
        }
    }

    // if the `threshold` was not met, allow everyone to call a `withdraw()` function
    function withdraw(address payable withdrawer)
        public
        deadlinePassed
        notCompleted
    {
        require(openForWithdraw, "Execute to open withdrawal");
        require(balances[withdrawer] > 0, "Nothing to withdraw");
        require(withdrawer == msg.sender, "Can only withdraw your own stake");
        withdrawer.transfer(balances[withdrawer]);
        balances[withdrawer] = 0;
    }

    // Add a `timeLeft()` view function that returns the time left before the deadline for the frontend
    function timeLeft() public view returns (uint256) {
        if (now >= deadline) {
            return 0;
        } else {
            return deadline - now;
        }
    }
}
