import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Copy, CheckCircle, Wallet, Database, Award, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BadgeCard } from "@/components/badge-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Badge as BadgeType, UserBadge } from "@shared/schema";

interface ProfileProps {
  walletAddress?: string;
}

export default function Profile({ walletAddress }: ProfileProps) {
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user/me"],
    enabled: !!walletAddress,
  });

  const { data: allBadges = [] } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
  });

  const { data: userBadges = [] } = useQuery<(UserBadge & { badge: BadgeType })[]>({
    queryKey: ["/api/my-badges"],
    enabled: !!walletAddress,
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/user/toggle-admin", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      toast({
        title: "Admin Status Updated",
        description: "Your admin status has been toggled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const generateAvatarColor = (id: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    const index = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground text-lg">
            Your anonymous identity and account information
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6 mb-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : user ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                  <Avatar className={`h-24 w-24 ${generateAvatarColor(user.anonymousId)}`}>
                    <AvatarFallback className="text-3xl font-bold text-white">
                      #{user.anonymousId.slice(0, 4)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h2 className="text-2xl font-bold">Anonymous User</h2>
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                      {user.isAdmin && (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Your identity is protected by blockchain-based anonymization
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdminMutation.mutate()}
                      disabled={toggleAdminMutation.isPending}
                      data-testid="button-toggle-admin"
                      className="gap-2"
                    >
                      <UserCog className="h-4 w-4" />
                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Anonymous ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code
                        className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm"
                        data-testid="text-anonymous-id-display"
                      >
                        #{user.anonymousId}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(user.anonymousId, "Anonymous ID")}
                        data-testid="button-copy-anonymous-id"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>Wallet Address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code
                        className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm truncate"
                        data-testid="text-wallet-address-display"
                      >
                        {user.walletAddress}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(user.walletAddress, "Wallet address")}
                        data-testid="button-copy-wallet"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {user.nftTokenId && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Database className="h-4 w-4" />
                        <span>NFT Token ID</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm"
                          data-testid="text-nft-token-id"
                        >
                          {user.nftTokenId}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(user.nftTokenId!, "NFT Token ID")}
                          data-testid="button-copy-nft"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      <span>Member Since</span>
                    </div>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <CardTitle>Achievement Badges</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {allBadges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No badges available yet</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {allBadges.map((badge) => {
                      const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
                      return (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                          earned={!!userBadge}
                          earnedAt={userBadge?.earnedAt}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">100% Anonymous</h4>
                    <p className="text-sm text-muted-foreground">
                      Your survey responses are linked only to your anonymous ID, never to your
                      wallet address or personal information.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <Database className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Blockchain Verified</h4>
                    <p className="text-sm text-muted-foreground">
                      All your survey responses and rewards are recorded on the VeChain blockchain,
                      ensuring transparency and immutability.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <CheckCircle className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-1">Data Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Your data is encrypted and stored securely. We never sell or share your
                      personal information with third parties.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Profile Found</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to view your profile
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
