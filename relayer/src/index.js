import { ethers } from "ethers";

const POLYGON_RPC = "https://polygon-bor-rpc.publicnode.com";
const AVENIUM_ADDRESS = "0x8699F4A5B4AC0dFf18844DcE951154E4f2E1C326";
const MIN_POL_BALANCE = 0.001;

const AVENIUM_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function executeTransfer(address from, address to, uint256 amount, uint256 nonce, bytes signature) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function nonces(address account) external view returns (uint256)"
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    try {
      if (path === "/status" && request.method === "GET") {
        return await handleStatus(request, env);
      }

      if (path === "/transfer" && request.method === "POST") {
        return await handleTransfer(request, env);
      }

      return json({ error: "Not found" }, 404);
    } catch (error) {
      return json({ error: error.message || "Internal error" }, 400);
    }
  }
};

async function handleStatus(request, env) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address || !ethers.isAddress(address)) {
    return json({ error: "Invalid address" }, 400);
  }

  const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
  const polBalance = await provider.getBalance(address);

  return json({
    address,
    polBalance: ethers.formatEther(polBalance),
    canRelay: parseFloat(ethers.formatEther(polBalance)) > MIN_POL_BALANCE,
    minPolBalance: MIN_POL_BALANCE
  });
}

async function handleTransfer(request, env) {
  const body = await request.json();
  const { from, to, amount, nonce, signature } = body;

  if (!from || !to || !amount || !signature) {
    return json({ error: "Missing required fields" }, 400);
  }

  if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
    return json({ error: "Invalid address" }, 400);
  }

  const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
  const relayerWallet = new ethers.Wallet(env.PRIVATE_KEY, provider);

  // Check relayer (owner) POL balance
  const relayerBalance = await provider.getBalance(relayerWallet.address);
  const balanceInPOL = parseFloat(ethers.formatEther(relayerBalance));

  if (balanceInPOL <= MIN_POL_BALANCE) {
    return json({
      error: "Insufficient POL balance on relayer account. User must send transaction directly.",
      relayerBalance: balanceInPOL.toString(),
      minRequired: MIN_POL_BALANCE,
      action: "send_direct"
    }, 402);
  }

  // Relayer has POL, relay the transaction
  const avenium = new ethers.Contract(AVENIUM_ADDRESS, AVENIUM_ABI, relayerWallet);
  const amountWei = ethers.parseUnits(amount, 18);
  const nonceValue = nonce !== undefined ? nonce : await avenium.nonces(from);

  const tx = await avenium.executeTransfer(from, to, amountWei, nonceValue, signature);
  const receipt = await tx.wait();

  return json({
    success: true,
    txHash: receipt.hash,
    from,
    to,
    amount,
    gasPaidBy: "relayer"
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
