import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wand2 } from "lucide-react";

interface AIQuestionGeneratorProps {
  onQuestionsGenerated: (questions: any[]) => void;
}

export default function AIQuestionGenerator({
  onQuestionsGenerated,
}: AIQuestionGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleGenerate = async () => {
    if (!subject || !grade) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          grade,
          questionCount,
          customPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      onQuestionsGenerated(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
      <CardHeader className="p-8 border-b">
        <CardTitle className="text-2xl text-blue-900">
          AI Question Generator
        </CardTitle>
        <CardDescription className="text-blue-600 text-lg">
          Generate questions using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {error && (
          <Alert
            variant="destructive"
            className="bg-red-50 border-red-200 rounded-2xl"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Label htmlFor="subject" className="text-blue-900 text-lg">
            Subject
          </Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Mathematics, Science, History"
            className="rounded-xl h-12"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="grade" className="text-blue-900 text-lg">
            Grade/Standard
          </Label>
          <Input
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="e.g., 7th, 8th, 9th"
            className="rounded-xl h-12"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="questionCount" className="text-blue-900 text-lg">
            Number of Questions
          </Label>
          <Input
            id="questionCount"
            type="number"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            min={1}
            max={50}
            className="rounded-xl h-12"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="customPrompt" className="text-blue-900 text-lg">
            Custom Prompt (Optional)
          </Label>
          <Input
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter custom instructions for the AI"
            className="rounded-xl h-12"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5" />
              Generate Questions
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
