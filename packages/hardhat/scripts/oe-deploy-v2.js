/* eslint no-use-before-define: "warn" */
const { deploy } = require('./utils')
const { Watcher } = require('@eth-optimism/watcher')
const {  JsonRpcProvider } = require("@ethersproject/providers");
const fs = require("fs");

const main = async () => {

  console.log("\n\n 📡 Deploying...\n");

  const l1MessengerAddress = '0x6418E5Da52A3d7543d393ADD3Fa98B0795d27736'
  const l2MessengerAddress = '0x4200000000000000000000000000000000000007'

  const decimals = 18
  const name = "OldEnglish"
  const symbol = "OE"
  const initialSupply = "100"

  const mnemonic = fs.readFileSync("./mnemonic.txt").toString().trim()
  const deployWallet = new ethers.Wallet.fromMnemonic(mnemonic)//, optimisticProvider)

  const yourContractL2 = await deploy({contractName: "YourContract", rpcUrl: "http://localhost:8545", ovm: true})

  const L1_ERC20 = await deploy({contractName: "ERC20", rpcUrl: "http://localhost:9545", ovm: false, _args: [initialSupply, symbol, decimals]}) // <-- add in constructor args like line 19 vvvv

  const OVM_L2DepositedERC20 = await deploy({contractName: "L2DepositedERC20", rpcUrl: "http://localhost:8545", ovm: true, _args: [l2MessengerAddress, decimals, name, symbol]})

  const OVM_L1ERC20Gateway = await deploy({contractName: "L1ERC20Gateway", rpcUrl: "http://localhost:9545", ovm: false, _args: [L1_ERC20.address, OVM_L2DepositedERC20.address, l1MessengerAddress]})

  const init = await OVM_L2DepositedERC20.init(OVM_L1ERC20Gateway.address)
  console.log('L2 initialised: ',init.hash)

  const l1Provider = new JsonRpcProvider("http://localhost:9545")
  const l2Provider = new JsonRpcProvider("http://localhost:8545")

  const watcher = new Watcher({
  l1: {
    provider: l1Provider,
    messengerAddress: l1MessengerAddress
  },
  l2: {
    provider: l2Provider,
    messengerAddress: l2MessengerAddress
  }
})

const logBalances = async (description = '') => {
  console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ' + description + ' ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
  if(L1_ERC20) {
    const l1Balance = await L1_ERC20.balanceOf(deployWallet.address)
    console.log('L1 balance of', deployWallet.address, 'is', l1Balance.toString())
  } else { console.log('no L1_ERC20 configured') }
  if(OVM_L2DepositedERC20) {
    const l2Balance = await OVM_L2DepositedERC20.balanceOf(deployWallet.address)
    console.log('L2 balance of', deployWallet.address, 'is', l2Balance.toString())
  } else { console.log('no OVM_L2DepositedERC20 configured') }
  console.log('~'.repeat(description.length) + '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n')
}

// Approve
console.log('Approving L1 deposit contract...')
const approveTx = await L1_ERC20.approve(OVM_L1ERC20Gateway.address, 1)
console.log('Approved: ' + approveTx.hash)
await approveTx.wait()

// Deposit
console.log('Depositing into L1 deposit contract...')
const depositTx = await OVM_L1ERC20Gateway.deposit(1, {gasLimit: 1000000})
console.log('Deposited: ' + depositTx.hash)
await depositTx.wait()

await logBalances()

const [l1ToL2msgHash] = await watcher.getMessageHashesFromL1Tx(depositTx.hash)
console.log('got L1->L2 message hash', l1ToL2msgHash)
const l2Receipt = await watcher.getL2TransactionReceipt(l1ToL2msgHash)
console.log('completed Deposit! L2 tx hash:', l2Receipt.transactionHash)
  //_l2CrossDomainMessenger, _decimals, _name, _symbol
  //_l1ERC20,_l2DepositedERC20,_l1messenger
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });