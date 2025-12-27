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
import { Plus, Trash2, Loader2, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fixed: Define fee locally instead of importing from missing file
const SURVEY_CREATION_FEE = 50;

const surveySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  questions: z.array(z.object({
    text: z.string().min(1, "Question text is required"),
    type: z.enum(["single", "multiple", "text"]),
    options: z.array(z.string()).optional(),
  })).min(1, "At least one question is required"),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

export default function CreateSurvey() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [{ text: "", type: "single", options: ["Yes", "No"] }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = async (data: SurveyFormValues) => {
    // Simulation of submission for the demo
    toast({
      title: "Survey Created",
      description: `Success! Fee of ${SURVEY_CREATION_FEE} B3TR would be deducted.`,
    });
    // Redirect to dashboard after delay
    setTimeout(() => setLocation("/dashboard"), 1000);
  };

  return (
    <div className="container max-w-3xl py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex justify-between items-center">
            Create New Survey
            <div className="text-sm font-normal bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Cost: {SURVEY_CREATION_FEE} B3TR
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Survey Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Consumer Preferences 2025" {...field} />
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
                      <Textarea placeholder="What is this survey about?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Questions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ text: "", type: "single", options: ["Yes", "No"] })}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Question
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 border-dashed">
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-4">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question {index + 1}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Button type="submit" size="lg" className="w-full">
                Publish Survey
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
