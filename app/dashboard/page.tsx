"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { useAccount, useChainId } from "wagmi"
import { useAjoContract, formatGroupData, calculateCycleProgress, formatTokenAmount } from "@/hooks/use-ajo-contract"
import { toast } from "sonner"
import {
  Users,
  Coins,
  TrendingUp,
  ArrowRight,
  Wallet,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface UserGroupData {
  id: number
  name: string
  token: string
  tokenSymbol: string
  contributionAmount: string
  cycleWeeks: number
  currentCycle: number
  totalMembers: number
  userHasContributed: boolean
  userIsCurrentRecipient: boolean
  currentBalance: string
  nextPayoutDate: string
  status: "Active" | "Completed" | "Paused"
  userTotalContributed: string
  userTotalReceived: string
  cycleProgress: number
  contributionProgress: number
}

function useGroupDetails(groupId: number, userAddress: `0x${string}`) {
  const {
    useGroupData,
    useCurrentCycle,
    useCurrentCycleBalance,
    useGroupMembers,
    useHasContributed,
    useMemberContribution,
    useTokenName,
    useTokenSymbol,
    useTokenDecimals,
  } = useAjoContract()

  const groupData = useGroupData(groupId)
  const currentCycle = useCurrentCycle(groupId)
  const currentBalance = useCurrentCycleBalance(groupId)
  const members = useGroupMembers(groupId)

  const hasContributed = useHasContributed(groupId, userAddress, Number(currentCycle.data || 0))
  const memberContribution = useMemberContribution(groupId, userAddress, Number(currentCycle.data || 0))

  const tokenAddress = groupData.data?.[1] as `0x${string}` | undefined
  const tokenName = useTokenName(tokenAddress || "0x0000000000000000000000000000000000000000")
  const tokenSymbol = useTokenSymbol(tokenAddress || "0x0000000000000000000000000000000000000000")
  const tokenDecimals = useTokenDecimals(tokenAddress || "0x0000000000000000000000000000000000000000")

  return {
    groupData: groupData.data,
    currentCycle: currentCycle.data,
    currentBalance: currentBalance.data,
    members: members.data,
    hasContributed: hasContributed.data,
    memberContribution: memberContribution.data,
    tokenName: tokenName.data,
    tokenSymbol: tokenSymbol.data,
    tokenDecimals: tokenDecimals.data,
    isLoading: groupData.isLoading || currentCycle.isLoading || currentBalance.isLoading || members.isLoading,
    error: groupData.error || currentCycle.error || currentBalance.error || members.error,
  }
}

function GroupDashboardCard({ groupId, userAddress }: { groupId: number; userAddress: `0x${string}` }) {
  const [isContributing, setIsContributing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const { contribute, claimPool, isPending, isConfirming, isConfirmed, error } = useAjoContract()

  const {
    groupData,
    currentCycle,
    currentBalance,
    members,
    hasContributed,
    memberContribution,
    tokenName,
    tokenSymbol,
    tokenDecimals,
    isLoading,
    error: fetchError,
  } = useGroupDetails(groupId, userAddress)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-1.5 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (fetchError || !groupData || !members) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">Failed to load group data</p>
        </CardContent>
      </Card>
    )
  }

  const formattedGroupData = formatGroupData(groupData)
  if (!formattedGroupData) return null

  const userIndex = members.findIndex((member: string) => member.toLowerCase() === userAddress.toLowerCase())
  const isCurrentRecipient = userIndex === (Number(currentCycle) || 0) % members.length

  const cycleProgress = calculateCycleProgress(
    formattedGroupData.startTime,
    formattedGroupData.cyclePeriod,
    formattedGroupData.currentCycle,
  )

  const contributionAmount = BigInt(groupData[2])
  const expectedBalance = contributionAmount * BigInt(members.length)
  const actualBalance = currentBalance || 0n
  const contributionProgress = expectedBalance > 0n ? (Number(actualBalance) * 100) / Number(expectedBalance) : 0

  const decimals = Number(tokenDecimals || 18)
  const displayTokenSymbol = tokenSymbol || "TOKEN"
  const displayTokenName = tokenName || "Unknown Token"

  const cyclePeriodInWeeks = Math.round(formattedGroupData.cyclePeriod / (7 * 24 * 60 * 60))
  const cycleDurationText = cyclePeriodInWeeks === 1 ? "1 week" : `${cyclePeriodInWeeks} weeks`

  console.log("[v0] Group", groupId, "balance:", actualBalance.toString(), "expected:", expectedBalance.toString())
  console.log("[v0] Token info:", { name: displayTokenName, symbol: displayTokenSymbol, decimals })
  console.log("[v0] Cycle duration:", formattedGroupData.cyclePeriod, "seconds =", cyclePeriodInWeeks, "weeks")

  const group: UserGroupData = {
    id: groupId,
    name: formattedGroupData.name,
    token: displayTokenName,
    tokenSymbol: displayTokenSymbol,
    contributionAmount: formatTokenAmount(contributionAmount, decimals),
    cycleWeeks: cyclePeriodInWeeks,
    currentCycle: formattedGroupData.currentCycle,
    totalMembers: members.length,
    userHasContributed: Boolean(hasContributed),
    userIsCurrentRecipient: isCurrentRecipient,
    currentBalance: formatTokenAmount(actualBalance, decimals),
    nextPayoutDate: "TBD",
    status: "Active",
    userTotalContributed: memberContribution ? formatTokenAmount(memberContribution, decimals) : "0",
    userTotalReceived: "0",
    cycleProgress: Math.min(cycleProgress, 100),
    contributionProgress: Math.min(contributionProgress, 100),
  }

  const handleQuickContribute = async () => {
    setIsContributing(true)
    try {
      console.log("[v0] Contributing to group:", groupId)
      await contribute(groupId)
      toast.success("Contribution submitted successfully!")
    } catch (err) {
      console.log("[v0] Contribution error:", err)
      toast.error("Failed to contribute. Please try again.")
    } finally {
      setIsContributing(false)
    }
  }

  const handleQuickClaim = async () => {
    setIsClaiming(true)
    try {
      console.log("[v0] Claiming pool for group:", groupId)
      await claimPool(groupId)
      toast.success("Pool claimed successfully!")
    } catch (err) {
      console.log("[v0] Claim error:", err)
      toast.error("Failed to claim pool. Please try again.")
    } finally {
      setIsClaiming(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200"
      case "Completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-[family-name:var(--font-manrope)] text-lg">{group.name}</CardTitle>
          <Badge className={getStatusColor(group.status)}>{group.status}</Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {group.totalMembers} members • Cycle {group.currentCycle} • {cycleDurationText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Cycle Progress</span>
              <span className="text-xs font-medium">{Math.round(group.cycleProgress)}%</span>
            </div>
            <Progress value={group.cycleProgress} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Contributions</span>
              <span className="text-xs font-medium">{Math.round(group.contributionProgress)}%</span>
            </div>
            <Progress value={group.contributionProgress} className="h-1.5" />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {group.userHasContributed ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              {group.userHasContributed ? "Contributed this cycle" : "Contribution pending"}
            </span>
          </div>
          {group.userIsCurrentRecipient && (
            <Badge variant="default" className="text-xs">
              Your Turn
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Contribution Amount</div>
            <div className="font-semibold">
              {group.contributionAmount} {group.tokenSymbol}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Current Balance</div>
            <div className="font-semibold">
              {group.currentBalance} {group.tokenSymbol}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {group.status === "Active" && !group.userHasContributed && (
            <Button
              size="sm"
              onClick={handleQuickContribute}
              disabled={isContributing || isPending || isConfirming}
              className="flex-1"
            >
              {isContributing || isPending || isConfirming ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Coins className="mr-1 h-3 w-3" />
                  Contribute
                </>
              )}
            </Button>
          )}

          {group.status === "Active" && group.userIsCurrentRecipient && group.contributionProgress >= 90 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleQuickClaim}
              disabled={isClaiming || isPending || isConfirming}
              className="flex-1"
            >
              {isClaiming || isPending || isConfirming ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Wallet className="mr-1 h-3 w-3" />
                  Claim
                </>
              )}
            </Button>
          )}

          <Button size="sm" variant="outline" asChild className="flex-1 bg-transparent">
            <Link href={`/groups/${group.id}`}>
              <Eye className="mr-1 h-3 w-3" />
              Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-1.5 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { useGroupsForAddress } = useAjoContract()

  const userGroupsQuery = useGroupsForAddress(address as `0x${string}`)
  const userGroupIds = userGroupsQuery.data ? userGroupsQuery.data.map((id) => Number(id)) : []

  console.log("[v0] User group IDs:", userGroupIds)
  console.log("[v0] Groups query loading:", userGroupsQuery.isLoading)
  console.log("[v0] Groups query error:", userGroupsQuery.error)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <Wallet className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold font-[family-name:var(--font-manrope)] mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view your savings groups and manage your contributions.
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (chainId !== 4202) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold font-[family-name:var(--font-manrope)] mb-2">Wrong Network</h3>
            <p className="text-muted-foreground mb-6">
              Please switch to Lisk Sepolia network to access your savings groups.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-manrope)] mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your savings groups and track your contributions and earnings.</p>
        </div>

        {userGroupsQuery.isLoading ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <DashboardSkeleton />
          </>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Groups</p>
                      <p className="text-2xl font-bold">{userGroupIds.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Contributed</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Received</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Actions</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {userGroupIds.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-manrope)]">Your Groups</h2>
                  <Button asChild variant="outline">
                    <Link href="/create-group">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Group
                    </Link>
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userGroupIds.map((groupId) => (
                    <GroupDashboardCard key={groupId} groupId={groupId} userAddress={address as `0x${string}`} />
                  ))}
                </div>
              </section>
            )}

            {userGroupIds.length === 0 && !userGroupsQuery.isLoading && (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold font-[family-name:var(--font-manrope)] mb-2">No Groups Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Join existing groups or create your own to start saving with your community.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/create-group">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Group
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent">
                    <Link href="/">
                      Browse Groups
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
