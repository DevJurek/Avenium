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

function readRecipients(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];

  if (filePath.endsWith(".json")) {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error("JSON file must contain an array of recipients.");
    }
    return data.map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        throw new Error(`Invalid JSON entry at index ${index}.`);
      }
      return {
        address: entry.address,
        amount: entry.amount,
      };
    });
  }

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.toLowerCase() !== "address,amount")
    .map((line, index) => {
      const [address, amount, ...rest] = line.split(",").map((part) => part.trim());
      if (rest.length > 0 || !address || !amount) {
        throw new Error(`Invalid CSV line ${index + 1}: expected address,amount`);
      }
      return { address, amount };
    });
}

async function main() {
  await hre.run("compile");

  const args = parseArgs(process.argv);
  const fileName = args.file || "airdrop-recipients.example.csv";
  const rawFilePath = path.isAbsolute(fileName) ? fileName : path.join(__dirname, fileName);
  const deployedAddressPath = path.join(__dirname, "deployed_address.txt");
  const tokenAddress = args.token || (fs.existsSync(deployedAddressPath) ? fs.readFileSync(deployedAddressPath, "utf8").trim() : "");
  const decimals = Number(args.decimals || 18);
  const dryRun = Boolean(args["dry-run"]);

  if (!tokenAddress) {
    throw new Error("Missing token address. Pass --token or create deployed_address.txt.");
  }

  const recipients = readRecipients(rawFilePath);
  if (recipients.length === 0) {
    throw new Error("No recipients found.");
  }

  const [signer] = await hre.ethers.getSigners();
  const sender = await signer.getAddress();
  const token = await hre.ethers.getContractAt("Avenium", tokenAddress, signer);

  let total = 0n;
  const parsedRecipients = recipients.map((recipient) => {
    if (!hre.ethers.isAddress(recipient.address)) {
      throw new Error(`Invalid address: ${recipient.address}`);
    }
    const amount = hre.ethers.parseUnits(String(recipient.amount), decimals);
    total += amount;
    return { address: recipient.address, amount };
  });

  const balance = await token.balanceOf(sender);
  if (balance < total) {
    throw new Error(`Insufficient AVEN balance. Need ${total.toString()} wei, have ${balance.toString()} wei.`);
  }

  console.log(`Token: ${tokenAddress}`);
  console.log(`Sender: ${sender}`);
  console.log(`Recipients: ${parsedRecipients.length}`);
  console.log(`Total to send: ${hre.ethers.formatUnits(total, decimals)} AVEN`);

  if (dryRun) {
    console.log("Dry run enabled, no transfers sent.");
    return;
  }

  for (const recipient of parsedRecipients) {
    const tx = await token.transfer(recipient.address, recipient.amount);
    console.log(`Sent ${hre.ethers.formatUnits(recipient.amount, decimals)} AVEN to ${recipient.address} (${tx.hash})`);
    await tx.wait(1);
  }

  console.log("Airdrop completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
