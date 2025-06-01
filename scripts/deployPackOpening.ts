import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying PackOpening contract with the account:', deployer.address);

  const deployment = await ethers.deployContract('PackOpening');

  console.log('PackOpening address:', await deployment.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 