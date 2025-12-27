import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RewardSelectionModal } from "@/components/reward-modal";
import { BadgeNotification } from "@/components/badge-notification";
import type { Survey, Question, Badge as BadgeType } from "@shared/schema";

export default function TakeSurvey() {
  const [, params] = useRoute("/survey/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [newBadge, setNewBadge] = useState<BadgeType | null>(null);

  const { data: survey, isLoading: surveyLoading } = useQuery<Survey>({
    queryKey: ["/api/surveys", params?.id],
    enabled: !!params?.id,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/surveys", params?.id, "questions"],
    enabled: !!params?.id,
  });

  const submitResponsesMutation = useMutation({
    mutationFn: async (data: { surveyId: string; answers: Record<string, string>; selectedTier: string }) => {
      return await apiRequest("POST", "/api/responses", data);
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-badges"] });
      
      if (data?.reward?.amount && data?.reward?.tokenType) {
        toast({
          title: "Survey completed!",
          description: `You earned ${data.reward.amount} ${data.reward.tokenType} tokens`,
        });
      }

      if (data?.newBadges && data.newBadges.length > 0) {
        try {
          const allBadges = (await apiRequest("GET", "/api/badges") as unknown) as BadgeType[];
          const earnedBadge = allBadges.find((b: BadgeType) => b.id === data.newBadges[0].badgeId);
          if (earnedBadge) {
            setNewBadge(earnedBadge);
            setTimeout(() => {
              setLocation("/dashboard");
            }, 3000);
            return;
          }
        } catch (error) {
          console.error("Failed to fetch badge data:", error);
        }
      }
      
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = surveyLoading || questionsLoading;
  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === (questions?.length || 0) - 1;

  const handleAnswer = (value: string) => {
    if (currentQuestion) {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const handleNext = () => {
    if (currentQuestion?.required && !answers[currentQuestion.id]) {
      toast({
        title: "Answer required",
        description: "Please answer this question before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (isLastQuestion) {
      setShowRewardModal(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleRewardConfirm = (selectedToken: string, tier: string) => {
    if (!params?.id || !questions) return;

    const requiredQuestions = questions.filter(q => q.required);
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id]);
    
    if (missingAnswers.length > 0) {
      toast({
        title: "Missing answers",
        description: "Please answer all required questions before submitting.",
        variant: "destructive",
      });
      setShowRewardModal(false);
      return;
    }

    submitResponsesMutation.mutate({
      surveyId: params.id,
      answers,
      selectedTier: tier,
    });
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!survey || !questions) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Survey not found</h2>
            <p className="text-muted-foreground mb-4">
              This survey may have been removed or is no longer available.
            </p>
            <Button onClick={() => setLocation("/marketplace")}>
              Back to Marketplace
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => setLocation("/marketplace")}
          data-testid="button-back-to-marketplace"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary">{survey.category}</Badge>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {survey.rewardAmount} {survey.rewardToken}
                </Badge>
              </div>
            </div>
            <h1 className="text-3xl font-bold">{survey.title}</h1>
            <p className="text-muted-foreground mt-2">{survey.description}</p>
          </CardHeader>
        </Card>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="pt-6">
            {currentQuestion && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">
                    {currentQuestion.questionText}
                  </h2>
                  {currentQuestion.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </div>

                {currentQuestion.questionType === "multiple_choice" && currentQuestion.options && (
                  <RadioGroup
                    value={answers[currentQuestion.id]}
                    onValueChange={handleAnswer}
                  >
                    <div className="space-y-3">
                      {(currentQuestion.options as string[]).map((option: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 border rounded-lg p-4 hover-elevate"
                        >
                          <RadioGroupItem
                            value={option}
                            id={`option-${index}`}
                            data-testid={`radio-option-${index}`}
                          />
                          <Label
                            htmlFor={`option-${index}`}
                            className="flex-1 cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.questionType === "text" && (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="min-h-[150px]"
                    data-testid="textarea-answer"
                  />
                )}

                {currentQuestion.questionType === "rating" && (
                  <RadioGroup
                    value={answers[currentQuestion.id]}
                    onValueChange={handleAnswer}
                  >
                    <div className="flex gap-3 justify-center">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div key={rating} className="flex flex-col items-center gap-2">
                          <RadioGroupItem
                            value={rating.toString()}
                            id={`rating-${rating}`}
                            className="w-12 h-12"
                            data-testid={`radio-rating-${rating}`}
                          />
                          <Label
                            htmlFor={`rating-${rating}`}
                            className="cursor-pointer text-sm"
                          >
                            {rating}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Very Poor</span>
                      <span>Excellent</span>
                    </div>
                  </RadioGroup>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              data-testid="button-previous"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={submitResponsesMutation.isPending}
              data-testid="button-next"
              className="gap-2"
            >
              {isLastQuestion ? (
                <>
                  {submitResponsesMutation.isPending ? "Submitting..." : "Submit"}
                  <CheckCircle className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <RewardSelectionModal
        open={showRewardModal}
        onOpenChange={setShowRewardModal}
        amount={survey?.rewardAmount || "0"}
        defaultToken={survey?.rewardToken || "B3TR"}
        onConfirm={handleRewardConfirm}
        isPending={submitResponsesMutation.isPending}
      />
      
      <BadgeNotification
        badge={newBadge}
        onClose={() => setNewBadge(null)}
      />
    </div>
  );
}
