const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  await hre.run("compile");

  const Token = await hre.ethers.getContractFactory("AveniumDexFeeExempt");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const address = await token.getAddress();
  const outPath = path.join(__dirname, "deployed_dex_fee_exempt_address.txt");
  fs.writeFileSync(outPath, `${address}\n`, "utf8");

  console.log("AveniumDexFeeExempt deployed to:", address);
  console.log(`Saved deployed address to: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
