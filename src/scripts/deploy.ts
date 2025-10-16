import hre from 'hardhat';

async function main() {
  // Use any-cast to avoid typing issues during the Next build step.
  const _hre: any = hre;
  const ethers = _hre.ethers as any;

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Deploy implementation
  const MarketImpl = await ethers.getContractFactory("ProhesisPredictionMarket");
  const marketImpl = await MarketImpl.deploy(deployer.address);
  await marketImpl.deployed();
  console.log("Market Implementation deployed to:", marketImpl.address);

  // Deploy factory
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
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
