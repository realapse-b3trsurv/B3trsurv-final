import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SurveyStorage, Survey } from "@/lib/storage";

export default function Marketplace() {
  const [surveys, setSurveys] = useState<Survey[]>([]);

  // Load surveys from our "Database" when the page opens
  useEffect(() => {
    setSurveys(SurveyStorage.getAll());
  }, []);

  return (
    <div className="container py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Survey Marketplace</h1>
        <p className="text-muted-foreground">Earn B3TR by participating in verified research.</p>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-medium mb-2">No Active Surveys</h3>
          <p className="text-muted-foreground mb-4">Check back later or create your own.</p>
          <Link href="/create-survey">
            <Button variant="outline">Create First Survey</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => (
            <Card key={survey.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Earn {survey.reward} B3TR
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(survey.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="line-clamp-2">{survey.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {survey.description}
                </p>
                <p className="mt-4 text-xs font-medium">
                  {survey.questions.length} Questions • Verified
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/survey/${survey.id}`}>
                  <Button className="w-full">Take Survey</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
