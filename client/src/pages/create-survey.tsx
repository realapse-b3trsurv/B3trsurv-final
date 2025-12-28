import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useWallet as useVeChainWallet } from "@vechain/dapp-kit-react"; // Direct access
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, Info, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SurveyStorage } from "@/lib/storage";

export default function CreateSurvey() {
  const [, setLocation] = useLocation();
  // We use the official hook directly to avoid any "middleman" bugs
  const { account, connect } = useVeChainWallet();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPerUser, setRewardPerUser] = useState("10"); 
  const [questions, setQuestions] = useState([{ text: "" }]);
  const PLATFORM_FEE = 5; 

  // Check connection status
  const isConnected = !!account;

  const handleConnectClick = () => {
    console.log("Attempting to connect...");
    if (connect) {
      connect(); // This calls the library directly
    } else {
      alert("Wallet system not ready. Please refresh.");
    }
  };
  
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

    setTimeout(() => {
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
      setLocation("/marketplace"); 
    }, 2000);
  };

  // --- LOGIN SCREEN ---
  if (!isConnected) {
    return (
      <div className="container max-w-2xl py-12 px-4 flex flex-col items-center text-center space-y-6">
        <div className="bg-primary/10 p-6 rounded-full">
          <Wallet className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Connect Your Wallet</h1>
        <p className="text-muted-foreground max-w-md">
          You need to connect your VeChain wallet to create surveys.
        </p>
        <Button size="lg" onClick={handleConnectClick} className="gap-2 min-w-[200px]">
          Connect Wallet to Start
        </Button>
      </div>
    );
  }

  // --- SURVEY FORM ---
  return (
    <div className="container max-w-2xl py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Survey</h1>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex flex-col items-end">
          <span>Fee: {PLATFORM_FEE} B3TR</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Survey Title</label>
          <Input placeholder="E.g., Consumer Preferences 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
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
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Publish Survey"}
        </Button>
      </div>
    </div>
  );
}
