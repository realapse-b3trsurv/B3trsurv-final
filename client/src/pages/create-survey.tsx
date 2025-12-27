import { useState } from "react";
import { useLocation } from "wouter";
import { useWallet } from "@/lib/wallet-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SurveyStorage } from "@/lib/storage"; // Import our new database

export default function CreateSurvey() {
  const [, setLocation] = useLocation();
  const { isConnected } = useWallet();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPerUser, setRewardPerUser] = useState("10"); // Default reward
  const [questions, setQuestions] = useState([{ text: "" }]);

  // THE FEES
  const PLATFORM_FEE = 5; // Fee paid to YOU (The Admin)
  
  const handleAddQuestion = () => setQuestions([...questions, { text: "" }]);
  
  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, val: string) => {
    const newQ = [...questions];
    newQ[idx].text = val;
    setQuestions(newQ);
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      toast({ title: "Wallet Required", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    if (!title || !description) {
      toast({ title: "Missing Fields", description: "Please fill in title and description.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // Simulate Blockchain Transaction
    setTimeout(() => {
      // 1. Save to our local database
      SurveyStorage.add({
        title,
        description,
        reward: Number(rewardPerUser),
        fee: PLATFORM_FEE,
        questions
      });

      setIsLoading(false);
      toast({ 
        title: "Survey Created!", 
        description: `Fee paid: ${PLATFORM_FEE} B3TR. Users will earn ${rewardPerUser} B3TR.` 
      });
      setLocation("/marketplace"); // Send user to marketplace to see it
    }, 2000);
  };

  return (
    <div className="container max-w-2xl py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Survey</h1>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex flex-col items-end">
          <span>Platform Fee: {PLATFORM_FEE} B3TR</span>
          <span className="text-xs opacity-70">(Paid to Admin)</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Survey Title</label>
          <Input placeholder="E.g., Crypto Usage 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea placeholder="What is this survey about?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            Reward per Taker (B3TR) <Info className="h-4 w-4 text-muted-foreground" />
          </label>
          <Input type="number" value={rewardPerUser} onChange={(e) => setRewardPerUser(e.target.value)} />
          <p className="text-xs text-muted-foreground">This amount is paid to each person who completes the survey.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Questions</label>
            <Button variant="outline" size="sm" onClick={handleAddQuestion}><Plus className="h-4 w-4 mr-2" /> Add</Button>
          </div>
          
          {questions.map((q, idx) => (
            <div key={idx} className="flex gap-2">
              <Input placeholder={`Question ${idx + 1}`} value={q.text} onChange={(e) => handleQuestionChange(idx, e.target.value)} />
              {questions.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              )}
            </div>
          ))}
        </div>

        <Button className="w-full h-12 text-lg" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Blockchain...</> : "Publish Survey & Pay Fee"}
        </Button>
      </div>
    </div>
  );
}
