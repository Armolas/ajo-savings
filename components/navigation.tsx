"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, Plus, Users, User, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccount, useConnect, useDisconnect } from "wagmi"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Create Group", href: "/create-group", icon: Plus },
  { name: "Dashboard", href: "/dashboard", icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    const injectedConnector = connectors.find((connector) => connector.type === "injected")
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Users className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl font-[family-name:var(--font-manrope)]">Ajo Savings</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <Button variant="outline" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect} size="sm">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col space-y-4 mt-8">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 text-lg font-medium transition-colors hover:text-primary p-2 rounded-md",
                      pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <div className="border-t pt-4 mt-4">
                {isConnected ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                    <Button variant="outline" onClick={() => disconnect()} className="w-full">
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleConnect} className="w-full">
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
