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
  const tokenPath = path.join(__dirname, "deployed_address.txt");
  const claimPath = path.join(__dirname, "claim_contract_address.txt");
  const claimDataPath = path.join(__dirname, args.data || "claim-data.json");

  const tokenAddress = args.token || (fs.existsSync(tokenPath) ? fs.readFileSync(tokenPath, "utf8").trim() : "");
  const claimAddress = args.claim || (fs.existsSync(claimPath) ? fs.readFileSync(claimPath, "utf8").trim() : "");

  if (!tokenAddress) throw new Error("Missing token address.");
  if (!claimAddress) throw new Error("Missing claim contract address.");

  const token = await hre.ethers.getContractAt("Avenium", tokenAddress);

  let amountWei;
  if (args.amount) {
    amountWei = hre.ethers.parseUnits(String(args.amount), 18);
  } else {
    if (!fs.existsSync(claimDataPath)) {
      throw new Error("Pass --amount or create claim-data.json with totalAmountWei.");
    }
    const claimData = JSON.parse(fs.readFileSync(claimDataPath, "utf8"));
    amountWei = BigInt(claimData.totalAmountWei);
  }

  const tx = await token.transfer(claimAddress, amountWei);
  console.log(`Funding claim contract ${claimAddress} with ${amountWei.toString()} wei (${tx.hash})`);
  await tx.wait(1);
  console.log("Claim contract funded.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
