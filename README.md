# Skybit (SKY)

Hardhat project for deploying Skybit, a fixed-supply ERC-20 token on Polygon.

## Files
- `Skybit.sol` — token contract
- `hardhat.config.js` — Hardhat config for Polygon Mainnet and Amoy
- `deploy.js` — deployment script that writes `deployed_address.txt`
- `package.json` — npm scripts
- `.env.example` — environment template

## Quick start
```bash
cd /home/jurek/Documents/Crypto
cp .env.example .env
npm install
npm run compile
npm run deploy:amoy
```
