import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  TrendingUp,
  Zap,
  Database,
  ChartBar,
  Lock,
  Coins,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface HomeProps {
  isConnected: boolean;
  onConnect: () => void;
}

export default function Home({ isConnected, onConnect }: HomeProps) {
  return (
    <div className="flex flex-col">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient (image removed to fix build) */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />

        <div className="container relative z-10 px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                100% Anonymous
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Blockchain Verified
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Coins className="h-3 w-3" />
                Real Rewards
              </Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Verifiable Market Research
              <span className="text-primary"> On-Chain</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Earn B3TR, VET, and VTHO tokens by participating in surveys. Your data stays anonymous,
              your rewards are instant, and every response is blockchain-verified.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {isConnected ? (
                <Link href="/marketplace">
                  <Button size="lg" className="text-lg px-8 h-14 gap-2">
                    Browse Surveys <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  onClick={onConnect}
                  className="text-lg px-8 h-14 gap-2"
                >
                  Connect Wallet <Zap className="h-5 w-5" />
                </Button>
              )}
              <Link href="/create">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 gap-2">
                  Create Survey <ChartBar className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/50">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-lg">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Privacy First</h3>
                <p className="text-muted-foreground">
                  Your identity is protected by zero-knowledge proofs. Companies get insights, not your personal data.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-lg">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Immutable Data</h3>
                <p className="text-muted-foreground">
                  All survey responses are hashed and stored on VeChain. Fraud and manipulation are mathematically impossible.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="p-3 bg-primary/10 w-fit rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Instant Payouts</h3>
                <p className="text-muted-foreground">
                  Smart contracts distribute rewards immediately upon survey completion. No minimums, no waiting periods.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
