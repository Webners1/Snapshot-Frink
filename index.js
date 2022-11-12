#!/usr/bin/env node

import "dotenv/config";
import { createBalances } from "./lib/balances.js";
import { getEvents } from "./lib/scan-import-events.js";
import conf from './config.json' assert {type: 'json'};
import mysql2 from 'mysql2/promise';
import { addType } from "./lib/address-type.js";
import { checkConfig, getConfig } from "./lib/config.js";
import Web3 from 'web3';

//<------------------------------------------------------------------------------------------------------
//CONNECT TO MYSQL IN PROMISE MODE
const conn = await mysql2.createConnection({
	host: conf?.sqlhost,
	user: conf?.sqluser,
	password: conf?.sqlpass,
	database: conf?.sqldb
});
await conn.connect(function(err) {
if (err) throw err;
	console.log("mySQL Connected!");
});
//<------------------------------------------------------------------------------------------------------
//MYSQL FUNCTIONS
//<------------------------------------------------------------------------------------------------------
//query funcitions
async function queryDailyTable() {
  
	let queryresult = [];

	const [rows, fields] = await conn.execute('SELECT wallet FROM `daily_table`', ['wallet']);
	//const [rows, fields] = await conn.execute('SELECT wallet FROM `test_daily_table`', ['wallet']);
	queryresult = rows;

	return queryresult;
}
async function queryWeeklyTable() {
  
	let queryresult = [];

	const [rows, fields] = await conn.execute('SELECT wallet FROM `weekly_table`', ['wallet']);
	//const [rows, fields] = await conn.execute('SELECT wallet FROM `test_weekly_table`', ['wallet']);
	queryresult = rows;

	return queryresult;
}
//empty functions
async function emptyDailyTable() {

	try {
		await conn.execute("DELETE FROM `daily_table`")
		//await conn.execute("DELETE FROM `test_daily_table`")
	  } catch(e) {
		console.log('emptyDailyTable error:');
		console.log(e);
	  }

	return;
}
async function emptyWeeklyTable() {

	try {
		await conn.execute("DELETE FROM `weekly_table`")
		//await conn.execute("DELETE FROM `test_weekly_table`")
	  } catch(e) {
		console.log('emptyWeeklyTable error:');
		console.log(e);
	  }

	return;
}
//insert functions
async function insertIntoDailyTable(wallet) {

	try {
		await conn.query("INSERT INTO `daily_table` (`wallet`) VALUES ?", [wallet])
		//await conn.query("INSERT INTO `test_daily_table` (`wallet`) VALUES ?", [wallet])
	  } catch(e) {
		console.log('insertIntoDailyTable error:');
		console.log(e);
	  }

	return;
}
async function insertIntoWeeklyTable(wallet) {

	try {
		await conn.query("INSERT INTO `weekly_table` (`wallet`) VALUES ?", [wallet])
		//await conn.query("INSERT INTO `test_weekly_table` (`wallet`) VALUES ?", [wallet])
	  } catch(e) {
		console.log('insertIntoWeeklyTable error:');
		console.log(e);
	  }

	return;
}
async function insertIntoDailyArchive(wallet, date, amount, tx) {

	try {
		var sql = "INSERT INTO dailywinner_archive (wallet, date, amount, tx) VALUES ('"+wallet+"', '"+date+"', '"+amount+"', '"+tx+"')";
		//var sql = "INSERT INTO test_dailywinner_archive (wallet, date, amount, tx) VALUES ('"+wallet+"', '"+date+"', '"+amount+"', '"+tx+"')";
		await conn.execute(sql);
	  } catch(e) {
		console.log('insertIntoDailyArchive error:');
		console.log(e);
	  }

	return;
}
async function insertIntoWeeklyArchive(wallet, date, amount, tx) {

	try {
		var sql = "INSERT INTO weeklywinner_archive (wallet, date, amount, tx) VALUES ('"+wallet+"', '"+date+"', '"+amount+"', '"+tx+"')";
		//var sql = "INSERT INTO test_weeklywinner_archive (wallet, date, amount, tx) VALUES ('"+wallet+"', '"+date+"', '"+amount+"', '"+tx+"')";
		await conn.execute(sql);
	  } catch(e) {
		console.log('insertIntoWeeklyArchive error:');
		console.log(e);
	  }

	return;
}
//<------------------------------------------------------------------------------------------------------
//ABI
//<------------------------------------------------------------------------------------------------------
let LotteryAbiWeekly=[
	{
		"inputs": [],
		"name": "acceptOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_USDTAddress",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "onLotteryEnd",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "winner",
				"type": "address"
			}
		],
		"name": "pickDailyLotteryWinner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_newManager",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "tokenAddr",
				"type": "address"
			}
		],
		"name": "WithdrawToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getLastWinner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lastWinner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "manager",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "newManager",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "USDCToken",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "winnerDetails",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "winners",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
