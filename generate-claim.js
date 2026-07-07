const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function compareBytes32(a, b) {
  return Buffer.compare(Buffer.from(a.slice(2), "hex"), Buffer.from(b.slice(2), "hex"));
}

function hashLeaf(address, amount) {
  return hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [address, amount])
  );
}

function hashPair(a, b) {
  const [left, right] = compareBytes32(a, b) <= 0 ? [a, b] : [b, a];
  return hre.ethers.keccak256(hre.ethers.concat([left, right]));
}

function parseRecipients(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.toLowerCase() !== "address,amount")
    .map((line, index) => {
      const [address, amount, ...rest] = line.split(",").map((part) => part.trim());
      if (rest.length > 0 || !address || !amount) {
        throw new Error(`Invalid CSV line ${index + 1}: expected address,amount`);
      }
      if (!hre.ethers.isAddress(address)) {
        throw new Error(`Invalid address at line ${index + 1}: ${address}`);
      }
      return { address, amount };
    });
}

function buildTree(leaves) {
  const levels = [leaves.slice()];
  while (levels[levels.length - 1].length > 1) {
    const current = levels[levels.length - 1];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = current[i + 1] || current[i];
      next.push(hashPair(left, right));
    }
    levels.push(next);
  }
  return levels;
}

function getProof(levels, index) {
  const proof = [];
  let position = index;
  for (let level = 0; level < levels.length - 1; level += 1) {
    const nodes = levels[level];
    const isRightNode = position % 2 === 1;
    const siblingIndex = isRightNode ? position - 1 : position + 1;
    const sibling = nodes[siblingIndex] || nodes[position];
    proof.push(sibling);
    position = Math.floor(position / 2);
  }
  return proof;
}

function main() {
  const inputFile = process.argv[2] || "claim-recipients.example.csv";
  const outFile = process.argv[3] || "claim-data.json";
  const decimals = 18;

  const inputPath = path.isAbsolute(inputFile) ? inputFile : path.join(__dirname, inputFile);
  const outputPath = path.isAbsolute(outFile) ? outFile : path.join(__dirname, outFile);

  const recipients = parseRecipients(inputPath).map((recipient) => ({
    address: recipient.address,
    amount: recipient.amount,
    amountWei: hre.ethers.parseUnits(String(recipient.amount), decimals).toString(),
  }));

  if (recipients.length === 0) {
    throw new Error("No recipients found.");
  }

  const leaves = recipients.map((recipient) => hashLeaf(recipient.address, recipient.amountWei));
  const levels = buildTree(leaves);
  const root = levels[levels.length - 1][0];

  const enriched = recipients.map((recipient, index) => ({
    ...recipient,
    leaf: leaves[index],
    proof: getProof(levels, index),
  }));

  const totalAmountWei = enriched.reduce((sum, recipient) => sum + BigInt(recipient.amountWei), 0n).toString();

  const output = {
    root,
    totalAmountWei,
    decimals,
    recipients: enriched,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Wrote ${outputPath}`);
  console.log(`Merkle root: ${root}`);
  console.log(`Total amount wei: ${totalAmountWei}`);
}

main();
