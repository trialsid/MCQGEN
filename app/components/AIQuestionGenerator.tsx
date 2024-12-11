import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wand2, Search, CheckSquare2 } from "lucide-react";
import { Question } from "@/lib/types/types";

interface AIQuestionGeneratorProps {
  onQuestionsGenerated: (questions: Question[]) => void;
  questions: Question[];
  selectedQuestions: Question[];
  onQuestionSelect: (questions: Question[]) => void;
}

const QuestionPreview = ({
  question,
  index,
  searchQuery = "",
  isSelected,
  onToggleSelect,
}: {
  question: Question;
  index: number;
  searchQuery?: string;
  isSelected: boolean;
  onToggleSelect: () => void;
}) => {
  const highlightText = (text: string, query: string): JSX.Element => {
    if (!query) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 rounded px-1">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="group">
      <div
        onClick={onToggleSelect} // Add this
        className={`p-6 rounded-2xl transition-all duration-300 hover:translate-x-2 cursor-pointer ${
          // Add cursor-pointer
          isSelected
            ? "bg-blue-50"
            : "bg-gradient-to-r from-blue-50/50 to-transparent"
        }`}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={onToggleSelect}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
            }`}
          >
            {isSelected ? <CheckSquare2 className="w-6 h-6" /> : index + 1}
          </button>
          <div className="flex-grow space-y-4">
            <p className="text-lg text-blue-900 font-medium">
              {highlightText(question.question, searchQuery)}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.choices.map((choice, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl transition-all duration-300 ${
                    choice === question.answer
                      ? "bg-blue-100 text-blue-700 shadow-md transform hover:scale-102"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium mr-2">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {highlightText(choice, searchQuery)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AIQuestionGenerator({
  onQuestionsGenerated,
  questions: existingQuestions,
  selectedQuestions,
  onQuestionSelect,
}: AIQuestionGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [customPrompt, setCustomPrompt] = useState("");
  const [questions, setQuestions] = useState<Question[]>(existingQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQuestions, setFilteredQuestions] =
    useState<Question[]>(existingQuestions);

  useEffect(() => {
    setQuestions(existingQuestions);
    setFilteredQuestions(existingQuestions);
  }, [existingQuestions]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredQuestions(questions);
      return;
    }
    const filtered = questions.filter(
      (q) =>
        q.question.toLowerCase().includes(query.toLowerCase()) ||
        q.choices.some((c) => c.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredQuestions(filtered);
  };

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
      setQuestions(data.questions);
      setFilteredQuestions(data.questions);
      onQuestionsGenerated(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (question: Question) => {
    const isCurrentlySelected = selectedQuestions.some(
      (q) => q.question === question.question
    );

    const newSelection = isCurrentlySelected
      ? selectedQuestions.filter((q) => q.question !== question.question)
      : [...selectedQuestions, question];

    onQuestionSelect(newSelection);
  };

  const isQuestionSelected = (question: Question) =>
    selectedQuestions.some((q) => q.question === question.question);

  return (
    <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
      <CardHeader className="p-8 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-blue-900">
              AI Question Generator
            </CardTitle>
            <CardDescription className="text-blue-600 text-lg">
              Generate questions using AI
            </CardDescription>
          </div>
          {questions.length > 0 && (
            <div className="text-blue-600">
              {selectedQuestions.length} of {questions.length} selected
            </div>
          )}
        </div>
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
            className="rounded-xl h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-200 focus:outline-none text-lg"
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
            className="rounded-xl h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-200 focus:outline-none text-lg"
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
            className="rounded-xl h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-200 focus:outline-none text-lg"
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
            className="rounded-xl h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-200 focus:outline-none text-lg"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
              Generating Questions...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-5 w-5 inline" />
              Generate Questions
            </>
          )}
        </button>

        {questions.length > 0 && (
          <div className="space-y-6 mt-8 pt-8 border-t">
            <div className="flex items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
              <div className="text-sm text-blue-600">
                {filteredQuestions.length} of {questions.length} questions
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredQuestions.map((question, idx) => (
                <QuestionPreview
                  key={idx}
                  question={question}
                  index={idx}
                  searchQuery={searchQuery}
                  isSelected={isQuestionSelected(question)}
                  onToggleSelect={() => toggleQuestionSelection(question)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
