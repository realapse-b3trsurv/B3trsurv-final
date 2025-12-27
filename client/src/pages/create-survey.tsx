import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateBusinessFee } from "@shared/fee-config";

const questionSchema = z.object({
  questionText: z.string().min(5, "Question must be at least 5 characters"),
  questionType: z.enum(["multiple_choice", "text", "rating"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
});

const surveyFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  rewardAmount: z.string().min(1, "Reward amount is required"),
  rewardToken: z.string().default("B3TR"),
  maxResponses: z.string().optional(),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
});

type SurveyFormValues = z.infer<typeof surveyFormSchema>;

export default function CreateSurvey() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionType, setCurrentQuestionType] = useState<string>("multiple_choice");

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      rewardAmount: "5.0",
      rewardToken: "B3TR",
      maxResponses: "",
      questions: [],
    },
  });

  const rewardAmount = parseFloat(form.watch("rewardAmount") || "0");
  const maxResponses = parseInt(form.watch("maxResponses") || "0");
  const totalBudget = rewardAmount * maxResponses;
  const businessFee = maxResponses > 0 ? calculateBusinessFee(totalBudget) : null;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const createSurveyMutation = useMutation({
    mutationFn: async (data: SurveyFormValues) => {
      return await apiRequest("POST", "/api/surveys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Survey created!",
        description: "Your survey is now live in the marketplace.",
      });
      setLocation("/marketplace");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SurveyFormValues) => {
    createSurveyMutation.mutate(data);
  };

  const addQuestion = () => {
    append({
      questionText: "",
      questionType: currentQuestionType as any,
      options: currentQuestionType === "multiple_choice" ? ["", ""] : undefined,
      required: true,
    });
  };

  const categories = ["Demographics", "Product Research", "Political Polling", "Health & Wellness", "Technology", "General"];

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Survey</h1>
          <p className="text-muted-foreground text-lg">
            Design your survey and set up blockchain-verified rewards
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Survey Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Consumer Product Preferences Survey 2025"
                          {...field}
                          data-testid="input-survey-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this survey is about and why responses matter..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="input-survey-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-survey-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="rewardAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="5.0"
                            {...field}
                            data-testid="input-reward-amount"
                          />
                        </FormControl>
                        <FormDescription>Amount per response</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rewardToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward Token</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-reward-token">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="B3TR">B3TR</SelectItem>
                            <SelectItem value="VET">VET</SelectItem>
                            <SelectItem value="UNITY">UNITY (Truth Economy Token)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>UNITY is the currency of verified truth, earned through honest participation and burned through platform usage.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="maxResponses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Responses (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Leave empty for unlimited"
                          {...field}
                          data-testid="input-max-responses"
                        />
                      </FormControl>
                      <FormDescription>
                        Limit the number of responses to control costs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {businessFee && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Info className="h-4 w-4" />
                      <span>Cost Breakdown</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Reward Budget:</span>
                        <span className="font-mono">{businessFee.totalBudget.toFixed(2)} {form.watch("rewardToken")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee ({businessFee.feePercentage}%):</span>
                        <span className="font-mono text-muted-foreground">+{businessFee.feeAmount.toFixed(2)} {form.watch("rewardToken")}</span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className="flex justify-between font-semibold">
                        <span>Total Cost:</span>
                        <span className="font-mono text-primary">{(businessFee.totalBudget + businessFee.feeAmount).toFixed(2)} {form.watch("rewardToken")}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      The platform fee supports infrastructure costs and platform development
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-2">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                        <div className="flex-1 space-y-4">
                          <FormField
                            control={form.control}
                            name={`questions.${index}.questionText`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question {index + 1}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your question..."
                                    {...field}
                                    data-testid={`input-question-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`questions.${index}.questionType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-question-type-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="text">Text Response</SelectItem>
                                    <SelectItem value="rating">Rating (1-5)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch(`questions.${index}.questionType`) === "multiple_choice" && (
                            <div className="space-y-2">
                              <FormLabel>Options</FormLabel>
                              {(form.watch(`questions.${index}.options`) || []).map((_, optIndex) => (
                                <Input
                                  key={optIndex}
                                  placeholder={`Option ${optIndex + 1}`}
                                  value={form.watch(`questions.${index}.options.${optIndex}`) || ""}
                                  onChange={(e) => {
                                    const options = [...(form.watch(`questions.${index}.options`) || [])];
                                    options[optIndex] = e.target.value;
                                    form.setValue(`questions.${index}.options`, options);
                                  }}
                                  data-testid={`input-option-${index}-${optIndex}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          data-testid={`button-remove-question-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-2">
                  <Select value={currentQuestionType} onValueChange={setCurrentQuestionType}>
                    <SelectTrigger className="w-[200px]" data-testid="select-new-question-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="text">Text Response</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    className="gap-2"
                    data-testid="button-add-question"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={createSurveyMutation.isPending}
                data-testid="button-submit-survey"
              >
                {createSurveyMutation.isPending ? "Creating..." : "Create Survey"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setLocation("/marketplace")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
