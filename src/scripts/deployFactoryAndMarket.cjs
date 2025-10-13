const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // ✅ Deploy MarketFactory (no arguments)
  const Factory = await hre.ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy(); // 👈 no params here
  await factory.deployed();
  console.log("Factory deployed at:", factory.address);

  // (Optional) create one initial market for testing
  const tx = await factory.createMarket(
    "Will ETH reach $5,000 by December 2025?",
    Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days from now
  );
  await tx.wait();
  console.log("✅ Example market created!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  });
