import hre from 'hardhat';

async function main() {
  const _hre: any = hre;
  const ethers = _hre.ethers as any;

  const [deployer] = await ethers.getSigners();
  const deployerAddress = typeof deployer.getAddress === 'function' ? await deployer.getAddress() : deployer.address;
  console.log("Deploying contracts with:", deployerAddress);

  // Deploy MarketFactory with protocol fee params
  const feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT || deployerAddress;
  const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 100); // 1%
  const minBet = BigInt(process.env.MIN_BET_WEI || 0);

  const Factory = await ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy(feeRecipient, feeBps, minBet);
  if (typeof factory.waitForDeployment === 'function') {
    await factory.waitForDeployment();
  } else if (typeof factory.deployed === 'function') {
    await factory.deployed();
  }
  const factoryAddr = typeof factory.getAddress === 'function' ? await factory.getAddress() : factory.address;
  console.log("MarketFactory deployed to:", factoryAddr);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
