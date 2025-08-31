"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Shield, Coins, ArrowRight, Plus, Wallet, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useAjoContract } from "@/hooks/use-ajo-contract"

interface GroupData {
  id: number
  name: string
  token: string
  contributionAmount: string
  cyclePeriod: number
  currentCycle: number
  startTime: Date
  members: string[]
  totalSaved: string
  nextPayout: string
  status: string
}

function GroupCard({ group }: { group: GroupData }) {
  const progressPercentage = (group.currentCycle / group.cyclePeriod) * 100

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-[family-name:var(--font-manrope)] text-lg">{group.name}</CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {group.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {group.members.length} members • Cycle {group.currentCycle}/{group.cyclePeriod}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wallet className="h-3 w-3" />
              Total Saved
            </div>
            <div className="font-semibold">
              {group.totalSaved} {group.token}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Per Cycle
            </div>
            <div className="font-semibold">
              {group.contributionAmount} {group.token}
            </div>
          </div>
        </div>

        {/* Next Payout */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Next payout:</span>
          </div>
          <span className="font-medium text-sm">{group.nextPayout}</span>
        </div>

        <Button asChild className="w-full">
          <Link href={`/groups/${group.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function GroupListingSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [groups, setGroups] = useState<GroupData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isConnected } = useAccount()
  const { useGroupCount } = useAjoContract()

  const { data: groupCount, isLoading: isLoadingCount } = useGroupCount()

  useEffect(() => {
    const loadGroups = async () => {
      if (!isConnected || !groupCount) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        // In a real implementation, you would fetch each group's data
        // For now, we'll show a message that wallet connection is needed
        console.log("[v0] Group count from contract:", groupCount)

        // Simulate loading time
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // For demo purposes, we'll show empty state when wallet is connected
        // but no groups exist, or show mock data if groups exist
        if (Number(groupCount) === 0) {
          setGroups([])
        } else {
          // In real implementation, fetch actual group data here
          setGroups([])
        }
      } catch (error) {
        console.error("[v0] Error loading groups:", error)
        setGroups([])
      } finally {
        setIsLoading(false)
      }
    }

    loadGroups()
  }, [isConnected, groupCount])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 md:py-20">
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-manrope)] text-balance mb-6">
            Build Wealth Together with <span className="text-primary">Ajo Savings</span>
          </h1>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto leading-relaxed">
            Join trusted community savings groups powered by blockchain technology. Save together, earn together, grow
            together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8" disabled={!isConnected}>
              <Link href="/create-group">
                <Plus className="mr-2 h-5 w-5" />
                Create New Group
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent" disabled={!isConnected}>
              <Link href="/dashboard">
                View My Groups
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          {!isConnected && (
            <p className="text-sm text-muted-foreground mt-4">Connect your wallet to create and join savings groups</p>
          )}
        </section>

        {/* Features Section */}
        <section className="py-16">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-manrope)] text-center mb-12">
            Why Choose Ajo Savings?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-sm">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  Join trusted groups with friends, family, or community members. Build stronger financial relationships
                  together.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-sm">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Blockchain Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  Smart contracts ensure transparency and security. Your funds are protected by decentralized
                  technology.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-sm">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Flexible Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  Choose your contribution amount, cycle duration, and payout schedule. Savings that work for your
                  lifestyle.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Active Groups Section */}
        <section className="py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-[family-name:var(--font-manrope)] mb-2">Active Savings Groups</h2>
              <p className="text-muted-foreground">
                {!isConnected
                  ? "Connect your wallet to view available groups"
                  : isLoading || isLoadingCount
                    ? "Loading groups..."
                    : `${groups.length} active groups available to join`}
              </p>
            </div>
            <Button asChild variant="outline" disabled={!isConnected}>
              <Link href="/create-group">
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Link>
            </Button>
          </div>

          {!isConnected ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Wallet className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold font-[family-name:var(--font-manrope)] mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">Connect your wallet to view and join savings groups.</p>
            </div>
          ) : isLoading || isLoadingCount ? (
            <GroupListingSkeleton />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}

          {isConnected && !isLoading && !isLoadingCount && groups.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold font-[family-name:var(--font-manrope)] mb-2">No Groups Yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to create a savings group in your community.</p>
              <Button asChild>
                <Link href="/create-group">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Group
                </Link>
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
