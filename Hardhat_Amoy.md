# Hardhat + Polygon (Polygon Mainnet i Amoy)

## 1) Instalacja Hardhata w tym folderze

W katalogu projektu:

```bash
cd /home/jurek/Documents/Crypto
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
```

## 2) Zmienne środowiskowe

Utwórz plik `.env` w `/home/jurek/Documents/Crypto`:

```bash
PRIVATE_KEY=0x_tutaj_wklej_prywatny_klucz_portfela
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

Uwaga: `PRIVATE_KEY` powinien należeć do portfela, który ma dostać całą podaż AVEN przy deployu.

## 3) Kompilacja

```bash
npx hardhat compile
```

## 4) Deploy na Polygon Amoy

Najpierw upewnij się, że masz trochę testowego POL na gas.

```bash
npx hardhat run deploy.js --network amoy
```

Skrypt sam wykona kompilację i wdroży kontrakt `Avenium`.

## 5) Deploy na Polygon Mainnet

Gdy będziesz gotowy:

```bash
npx hardhat run deploy.js --network polygon
```

## 6) Co robi konfiguracja

- `polygon` = Polygon Mainnet, chainId `137`
- `amoy` = Polygon Amoy, chainId `80002`
- `sources: "./contracts"` pozwala kompilować `Avenium.sol` w standardowym katalogu Hardhat
