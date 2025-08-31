import { createConfig, http } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { injected } from "wagmi/connectors"

const liskSepolia = {
  id: 4202,
  name: "Lisk Sepolia",
  network: "lisk-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Sepolia Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia-api.lisk.com"],
    },
    public: {
      http: ["https://rpc.sepolia-api.lisk.com"],
    },
  },
  blockExplorers: {
    default: { name: "Lisk Sepolia Explorer", url: "https://sepolia-blockscout.lisk.com" },
  },
  testnet: true,
} as const

export const config = createConfig({
  chains: [liskSepolia, sepolia, mainnet],
  connectors: [injected()],
  transports: {
    [liskSepolia.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})

export const ajoABI = [
  {
    inputs: [
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "address", name: "_token", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "uint256", name: "_cycleWeeks", type: "uint256" },
      { internalType: "address[]", name: "_members", type: "address[]" },
    ],
    name: "createGroup",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "groupId", type: "uint256" }],
    name: "contribute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "groupId", type: "uint256" }],
    name: "claimPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "groupId", type: "uint256" }],
    name: "getCurrentCycle",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "groupId", type: "uint256" }],
    name: "getCurrentCycleBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "groupId", type: "uint256" }],
    name: "getMembers",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "groupId", type: "uint256" },
      { internalType: "address", name: "user", type: "address" },
    ],
    name: "isMember",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "groupCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "groups",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "contributionAmount", type: "uint256" },
      { internalType: "uint256", name: "cyclePeriod", type: "uint256" },
      { internalType: "uint256", name: "currentCycle", type: "uint256" },
      { internalType: "uint256", name: "startTime", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getGroupsForAddress",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "groupId", type: "uint256" },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      { indexed: false, internalType: "address", name: "token", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "cyclePeriod", type: "uint256" },
      { indexed: false, internalType: "address[]", name: "members", type: "address[]" },
    ],
    name: "GroupCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "groupId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "cycle", type: "uint256" },
      { indexed: false, internalType: "address", name: "member", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "ContributionMade",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "groupId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "cycle", type: "uint256" },
      { indexed: false, internalType: "address", name: "member", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "PoolClaimed",
    type: "event",
  },
] as const

export const AJO_CONTRACT_ADDRESS = "0xE683377745a812Aeaff67F801058C95FC36675b1"

export { liskSepolia }
