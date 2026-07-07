# Avenium (AVEN)

<p align="center">
  <img src="./logo.svg" alt="Avenium logo" width="260" />
</p>

Hardhat project for deploying Avenium, a fixed-supply ERC-20 token on Polygon.

Use `POL` for gas on Polygon.

## Token properties
- Name: `Avenium`
- Symbol: `AVEN`
- Chain: `Polygon`
- Decimals: `18`
- Supply: `21,000,000 AVEN`
- Transfer fee: `0.5%`
- Fee recipient: `0x2eb17e0C5E8e5b4fD85768695E2aC37927A84270`

## Gas rule
- If the owner wallet has `POL`, owner pays gas and sends directly.
- If the owner wallet has no `POL`, users pay gas in the normal Polygon flow.
- The claim flow is the user-paid fallback.

## Use cases
- `deploy.js` — deploy Avenium and save the contract address
- `airdrop.js` — send AVEN to many wallets from a CSV or JSON file
- `deploy-claim.js` — deploy a user-paid Merkle claim contract
- `generate-claim.js` — build Merkle root and proofs from CSV
- `fund-claim.js` — fund the claim contract with AVEN
- `token-metadata.json` — template for explorers and token lists
- `BINANCE.md` — checklist for exchange listing prep
- `EXODUS.md` — notes for wallet visibility and manual adding
- `CLAIM.md` — user-paid claim flow

## Files
- `contracts/Avenium.sol` — token contract
- `hardhat.config.js` — Hardhat config for Polygon Mainnet and Amoy
- `deploy.js` — deployment script that writes `deployed_address.txt`
- `package.json` — npm scripts
- `.env.example` — environment template

## Airdrop
```bash
npm run airdrop:polygon -- --file airdrop-recipients.example.csv
```

Edit `airdrop-recipients.example.csv` with recipient addresses and token amounts.

## User-paid claim
```bash
npm run claim:generate -- claim-recipients.example.csv
npm run claim:deploy:polygon
npm run claim:fund:polygon
```

Each recipient can then claim with their own wallet and pay gas themselves.

## Quick start
```bash
cd /home/jurek/Documents/Crypto
cp .env.example .env
npm install
npm run compile
npm run deploy:polygon
```
