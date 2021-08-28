pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./YourToken.sol";

contract Vendor is Ownable {
    YourToken yourToken;
    uint256 public constant tokensPerEth = 100;

    event BuyTokens(address buyer, uint256 amountOfETH, uint256 amountOfTokens);
    event SellTokens(
        address seller,
        uint256 amountOfETH,
        uint256 amountOfTokens
    );

    constructor(address tokenAddress) public {
        yourToken = YourToken(tokenAddress);
    }

    //ToDo: create a payable buyTokens() function:
    function buyTokens() public payable {
        uint256 amountOfTokens = msg.value * tokensPerEth;
        yourToken.transfer(msg.sender, amountOfTokens);
        emit BuyTokens(msg.sender, msg.value, amountOfTokens);
    }

    //ToDo: create a sellTokens() function:
    function sellTokens(uint256 amountOfTokens) public {
        uint256 amount = amountOfTokens / tokensPerEth;
        yourToken.transferFrom(msg.sender, address(this), amountOfTokens);
        msg.sender.transfer(amount);
        emit SellTokens(msg.sender, amount, amountOfTokens);
    }

    //ToDo: create a withdraw() function that lets the owner, you can
    //use the Ownable.sol import above:
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        msg.sender.transfer(amount);
    }
}
