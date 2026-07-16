import { BrowserProvider, Contract, ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.15.0/+esm";

const CHAIN_ID = 137n;
const CONTRACT_ADDRESS = "0x49008b4866C3dc41F3Ea7459a3BCaDe77cdd95E9";
const ABI = ["function transfer(address to, uint256 amount) external returns (bool)"];

const connectButton = document.querySelector("#connect-wallet");
const form = document.querySelector("#transfer-form");
const recipientInput = document.querySelector("#recipient");
const amountInput = document.querySelector("#amount");
const submitButton = document.querySelector("#submit-transfer");
const status = document.querySelector("#form-status");
const feeSummary = document.querySelector("#fee-summary");
const result = document.querySelector("#transaction-result");
const transactionLink = document.querySelector("#transaction-link");

let provider;
let signer;
let account;

function setStatus(message, type = "") {
  status.textContent = message;
  status.dataset.type = type;
}

function abbreviatedAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function ensurePolygon() {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (BigInt(chainId) !== CHAIN_ID) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x89" }]
    });
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("Zainstaluj MetaMask, aby podpisac transfer.", "error");
    return;
  }

  try {
    await ensurePolygon();
    provider = new BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    connectButton.textContent = abbreviatedAddress(account);
    submitButton.disabled = false;
    setStatus("Portfel polaczony. MetaMask pokaze koszt gasu w POL.", "success");
  } catch (error) {
    setStatus(error.shortMessage || error.message || "Nie udalo sie polaczyc portfela.", "error");
  }
}

function updateFeeSummary() {
  try {
    const amount = ethers.parseUnits(amountInput.value || "0", 18);
    if (amount <= 0n) throw new Error();
    const fee = (amount * 50n) / 10_000n;
    const received = amount - fee;
    feeSummary.textContent = `Odbiorca: ${ethers.formatUnits(received, 18)} AVEN`;
  } catch {
    feeSummary.textContent = "Podaj prawidlowa kwote";
  }
}

async function submitTransfer(event) {
  event.preventDefault();
  result.hidden = true;

  if (!signer || !account) {
    await connectWallet();
    return;
  }

  const to = recipientInput.value.trim();
  if (!ethers.isAddress(to)) {
    setStatus("Podaj prawidlowy adres odbiorcy.", "error");
    return;
  }

  let amount;
  try {
    amount = ethers.parseUnits(amountInput.value.trim(), 18);
    if (amount <= 0n) throw new Error();
  } catch {
    setStatus("Podaj kwote AVEN wieksza od zera.", "error");
    return;
  }

  submitButton.disabled = true;
  try {
    await ensurePolygon();
    setStatus("Potwierdz transakcje w MetaMask. Gas zostanie pobrany w POL.");
    const token = new Contract(CONTRACT_ADDRESS, ABI, signer);
    const transaction = await token.transfer(to, amount);

    setStatus("Transakcja wyslana. Czekam na potwierdzenie Polygon...");
    await transaction.wait();
    transactionLink.href = `https://polygonscan.com/tx/${transaction.hash}`;
    transactionLink.textContent = `Zobacz transakcje: ${transaction.hash}`;
    result.hidden = false;
    setStatus("Transfer zostal wyslany. Gas w 100% oplacil Twoj portfel.", "success");
  } catch (error) {
    setStatus(error.shortMessage || error.message || "Transfer nie zostal wyslany.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

connectButton.addEventListener("click", connectWallet);
form.addEventListener("submit", submitTransfer);
amountInput.addEventListener("input", updateFeeSummary);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}
