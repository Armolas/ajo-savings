import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { ajoABI, AJO_CONTRACT_ADDRESS } from "@/lib/wagmi-config"
import { formatEther } from "viem"

export function useAjoContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  // Read functions
  const useGroupCount = () => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "groupCount",
    })
  }

  const useGroupData = (groupId: number) => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "groups",
      args: [BigInt(groupId)],
    })
  }

  const useCurrentCycle = (groupId: number) => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "getCurrentCycle",
      args: [BigInt(groupId)],
    })
  }

  const useCurrentCycleBalance = (groupId: number) => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "getCurrentCycleBalance",
      args: [BigInt(groupId)],
    })
  }

  const useGroupMembers = (groupId: number) => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "getMembers",
      args: [BigInt(groupId)],
    })
  }

  const useIsMember = (groupId: number, userAddress: `0x${string}`) => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "isMember",
      args: [BigInt(groupId), userAddress],
    })
  }

  const useGroupsForAddress = (userAddress: `0x${string}`) => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "getGroupsForAddress",
      args: [userAddress],
    })
  }

  const useHasContributed = (groupId: number, userAddress: `0x${string}`, currentCycle: number) => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "hasContributed",
      args: [BigInt(groupId), userAddress, BigInt(currentCycle)],
    })
  }

  const useMemberContribution = (groupId: number, userAddress: `0x${string}`, currentCycle: number) => {
    return useReadContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "memberContributions",
      args: [BigInt(groupId), userAddress, BigInt(currentCycle)],
    })
  }

  const useTokenName = (tokenAddress: `0x${string}`) => {
    return useReadContract({
      address: tokenAddress,
      abi: [
        {
          name: "name",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "string" }],
        },
      ],
      functionName: "name",
    })
  }

  const useTokenSymbol = (tokenAddress: `0x${string}`) => {
    return useReadContract({
      address: tokenAddress,
      abi: [
        {
          name: "symbol",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "string" }],
        },
      ],
      functionName: "symbol",
    })
  }

  const useTokenDecimals = (tokenAddress: `0x${string}`) => {
    return useReadContract({
      address: tokenAddress,
      abi: [
        {
          name: "decimals",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "uint8" }],
        },
      ],
      functionName: "decimals",
    })
  }

  // Write functions
  const createGroup = async (
    name: string,
    tokenAddress: `0x${string}`,
    amount: bigint, // Changed from string to bigint since amount is already parsed
    cycleWeeks: bigint, // Changed from number to bigint to match the call site
    members: `0x${string}`[],
  ) => {
    return writeContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "createGroup",
      args: [name, tokenAddress, amount, cycleWeeks, members], // Removed parseEther call since amount is already a bigint
    })
  }

  const contribute = async (groupId: number) => {
    return writeContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "contribute",
      args: [BigInt(groupId)],
    })
  }

  const claimPool = async (groupId: number) => {
    return writeContract({
      address: AJO_CONTRACT_ADDRESS,
      abi: ajoABI,
      functionName: "claimPool",
      args: [BigInt(groupId)],
    })
  }

  return {
    // Read hooks
    useGroupCount,
    useGroupData,
    useCurrentCycle,
    useCurrentCycleBalance,
    useGroupMembers,
    useIsMember,
    useGroupsForAddress,
    useHasContributed,
    useMemberContribution,
    useTokenName,
    useTokenSymbol,
    useTokenDecimals,
    // Write functions
    createGroup,
    contribute,
    claimPool,
    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  }
}

export function formatTokenAmount(amount: bigint, decimals = 18): string {
  const divisor = BigInt(10 ** decimals)
  const quotient = amount / divisor
  const remainder = amount % divisor

  if (remainder === 0n) {
    return quotient.toString()
  }

  const remainderStr = remainder.toString().padStart(decimals, "0")
  const trimmedRemainder = remainderStr.replace(/0+$/, "")

  if (trimmedRemainder === "") {
    return quotient.toString()
  }

  return `${quotient}.${trimmedRemainder}`
}

// Helper function to format contract data
export function formatGroupData(groupData: any) {
  if (!groupData) return null

  return {
    name: groupData[0],
    token: groupData[1],
    contributionAmount: formatEther(groupData[2]),
    cyclePeriod: Number(groupData[3]), // Keep as seconds for accurate calculations
    currentCycle: Number(groupData[4]),
    startTime: new Date(Number(groupData[5]) * 1000),
  }
}

export function calculateCycleProgress(startTime: Date, cyclePeriod: number, currentCycle: number): number {
  const now = new Date()
  const cycleStartTime = new Date(startTime.getTime() + currentCycle * cyclePeriod * 1000)
  const cycleEndTime = new Date(cycleStartTime.getTime() + cyclePeriod * 1000)

  if (now < cycleStartTime) return 0
  if (now >= cycleEndTime) return 100

  const elapsed = now.getTime() - cycleStartTime.getTime()
  const total = cycleEndTime.getTime() - cycleStartTime.getTime()

  return Math.min((elapsed / total) * 100, 100)
}
