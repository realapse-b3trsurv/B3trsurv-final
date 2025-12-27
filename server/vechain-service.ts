import Web3 from "web3";
import { thorify } from "thorify";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import solc from "solc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// VeChain RPC configuration
// For production, provide a stable RPC URL via VECHAIN_RPC secret
// For development, UNITY_DEPLOY_MODE=mock enables simulated deployment
const VECHAIN_RPC = process.env.VECHAIN_RPC || "https://rpc-testnet.vechain.energy";
const UNITY_DEPLOY_MODE = process.env.UNITY_DEPLOY_MODE || "mock"; // "mock" or "real"

// Initialize web3 with thorify for VeChain compatibility
const web3 = thorify(new Web3(VECHAIN_RPC)) as any;

// Export web3 instance for utility functions
export { web3 };

let account: any = null;
let unityContractAddress: string | null = null;
let unityContractABI: any = null;

// In-memory mock balance tracker for development mode
const mockBalances = new Map<string, string>();
let mockTotalSupply = "1000000000"; // 1 billion UNITY

/**
 * Initialize VeChain wallet from environment variable.
 * Unity features will be disabled if no key is set.
 */
export function initializeWallet() {
  const privateKey = process.env.VECHAIN_PRIVATE_KEY;
  
  if (!privateKey) {
    console.log("⚠️  No VECHAIN_PRIVATE_KEY found - Unity features disabled");
    console.log("ℹ️  Call POST /api/unity/generate-wallet (admin only) to create a wallet");
    return null;
  }
  
  // Use provided private key
  account = web3.eth.accounts.privateKeyToAccount("0x" + privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
  
  console.log("✅ VeChain wallet initialized:", account.address);
  return account.address;
}

/**
 * Generate a new VeChain wallet (admin-only operation).
 * Returns wallet details for secure storage.
 */
export function generateNewWallet(): { address: string; privateKey: string } {
  const newAccount = web3.eth.accounts.create();
  return {
    address: newAccount.address,
    privateKey: newAccount.privateKey.substring(2)
  };
}

/**
 * Get wallet address (returns null if wallet not initialized)
 */
export function getWalletAddress(): string | null {
  if (!account) {
    initializeWallet();
  }
  return account?.address || null;
}

/**
 * Compile Unity.sol contract
 */
function compileContract(): { abi: any; bytecode: string } {
  const contractPath = path.join(__dirname, "..", "contracts", "Unity.sol");
  const source = fs.readFileSync(contractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "Unity.sol": { content: source },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === "error");
    if (errors.length > 0) {
      throw new Error("Solidity compilation errors: " + JSON.stringify(errors));
    }
  }

  const contract = output.contracts["Unity.sol"]["UnityToken"];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
  };
}

/**
 * Deploy Unity token contract to VeChain testnet
 * Supports both real blockchain deployment and mock mode for development
 */
export async function deployUnityContract(
  name: string = "Unity",
  symbol: string = "UNITY",
  initialSupply: string = "1000000000"
): Promise<{ address: string; abi: any; mode: string }> {
  if (!account) {
    initializeWallet();
  }

  console.log("📦 Compiling Unity contract...");
  const { abi, bytecode } = compileContract();

  let address: string;
  const mode = UNITY_DEPLOY_MODE;

  if (mode === "mock") {
    // Mock deployment for development/testing
    console.log("🧪 Mock deployment mode - generating simulated contract address");
    address = `0x${web3.utils.randomHex(20).substring(2)}`;
    console.log("✅ Unity contract (MOCK) deployed at:", address);
  } else {
    // Real VeChain deployment
    const totalSupply = BigInt(initialSupply) * BigInt(10 ** 18);

    console.log("🚀 Deploying Unity contract to VeChain...");
    const contract = new web3.eth.Contract(abi);
    
    const deployTx = contract.deploy({
      data: "0x" + bytecode,
      arguments: [name, symbol, totalSupply.toString()],
    });

    const gas = await deployTx.estimateGas({ from: account.address });
    const deployed = await deployTx.send({
      from: account.address,
      gas: gas + 50000,
    });

    address = deployed.options.address;
    console.log("✅ Unity contract deployed at:", address);
  }

  // Save ABI and address for future use
  const buildDir = path.join(__dirname, "..", "build");
  await fs.ensureDir(buildDir);
  await fs.writeJson(
    path.join(buildDir, "Unity.json"),
    { abi, address, mode },
    { spaces: 2 }
  );

  unityContractAddress = address;
  unityContractABI = abi;

  return { address, abi, mode };
}

/**
 * Load deployed Unity contract
 */
export async function loadUnityContract(): Promise<{ address: string; abi: any } | null> {
  const buildPath = path.join(__dirname, "..", "build", "Unity.json");
  
  if (await fs.pathExists(buildPath)) {
    const data = await fs.readJson(buildPath);
    unityContractAddress = data.address;
    unityContractABI = data.abi;
    return data;
  }
  
  return null;
}

/**
 * Get Unity contract instance
 */
export function getUnityContract() {
  if (!unityContractAddress || !unityContractABI) {
    throw new Error("Unity contract not deployed. Run deployment first.");
  }
  
  if (!account) {
    initializeWallet();
  }
  
  return new web3.eth.Contract(unityContractABI, unityContractAddress, {
    from: account.address,
  });
}

/**
 * Mint Unity tokens
 * In mock mode, returns a simulated transaction hash
 */
export async function mintUnityTokens(
  toAddress: string,
  amount: string
): Promise<string> {
  const mode = UNITY_DEPLOY_MODE;
  
  if (mode === "mock") {
    // Mock mint - update in-memory balance, total supply, and return simulated transaction hash
    const currentBalance = mockBalances.get(toAddress) || "0";
    const newBalance = (parseFloat(currentBalance) + parseFloat(amount)).toString();
    mockBalances.set(toAddress, newBalance);
    
    // Update total supply
    mockTotalSupply = (parseFloat(mockTotalSupply) + parseFloat(amount)).toString();
    
    const mockTxHash = `0x${web3.utils.randomHex(32).substring(2)}`;
    console.log(`🧪 Mock mint: ${amount} UNITY to ${toAddress} (balance: ${newBalance}, supply: ${mockTotalSupply}, tx: ${mockTxHash})`);
    return mockTxHash;
  }
  
  // Real blockchain mint
  const contract = getUnityContract();
  const amountWei = web3.utils.toWei(amount, "ether");
  
  const tx = await contract.methods.mint(toAddress, amountWei).send({
    from: account.address,
    gas: 500000,
  });
  
  return tx.transactionHash;
}

/**
 * Burn Unity tokens
 * In mock mode, returns a simulated transaction hash
 */
export async function burnUnityTokens(
  fromAddress: string,
  amount: string
): Promise<string> {
  const mode = UNITY_DEPLOY_MODE;
  
  if (mode === "mock") {
    // Mock burn - validate and update in-memory balance, total supply
    const currentBalance = mockBalances.get(fromAddress) || "0";
    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(currentBalance);
    
    // Enforce balance check - mimic real blockchain behavior
    if (balanceNum < amountNum) {
      throw new Error(`Insufficient balance to burn: ${fromAddress} has ${currentBalance} UNITY but tried to burn ${amount} UNITY`);
    }
    
    const newBalance = (balanceNum - amountNum).toString();
    mockBalances.set(fromAddress, newBalance);
    
    // Update total supply (decrease)
    const newSupply = (parseFloat(mockTotalSupply) - amountNum).toString();
    mockTotalSupply = newSupply;
    
    const mockTxHash = `0x${web3.utils.randomHex(32).substring(2)}`;
    console.log(`🧪 Mock burn: ${amount} UNITY from ${fromAddress} (balance: ${newBalance}, supply: ${mockTotalSupply}, tx: ${mockTxHash})`);
    return mockTxHash;
  }
  
  // Real blockchain burn
  const contract = getUnityContract();
  const amountWei = web3.utils.toWei(amount, "ether");
  
  const tx = await contract.methods.burn(fromAddress, amountWei).send({
    from: account.address,
    gas: 500000,
  });
  
  return tx.transactionHash;
}

/**
 * Transfer Unity tokens from admin wallet
 * In mock mode, returns a simulated transaction hash and updates balances
 */
export async function transferUnityTokens(
  toAddress: string,
  amount: string,
  fromAddress?: string
): Promise<string> {
  const mode = UNITY_DEPLOY_MODE;
  
  if (mode === "mock") {
    // Mock transfer - validate and update sender/receiver balances
    // Use provided fromAddress, or account address, or default to a mock admin address
    const sender = fromAddress || account?.address || "0xMOCK_ADMIN";
    
    const fromBalance = mockBalances.get(sender) || "0";
    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(fromBalance);
    
    // Enforce balance check - mimic real blockchain behavior
    if (balanceNum < amountNum) {
      throw new Error(`Insufficient balance: ${sender} has ${fromBalance} UNITY but tried to transfer ${amount} UNITY`);
    }
    
    const toBalance = mockBalances.get(toAddress) || "0";
    
    const newFromBalance = (balanceNum - amountNum).toString();
    const newToBalance = (parseFloat(toBalance) + amountNum).toString();
    
    mockBalances.set(sender, newFromBalance);
    mockBalances.set(toAddress, newToBalance);
    
    const mockTxHash = `0x${web3.utils.randomHex(32).substring(2)}`;
    console.log(`🧪 Mock transfer: ${amount} UNITY from ${sender} (balance: ${newFromBalance}) to ${toAddress} (balance: ${newToBalance}) - tx: ${mockTxHash}`);
    return mockTxHash;
  }
  
  // Real blockchain transfer - must have account initialized
  if (!account) {
    throw new Error("VeChain wallet not initialized for real-mode transfer");
  }
  
  const contract = getUnityContract();
  const amountWei = web3.utils.toWei(amount, "ether");
  
  const tx = await contract.methods.transfer(toAddress, amountWei).send({
    from: account.address,
    gas: 500000,
  });
  
  return tx.transactionHash;
}

/**
 * Get Unity token balance
 * In mock mode, returns tracked in-memory balance
 */
export async function getUnityBalance(address: string): Promise<string> {
  const mode = UNITY_DEPLOY_MODE;
  
  if (mode === "mock") {
    // Mock balance - return tracked balance or 0
    const balance = mockBalances.get(address) || "0";
    console.log(`🧪 Mock balance query for ${address}: ${balance} UNITY`);
    return balance;
  }
  
  // Real blockchain balance
  const contract = getUnityContract();
  const balance = await contract.methods.balanceOf(address).call();
  return web3.utils.fromWei(balance, "ether");
}

/**
 * Get Unity token total supply
 * In mock mode, returns the configured total supply
 */
export async function getUnityTotalSupply(): Promise<string> {
  const mode = UNITY_DEPLOY_MODE;
  
  if (mode === "mock") {
    // Mock total supply - return tracked supply
    console.log(`🧪 Mock total supply: ${mockTotalSupply} UNITY`);
    return mockTotalSupply;
  }
  
  // Real blockchain supply
  const contract = getUnityContract();
  const supply = await contract.methods.totalSupply().call();
  return web3.utils.fromWei(supply, "ether");
}

// Initialize wallet on module load
try {
  initializeWallet();
  loadUnityContract().then((contract) => {
    if (contract) {
      console.log("✅ Unity contract loaded from build:", contract.address);
    } else {
      console.log("ℹ️  No Unity contract deployed yet. Use deployment endpoint to deploy.");
    }
  });
} catch (error) {
  console.error("Error initializing VeChain service:", error);
}
