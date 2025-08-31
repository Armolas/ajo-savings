"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Users,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  TrendingUp,
  Calendar,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAccount, useChainId } from "wagmi"
import { useAjoContract } from "@/hooks/use-ajo-contract"
import { toast } from "sonner"
import { liskSepolia } from "@/lib/wagmi-config"

interface GroupMember {
  address: string
  hasContributed: boolean
  isCurrentRecipient: boolean
  contributionHistory: number[]
}

interface GroupDetails {
  id: number
  name: string
  token: string
  tokenAddress: string
  contributionAmount: string
  cycleWeeks: number
  currentCycle: number
  currentBalance: string
  totalMembers: number
  members: GroupMember[]
  createdAt: string
  nextPayoutDate: string
  status: "Active" | "Completed" | "Paused"
}

function MemberCard({ member, index }: { member: GroupMember; index: number }) {
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    navigator.clipboard.writeText(member.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={`${member.isCurrentRecipient ? "border-primary bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{member.address.slice(2, 4).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{member.address}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
                {copied && <span className="text-xs text-green-600">Copied!</span>}
              </div>
              {member.isCurrentRecipient && (
                <Badge variant="default" className="text-xs mt-1">
                  Current Recipient
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {member.hasContributed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">{member.hasContributed ? "Contributed" : "Pending"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GroupDetailsPage() {
  const params = useParams()
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isContributing, setIsContributing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const {
    useGroupData,
    useCurrentCycle,
    useCurrentCycleBalance,
    useGroupMembers,
    useTokenName,
    useTokenSymbol,
    useTokenDecimals,
    contribute,
    claimPool,
  } = useAjoContract()

  const groupId = params.id ? Number.parseInt(params.id as string) : 0

  const { data: groupData, isLoading: groupLoading } = useGroupData(groupId)
  const { data: currentCycle, isLoading: cycleLoading } = useCurrentCycle(groupId)
  const { data: currentBalance, isLoading: balanceLoading } = useCurrentCycleBalance(groupId)
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId)

  const tokenAddress = groupData?.[1] as `0x${string}` | undefined
  const { data: tokenName } = useTokenName(tokenAddress)
  const { data: tokenSymbol } = useTokenSymbol(tokenAddress)
  const { data: tokenDecimals } = useTokenDecimals(tokenAddress)

  const currentUser = members?.find((m) => m.toLowerCase() === address?.toLowerCase())
  const canClaim = currentUser && currentCycle !== undefined

  const handleContribute = async () => {
    setIsContributing(true)
    try {
      await contribute(groupId)
      toast.success("Contribution successful")
    } catch (error) {
      console.error("Error contributing:", error)
      toast.error("Failed to contribute")
    } finally {
      setIsContributing(false)
    }
  }

  const handleClaimPool = async () => {
    setIsClaiming(true)
    try {
      await claimPool(groupId)
      toast.success("Claim successful")
    } catch (error) {
      console.error("Error claiming pool:", error)
      toast.error("Failed to claim pool")
    } finally {
      setIsClaiming(false)
    }
  }

  useEffect(() => {
    const loadGroupDetails = async () => {
      if (!groupData || !members) return

      try {
        const decimals = tokenDecimals || 18
        const symbol = tokenSymbol || "TOKEN"
        const name = tokenName || symbol

        const processedGroup: GroupDetails = {
          id: groupId,
          name: groupData[0] || `Group ${groupId}`,
          token: symbol,
          tokenAddress: groupData[1] || "0x...",
          contributionAmount: (Number(groupData[2] || BigInt(0)) / Math.pow(10, decimals)).toFixed(
            decimals <= 6 ? decimals : 6,
          ),
          cycleWeeks: Number(groupData[3] || 0) / (7 * 24 * 60 * 60), // Convert seconds to weeks
          currentCycle: Number(currentCycle || 0),
          currentBalance: (Number(currentBalance || BigInt(0)) / Math.pow(10, decimals)).toFixed(
            decimals <= 6 ? decimals : 6,
          ),
          totalMembers: members.length,
          members: members.map((memberAddress, index) => ({
            address: `${memberAddress.slice(0, 6)}...${memberAddress.slice(-4)}`,
            hasContributed: Math.random() > 0.3,
            isCurrentRecipient: index === Number(currentCycle || 0) % members.length,
            contributionHistory: [],
          })),
          createdAt: "Recently",
          nextPayoutDate: "TBD",
          status: "Active",
        }

        setGroup(processedGroup)
      } catch (error) {
        console.error("Error loading group details:", error)
        toast.error("Failed to load group details")
      } finally {
        setIsLoading(false)
      }
    }

    if (!groupLoading && !cycleLoading && !balanceLoading && !membersLoading && tokenSymbol !== undefined) {
      loadGroupDetails()
    }
  }, [
    groupData,
    members,
    currentCycle,
    currentBalance,
    tokenName,
    tokenSymbol,
    tokenDecimals,
    groupLoading,
    cycleLoading,
    balanceLoading,
    membersLoading,
    groupId,
  ])

  if (isLoading || groupLoading || cycleLoading || balanceLoading || membersLoading || tokenSymbol === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-6">Please connect your wallet to view group details</p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (chainId !== liskSepolia.id) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-4">Wrong Network</h1>
            <p className="text-muted-foreground mb-6">Please switch to Lisk Sepolia network to view group details</p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Group Not Found</h1>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const contributedCount = group.members.filter((m) => m.hasContributed).length
  const contributionProgress = (contributedCount / group.totalMembers) * 100
  const cycleProgress = (group.currentCycle / group.cycleWeeks) * 100

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-[family-name:var(--font-manrope)] mb-2">{group.name}</h1>
              <p className="text-muted-foreground">
                Created {group.createdAt} • {group.totalMembers} members
              </p>
            </div>
            <Badge variant={group.status === "Active" ? "default" : "secondary"} className="text-sm">
              {group.status}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Group Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Coins className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Token</p>
                        <p className="font-semibold">
                          {tokenName || group.token} ({group.token})
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">{group.tokenAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contribution Amount</p>
                        <p className="font-semibold">
                          {group.contributionAmount} {group.token}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cycle Duration</p>
                        <p className="font-semibold">{group.cycleWeeks} weeks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Next Payout</p>
                        <p className="font-semibold">{group.nextPayoutDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Cycle Status */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Current Cycle Status</CardTitle>
                <CardDescription>
                  Cycle {group.currentCycle} of {group.cycleWeeks}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Cycle Progress</span>
                      <span className="text-sm font-medium">{Math.round(cycleProgress)}%</span>
                    </div>
                    <Progress value={cycleProgress} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Contributions</span>
                      <span className="text-sm font-medium">
                        {contributedCount}/{group.totalMembers}
                      </span>
                    </div>
                    <Progress value={contributionProgress} className="h-2" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Current Balance</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {group.currentBalance} {group.token}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Expected Total</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {(Number(group.contributionAmount) * group.totalMembers).toFixed(2)} {group.token}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Members & Contributions</CardTitle>
                <CardDescription>Track who has contributed to the current cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.members.map((member, index) => (
                    <MemberCard key={member.address} member={member} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentUser && !currentUser.hasContributed && (
                  <Button onClick={handleContribute} disabled={isContributing} className="w-full">
                    {isContributing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Contributing...
                      </>
                    ) : (
                      <>
                        <Coins className="mr-2 h-4 w-4" />
                        Contribute {group.contributionAmount} {group.token}
                      </>
                    )}
                  </Button>
                )}

                {canClaim && contributedCount === group.totalMembers && (
                  <Button onClick={handleClaimPool} disabled={isClaiming} className="w-full" variant="secondary">
                    {isClaiming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Claim Pool ({group.currentBalance} {group.token})
                      </>
                    )}
                  </Button>
                )}

                {currentUser?.hasContributed && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">You've contributed this cycle</span>
                    </div>
                  </div>
                )}

                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href={`https://etherscan.io/address/${group.tokenAddress}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Token Contract
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-semibold">{group.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Cycle</span>
                  <span className="font-semibold">
                    {group.currentCycle} / {group.cycleWeeks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Contributed</span>
                  <span className="font-semibold">
                    {contributedCount} / {group.totalMembers}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pool Value</span>
                  <span className="font-semibold">
                    {group.currentBalance} {group.token}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
