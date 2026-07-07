const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

async function main() {
  await hre.run("compile");

  const args = parseArgs(process.argv);
  const deployedTokenPath = path.join(__dirname, "deployed_address.txt");
  const claimDataPath = path.join(__dirname, args.data || "claim-data.json");

  const tokenAddress = args.token || (fs.existsSync(deployedTokenPath) ? fs.readFileSync(deployedTokenPath, "utf8").trim() : "");
  if (!tokenAddress) {
    throw new Error("Missing token address. Pass --token or deploy Avenium first.");
  }

  if (!fs.existsSync(claimDataPath)) {
    throw new Error(`Missing claim data file: ${claimDataPath}`);
  }

  const claimData = JSON.parse(fs.readFileSync(claimDataPath, "utf8"));
  const root = args.root || claimData.root;

  if (!root) {
    throw new Error("Missing Merkle root. Pass --root or create claim-data.json.");
  }

  const Claim = await hre.ethers.getContractFactory("AveniumClaim");
  const claim = await Claim.deploy(tokenAddress, root);

  await claim.waitForDeployment();

  const address = await claim.getAddress();
  const outPath = path.join(__dirname, "claim_contract_address.txt");
  fs.writeFileSync(outPath, `${address}\n`, "utf8");

  console.log("AveniumClaim deployed to:", address);
  console.log(`Saved claim contract address to: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
