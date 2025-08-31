"use client"

import type React from "react"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Plus, X, Users, Coins, Clock, ArrowLeft, Loader2, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { useAjoContract } from "@/hooks/use-ajo-contract"
import { parseUnits } from "viem"
import { toast } from "sonner"
import { liskSepolia } from "viem/chains"

interface FormData {
  name: string
  tokenAddress: string
  contributionAmount: string
  cycleWeeks: string
  members: string[]
}

interface FormErrors {
  name?: string
  tokenAddress?: string
  contributionAmount?: string
  cycleWeeks?: string
  members?: string[]
}

export default function CreateGroupPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { createGroup } = useAjoContract()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    tokenAddress: "",
    contributionAmount: "",
    cycleWeeks: "",
    members: [""],
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate group name
    if (!formData.name.trim()) {
      newErrors.name = "Group name is required"
    } else if (formData.name.length < 3) {
      newErrors.name = "Group name must be at least 3 characters"
    }

    // Validate token address
    if (!formData.tokenAddress.trim()) {
      newErrors.tokenAddress = "Token address is required"
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.tokenAddress)) {
      newErrors.tokenAddress = "Invalid Ethereum address format"
    }

    // Validate contribution amount
    if (!formData.contributionAmount.trim()) {
      newErrors.contributionAmount = "Contribution amount is required"
    } else if (isNaN(Number(formData.contributionAmount)) || Number(formData.contributionAmount) <= 0) {
      newErrors.contributionAmount = "Must be a valid positive number"
    }

    // Validate cycle weeks
    if (!formData.cycleWeeks.trim()) {
      newErrors.cycleWeeks = "Cycle period is required"
    } else if (isNaN(Number(formData.cycleWeeks)) || Number(formData.cycleWeeks) < 1) {
      newErrors.cycleWeeks = "Must be at least 1 week"
    } else if (Number(formData.cycleWeeks) > 52) {
      newErrors.cycleWeeks = "Cannot exceed 52 weeks"
    }

    // Validate members
    const validMembers = formData.members.filter((member) => member.trim() !== "")
    const memberErrors: string[] = []

    if (validMembers.length === 0) {
      memberErrors.push("At least one member address is required")
    }

    validMembers.forEach((member, index) => {
      if (!/^0x[a-fA-F0-9]{40}$/.test(member)) {
        memberErrors.push(`Member ${index + 1}: Invalid Ethereum address format`)
      }
    })

    // Check for duplicate addresses
    const uniqueMembers = new Set(validMembers)
    if (uniqueMembers.size !== validMembers.length) {
      memberErrors.push("Duplicate member addresses are not allowed")
    }

    if (memberErrors.length > 0) {
      newErrors.members = memberErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...formData.members]
    newMembers[index] = value
    setFormData((prev) => ({ ...prev, members: newMembers }))
    // Clear member errors when user starts typing
    if (errors.members) {
      setErrors((prev) => ({ ...prev, members: undefined }))
    }
  }

  const addMember = () => {
    setFormData((prev) => ({ ...prev, members: [...prev.members, ""] }))
  }

  const removeMember = (index: number) => {
    if (formData.members.length > 1) {
      const newMembers = formData.members.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, members: newMembers }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (chainId !== liskSepolia.id) {
      toast.error("Please switch to Lisk Sepolia network")
      try {
        await switchChain({ chainId: liskSepolia.id })
      } catch (error) {
        console.error("Failed to switch network:", error)
        return
      }
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const validMembers = formData.members.filter((m) => m.trim() !== "")
      const contributionAmountWei = parseUnits(formData.contributionAmount, 18)

      console.log("[v0] Creating group with params:", {
        name: formData.name,
        tokenAddress: formData.tokenAddress,
        contributionAmount: contributionAmountWei.toString(),
        cycleWeeks: formData.cycleWeeks,
        members: validMembers,
      })

      const result = await createGroup(
        formData.name,
        formData.tokenAddress as `0x${string}`,
        contributionAmountWei,
        BigInt(formData.cycleWeeks),
        validMembers as `0x${string}`[],
      )

      console.log("[v0] Group creation result:", result)

      toast.success("Group created successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("[v0] Error creating group:", error)
      toast.error(error?.message || "Failed to create group. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const validMemberCount = formData.members.filter((member) => member.trim() !== "").length
  const estimatedTotalPool = validMemberCount * Number(formData.contributionAmount || 0)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center py-12">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">You need to connect your wallet to create a savings group.</p>
            <Button asChild>
              <Link href="/">Go Back Home</Link>
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
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center py-12">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Wrong Network</h2>
            <p className="text-muted-foreground mb-6">
              Please switch to Lisk Sepolia network to create a savings group.
            </p>
            <Button onClick={() => switchChain({ chainId: liskSepolia.id })} className="mr-4">
              Switch to Lisk Sepolia
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go Back Home</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-manrope)] mb-2">Create Savings Group</h1>
          <p className="text-muted-foreground">
            Set up a new Ajo savings group with your community members. All fields are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Group Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-manrope)]">
                <Users className="h-5 w-5" />
                Group Details
              </CardTitle>
              <CardDescription>Basic information about your savings group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Lagos Tech Workers Savings"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Token & Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-manrope)]">
                <Coins className="h-5 w-5" />
                Token & Contribution
              </CardTitle>
              <CardDescription>Specify the token and contribution amount for each cycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenAddress">ERC20 Token Address</Label>
                <Input
                  id="tokenAddress"
                  placeholder="0x..."
                  value={formData.tokenAddress}
                  onChange={(e) => handleInputChange("tokenAddress", e.target.value)}
                  className={errors.tokenAddress ? "border-destructive" : ""}
                />
                {errors.tokenAddress && <p className="text-sm text-destructive">{errors.tokenAddress}</p>}
                <p className="text-xs text-muted-foreground">
                  Enter the contract address of the ERC20 token (e.g., USDC, USDT)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contributionAmount">Contribution Amount (per cycle)</Label>
                <Input
                  id="contributionAmount"
                  type="number"
                  placeholder="1000"
                  value={formData.contributionAmount}
                  onChange={(e) => handleInputChange("contributionAmount", e.target.value)}
                  className={errors.contributionAmount ? "border-destructive" : ""}
                />
                {errors.contributionAmount && <p className="text-sm text-destructive">{errors.contributionAmount}</p>}
                <p className="text-xs text-muted-foreground">
                  Amount each member contributes per cycle (in token units)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cycle Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-manrope)]">
                <Clock className="h-5 w-5" />
                Cycle Period
              </CardTitle>
              <CardDescription>How long each savings cycle lasts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cycleWeeks">Cycle Duration (weeks)</Label>
                <Input
                  id="cycleWeeks"
                  type="number"
                  placeholder="12"
                  min="1"
                  max="52"
                  value={formData.cycleWeeks}
                  onChange={(e) => handleInputChange("cycleWeeks", e.target.value)}
                  className={errors.cycleWeeks ? "border-destructive" : ""}
                />
                {errors.cycleWeeks && <p className="text-sm text-destructive">{errors.cycleWeeks}</p>}
                <p className="text-xs text-muted-foreground">
                  Number of weeks for the complete savings cycle (1-52 weeks)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-manrope)]">
                <Users className="h-5 w-5" />
                Group Members
              </CardTitle>
              <CardDescription>Add wallet addresses of all group members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`member-${index}`}>Member {index + 1}</Label>
                    <Input
                      id={`member-${index}`}
                      placeholder="0x..."
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      className={errors.members ? "border-destructive" : ""}
                    />
                  </div>
                  {formData.members.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeMember(index)}
                      className="mt-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {errors.members && (
                <div className="space-y-1">
                  {errors.members.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              )}

              <Button type="button" variant="outline" onClick={addMember} className="w-full bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>Total members: {validMemberCount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {validMemberCount > 0 && formData.contributionAmount && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-manrope)]">Group Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Members:</span>
                  <Badge variant="secondary">{validMemberCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Contribution per Member:</span>
                  <span className="font-semibold">{formData.contributionAmount} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Pool per Cycle:</span>
                  <span className="font-semibold">{estimatedTotalPool.toLocaleString()} tokens</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Each member will receive the full pool once during the cycle</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
              <Link href="/">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Group...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
