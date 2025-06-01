import { ethers } from "hardhat";
import { PackOpening } from "../typechain-types";

async function main() {
  // Get the deployed contract address (you'll need to replace this with actual address)
  const [deployer] = await ethers.getSigners();
  const packOpening = await ethers.getContractAt("PackOpening", "REPLACE_WITH_DEPLOYED_ADDRESS") as PackOpening;
  
  try {
    // Get current round
    const currentRound = await packOpening.currentRound();
    console.log(`Current round: ${currentRound}`);
    
    // Get all pack opening records
    const allRecords = await packOpening.getAllPackOpenings();
    console.log(`\nTotal pack openings: ${allRecords.length}\n`);
    
    if (allRecords.length === 0) {
      console.log("No pack openings yet.");
      return;
    }
    
    // Display all records
    console.log("📦 Pack Opening History:");
    console.log("========================");
    
    for (let i = 0; i < allRecords.length; i++) {
      const record = allRecords[i];
      const date = new Date(Number(record.timestamp) * 1000);
      
      console.log(`Round ${record.round}:`);
      console.log(`  Player: ${record.player}`);
      console.log(`  Token ID Won: ${record.tokenId}`);
      console.log(`  Timestamp: ${date.toLocaleString()}`);
      console.log("  ---");
    }
    
    // Get records for a specific player (using deployer as example)
    console.log(`\n🎮 Pack openings for ${deployer.address}:`);
    const playerRecords = await packOpening.getPlayerPackOpenings(deployer.address);
    
    if (playerRecords.length === 0) {
      console.log("No pack openings for this player.");
    } else {
      for (let i = 0; i < playerRecords.length; i++) {
        const record = playerRecords[i];
        console.log(`  Round ${record.round}: Won Token ID ${record.tokenId}`);
      }
    }
    
    // Get contract info
    console.log(`\n💰 Contract Balance: ${ethers.formatEther(await packOpening.getContractBalance())} FLOW`);
    console.log(`📦 Available NFTs: ${await packOpening.getAvailableNFTCount()}`);
    
  } catch (error) {
    console.error("Error viewing pack records:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 