const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Kompilacja przed deploymentem, żeby mieć pewność, że artefakty są aktualne.
  await hre.run("compile");

  const Avenium = await hre.ethers.getContractFactory("Avenium");
  const avenium = await Avenium.deploy();

  await avenium.waitForDeployment();

  const address = await avenium.getAddress();
  console.log("Avenium deployed to:", address);

  // Zapis adresu do pliku tekstowego w tym samym folderze.
  const outPath = path.join(__dirname, "deployed_address.txt");
  fs.writeFileSync(outPath, `${address}\n`, "utf8");
  console.log(`Saved deployed address to: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
