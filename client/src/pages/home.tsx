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
import heroImage from "@assets/generated_images/Blockchain_network_hero_background_8a454c5f.png";

interface HomeProps {
  isConnected: boolean;
  onConnect: () => void;
}

export default function Home({ isConnected, onConnect }: HomeProps) {
  return (
    <div className="flex flex-col">
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
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
                  <a>
                    <Button size="lg" className="text-lg px-8" data-testid="button-browse-surveys">
                      Browse Surveys
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="text-lg px-8"
                  onClick={onConnect}
                  data-testid="button-get-started"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Link href="/create-survey">
                <a>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 bg-background/50 backdrop-blur"
                    data-testid="button-create-survey-cta"
                  >
                    Create Survey
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Why B3TRSURVE?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Traditional surveys suffer from low-quality data due to poor incentives.
                We use blockchain technology to guarantee authenticity.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="hover-elevate">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Blockchain Verified</h3>
                  <p className="text-muted-foreground">
                    Every survey response is recorded on VeChain, creating an immutable,
                    transparent record that proves data authenticity.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Anonymous NFT Identity</h3>
                  <p className="text-muted-foreground">
                    Your personal data remains private. An NFT-based identity system ensures
                    100% anonymity while preventing duplicate responses.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Instant Fair Rewards</h3>
                  <p className="text-muted-foreground">
                    Earn tokens immediately upon survey completion. No waiting periods,
                    no hidden fees, no disqualifications after wasting your time.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Simple, transparent, and rewarding
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Connect Wallet",
                  description: "Link your VeChain wallet to receive your anonymous NFT identity",
                  icon: Shield,
                },
                {
                  step: "02",
                  title: "Take Surveys",
                  description: "Browse available surveys and answer questions honestly",
                  icon: ChartBar,
                },
                {
                  step: "03",
                  title: "Earn Rewards",
                  description: "Choose your reward tier: Gold (B3TR), Silver (VET), or Bronze (VTHO)",
                  icon: Coins,
                },
                {
                  step: "04",
                  title: "Get Verified",
                  description: "Your response is recorded on-chain with instant token distribution",
                  icon: TrendingUp,
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  {index < 3 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-border -translate-x-1/2" />
                  )}
                  <div className="relative z-10 text-center space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                      {item.step}
                    </div>
                    <div className="mx-auto h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Token Reward Tiers</h2>
              <p className="text-lg text-muted-foreground">
                Choose your preferred reward type from our weekly pool
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2 border-yellow-500/20 hover-elevate">
                <CardContent className="pt-6 space-y-4">
                  <Badge className="bg-yellow-500 text-yellow-950">Gold Tier</Badge>
                  <h3 className="text-2xl font-bold">B3TR Tokens</h3>
                  <p className="text-3xl font-mono font-bold text-primary">5.0 B3TR</p>
                  <p className="text-sm text-muted-foreground">
                    Smallest pool, highest value. Premium rewards for early participants.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-400/20 hover-elevate">
                <CardContent className="pt-6 space-y-4">
                  <Badge className="bg-gray-400 text-gray-950">Silver Tier</Badge>
                  <h3 className="text-2xl font-bold">VET Tokens</h3>
                  <p className="text-3xl font-mono font-bold text-primary">15.0 VET</p>
                  <p className="text-sm text-muted-foreground">
                    Medium pool size. Balanced rewards with stable value.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-600/20 hover-elevate">
                <CardContent className="pt-6 space-y-4">
                  <Badge className="bg-orange-600 text-orange-50">Bronze Tier</Badge>
                  <h3 className="text-2xl font-bold">VTHO Tokens</h3>
                  <p className="text-3xl font-mono font-bold text-primary">25.0 VTHO</p>
                  <p className="text-sm text-muted-foreground">
                    Largest pool, consistent availability. Reliable rewards.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                For Organizations & Businesses
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get verified, high-quality market research data. No bots, no fake responses,
                just real insights from real people backed by blockchain verification.
              </p>
              <Link href="/create-survey">
                <a>
                  <Button size="lg" className="text-lg px-8" data-testid="button-create-survey-footer">
                    Create Your First Survey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </Link>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
