const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = typeof deployer.getAddress === 'function' ? await deployer.getAddress() : deployer.address;
  console.log("Deployer:", deployerAddress);

  // Deploy MarketFactory (with fee params)
  const feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT || deployerAddress;
  const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 100);
  const minBet = BigInt(process.env.MIN_BET_WEI || 0);

  const Factory = await hre.ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy(feeRecipient, feeBps, minBet);
  if (typeof factory.waitForDeployment === 'function') {
    await factory.waitForDeployment();
  } else if (typeof factory.deployed === 'function') {
    await factory.deployed();
  }
  const factoryAddr = typeof factory.getAddress === 'function' ? await factory.getAddress() : factory.address;
  console.log("Factory deployed at:", factoryAddr);

  // (Optional) create one initial market for testing
  const createTx = await factory.createMarket(
    "Will ETH reach $5,000 by December 2025?",
    Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days from now
  );
  if (typeof createTx.wait === 'function') {
    await createTx.wait();
  } else if (typeof hre.ethers.provider?.waitForTransaction === 'function') {
    await hre.ethers.provider.waitForTransaction(createTx.hash);
  }
  console.log("✅ Example market created!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  });
