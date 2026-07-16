import { ethers } from "ethers";

const POLYGON_RPC = "https://polygon-bor-rpc.publicnode.com";
const MIN_POL_BALANCE = 0.001;

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

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
