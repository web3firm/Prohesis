const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy implementation
  const MarketImpl = await hre.ethers.getContractFactory("ProhesisPredictionMarket");
  const marketImpl = await MarketImpl.deploy(deployer.address);
  await marketImpl.deployed();
  console.log("Market Implementation deployed to:", marketImpl.address);

  // Deploy factory
  const MarketFactory = await hre.ethers.getContractFactory("MarketFactory");
  const factory = await MarketFactory.deploy(
    marketImpl.address,
    deployer.address, // feeReceiver
    250               // 2.5% fee
  );
  await factory.deployed();
  console.log("MarketFactory deployed to:", factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
