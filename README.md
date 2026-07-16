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
- DEX pair fee: `0%` after the QuickSwap pair is added to the exemption list
- Fee recipient: `0x2eb17e0C5E8e5b4fD85768695E2aC37927A84270`
- Current DEX-fee-exempt deployment: `0x49008b4866C3dc41F3Ea7459a3BCaDe77cdd95E9`

## Gas rule
- The sender pays 100% of the gas in POL through the standard MetaMask `Send` flow.
- The relayer does not submit or sponsor AVEN transfers.
- The sender needs enough AVEN to cover the requested amount, including the 0.5% transfer fee, and enough POL for gas.

## Direct transfer app
```bash
npm run app:serve
```

Open [http://localhost:8080](http://localhost:8080) in a browser with MetaMask. The application submits the normal `transfer()` transaction from the connected wallet, so MetaMask displays and charges the full gas cost.

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
- `contracts/AveniumDexFeeExempt.sol` — token contract with configurable DEX-pair fee exemption
- `hardhat.config.js` — Hardhat config for Polygon Mainnet and Amoy
- `deploy.js` — deployment script that writes `deployed_address.txt`
- `deploy-dex-fee-exempt.js` — deployment script for the DEX-fee-exempt token
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