let tokenAbi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name_",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "symbol_",
				"type": "string"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "subtractedValue",
				"type": "uint256"
			}
		],
		"name": "decreaseAllowance",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "addedValue",
				"type": "uint256"
			}
		],
		"name": "increaseAllowance",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
//<------------------------------------------------------------------------------------------------------
//FUNCTIONS
//<------------------------------------------------------------------------------------------------------
const DailyLottery = async(winner)=>{
	let PUBLIC_KEY= conf?.AutomationWallet;
	let PRIVATE_KEY= conf?.AutomationWalletPK;
	const contractAddress = conf?.DailyLotteryAddress;

	var web3 = new Web3(new Web3.providers.HttpProvider(conf?.Web3HTTPProvider));
	let hashTx='';
	const LOTTERY_CONTRACT = await new web3.eth.Contract(LotteryAbiWeekly, contractAddress);
	let nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest'); // get latest nonce
	let gasEstimate = await LOTTERY_CONTRACT.methods.pickDailyLotteryWinner(winner).estimateGas({from:PUBLIC_KEY}); // estimate gas
	
	console.log("running...");
	// Create the transaction

	let tx = {
		'from': PUBLIC_KEY,
		'to': contractAddress,
		'nonce': nonce,
		'gas': gasEstimate,
		'data': LOTTERY_CONTRACT.methods.pickDailyLotteryWinner(winner).encodeABI()
	};
	// Sign the transaction
	let signPromise = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);

	await web3.eth.sendSignedTransaction(signPromise.rawTransaction, function(err, hash) {
		if (!err) {
			hashTx= hash
			console.log("The hash of daily winner transaction is: ", hash);
		} else {
			console.log("Something went wrong when submitting your transaction:", err)
		}
	})
	return hashTx;
}
//<------------------------------------------------------------------------------------------------------
//MAIN SCRIPT
//<------------------------------------------------------------------------------------------------------
const start = async () => {
	const startTime = new Date();
	const startTimeStr = startTime.toUTCString();
	console.log(`Starting run at ${startTimeStr}`);
	// Check if config file (in snapshot.config.json by default) exists. If not, show prompt
	// questions to create it.
	await checkConfig();
	const Config = getConfig();
	console.log({ Config });

	// Get all the events for the specified contract address
	// Format of `events` is [event1, event2, ...]
	const eventData = await getEvents();
	console.log("Calculating balances of %s (%s)...", eventData.name, eventData.symbol);
	
	// Calculate the current balances
	var balances = await createBalances(eventData);
	console.log("onchain holders:" + balances.length);
	const balanceArray = balances.map(address => [address])
	//console.log(balanceArray)

	//<------------------------------------------------------------------------------------------------------
	//DAILY
	//<------------------------------------------------------------------------------------------------------
	//GET DAILY DATA FROM DB
	let dailydbresult = [];
	dailydbresult = await queryDailyTable();
	let dailydbresultList = [];
	dailydbresult.map(address=> dailydbresultList.push(address.wallet));

	//COMPARE ONCHAIN TO DAILY TABLE AND FILTER
	const result = balances.filter(address => dailydbresultList.includes(address));
	console.log("daily filtered:"+result.length)
	
	//<------------------------------------------------------------------------------------------------------
	//WEEKLY
	//<------------------------------------------------------------------------------------------------------
	//GET WEEKLY DATA FROM DB
	let weeklydbresult = [];
	weeklydbresult = await queryWeeklyTable();
	let weeklydbresultList = [];
	weeklydbresult.map(address=> weeklydbresultList.push(address.wallet));

	//COMPARE ONCHAIN TO WEEKLY TABLE AND FILTER
	const weeklyresult = balances.filter(address => weeklydbresultList.includes(address));
	console.log("weekly filtered:"+weeklyresult.length)

	//<------------------------------------------------------------------------------------------------------

	//????
	// Updated WeeklyList
	const updatedWeekyList = weeklyresult.map(address=> [address])
	//

	let winner
	//DAILY DRAWING
	
	while (winner == "0x71771E820a9414b5f415b7f14D51701502C1F753" ||winner == "0x6E3Bf4F8e7A0F1B80801b77f1AEd9bD793BF227c" ||winner == "0x0b44e1001e40d3a9e25bcd5537128d77c569eaa3" || winner == "0xF1BC72cC7b8c9B711b46d2D1A2cE131c5F167772") {
		const randomNumber =  Math.floor(Math.random() * result.length -1);
	 winner = result[randomNumber];//[0]
	console.log("daily winner:"+winner);
		// code block to be executed
	  }  
	const randomNumber =  Math.floor(Math.random() * result.length -1);
	 winner = result[randomNumber];//[0]

	console.log("daily winner:"+winner);
	
	//SETUP VARS
	var web3 = new Web3(new Web3.providers.HttpProvider(conf?.Web3HTTPProvider));
	const contractAddress = conf?.USDCAddress;
	let dailyLottery = conf?.DailyLotteryAddress;
	const TOKEN_CONTRACT = new web3.eth.Contract(tokenAbi, contractAddress);

	//FETCH DAILY LOTTERY BALANCE
	const dailywinnerBalance= ((await TOKEN_CONTRACT.methods.balanceOf(dailyLottery).call())/1000000).toString()
	console.log("daily winning amount:"+dailywinnerBalance)

	//PAYOUT WINNER
	//<------------------------------------------------------------------------------------------------------
	//COMMENTED TO HAVE IT NOT LIVE! REMOVE COMMENTS BELOW TO DO IT LIVE
	//<------------------------------------------------------------------------------------------------------
	//const Txhash = await DailyLottery(winner)
	//<------------------------------------------------------------------------------------------------------
	//COMMENTED TO HAVE IT NOT LIVE! REMOVE COMMENTS ABOVE TO DO IT LIVE
	//<------------------------------------------------------------------------------------------------------

	//???
	console.log("Found total of", result.length, "holders.");
	if (eventData.loadMode.mode == "INCREMENTAL-LOAD") {
		console.log("Found", eventData.newAddresses.size, "addresses to insert/update in the INCREMENTAL LOAD.");
	}
	//??
	if (Config.checkIfContract) {
		balances = await addType(balances);
	}
	// Write data to Hasura
	console.log("\nAll finished!");

	//WIPE DAILY TABLE
	await emptyDailyTable();

	//WRITE BALANCES INTO DAILY TABLE
	await insertIntoDailyTable(balanceArray);

	//WIPE WEEKLY TABLE
	await emptyWeeklyTable();

	//WRITE BALANCES IN WEEKLY TABLE
	await insertIntoWeeklyTable(updatedWeekyList); 

	//WRITE WINNER INTO ARCHIVE
	var winnerDate = (new Date()).toISOString().split('T')[0];
	console.log(winnerDate);
	//const Txhash = "0x0000000000WINNER" //USE FOR TESTRUNS
	await insertIntoDailyArchive(winner, winnerDate, dailywinnerBalance, Txhash);
	
	//CLOSE THE CMD
	process.exit(0);
};
//<------------------------------------------------------------------------------------------------------
//ERROR HANDLING
//<------------------------------------------------------------------------------------------------------
(async () => {
	try {
		await start();
	} catch (e) {
		console.error(e);
	}
})();