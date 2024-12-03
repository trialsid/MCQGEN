"use client";

import { useState } from "react";
import { generateMCQSets, generateCSVAnswerKey } from "@/lib/mcq/mcq-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { TestDetails } from "../../lib/types/types";

interface Question {
  question: string;
  choices: string[];
  answer: string;
}

interface MCQUploaderProps {
  testDetails: TestDetails;
}

export default function MCQQuestionUploader({ testDetails }: MCQUploaderProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [numSets, setNumSets] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateQuestions = (data: any): data is { questions: Question[] } => {
    if (!Array.isArray(data?.questions)) return false;

    return data.questions.every(
      (q: any) =>
        typeof q.question === "string" &&
        Array.isArray(q.choices) &&
        q.choices.every((c: any) => typeof c === "string") &&
        typeof q.answer === "string" &&
        q.choices.includes(q.answer)
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files?.[0]) return;

    try {
      const file = e.target.files[0];
      const content = await file.text();
      const data = JSON.parse(content);

      if (!validateQuestions(data)) {
        throw new Error("Invalid question format in JSON file");
      }

      setQuestions(data.questions);
    } catch (error) {
      console.error("Error loading questions:", error);
      setError(
        "Error loading questions file. Please ensure it's valid JSON with the correct format."
      );
    }
  };

  const handleGenerate = async () => {
    if (questions.length === 0) {
      setError("Please upload questions first.");
      return;
    }

    if (!testDetails?.collegeName) {
      setError(
        "Test details are incomplete. Please go back and fill in all required fields."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Generating MCQ sets with testDetails:", testDetails); // Debug log

      const { pdfs, answerKeys } = generateMCQSets(
        questions,
        numSets,
        testDetails
      );

      // Download PDFs
      pdfs.forEach((pdf, index) => {
        const isAnswer = index % 2 === 1;
        const setLetter = String.fromCharCode(65 + Math.floor(index / 2));
        const filename = `${testDetails.collegeName}_${
          testDetails.testName
        }_Set${setLetter}${isAnswer ? "_answers" : ""}.pdf`;

        const url = URL.createObjectURL(pdf);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      // Download CSV answer key
      const csvBlob = await generateCSVAnswerKey(answerKeys);
      const csvUrl = URL.createObjectURL(csvBlob);
      const a = document.createElement("a");
      a.href = csvUrl;
      a.download = `${testDetails.collegeName}_${testDetails.testName}_answer_key.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(csvUrl);
    } catch (error) {
      console.error("Error generating MCQ sets:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error generating MCQ sets. Please ensure all details are filled correctly."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Upload Questions (JSON)
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Sets
          </label>
          <input
            type="number"
            min="1"
            max="26"
            value={numSets}
            onChange={(e) => setNumSets(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm
              focus:border-blue-500 focus:ring-blue-500 sm:text-sm
              p-2 border"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || questions.length === 0}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate MCQ Sets"
          )}
        </Button>

        {questions.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h2 className="text-sm font-medium text-gray-700 mb-2">
              Loaded Questions: {questions.length}
            </h2>
            <div className="max-h-40 overflow-y-auto">
              {questions.map((q, idx) => (
                <div key={idx} className="text-sm text-gray-600 mb-2">
                  {idx + 1}. {q.question.substring(0, 100)}
                  {q.question.length > 100 && "..."}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <h3 className="font-medium mb-2">Instructions:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Upload a JSON file containing your questions</li>
            <li>
              Format should be:{" "}
              {`{ "questions": [{ "question": "...", "choices": ["A", "B", "C", "D"], "answer": "A" }] }`}
            </li>
            <li>Select the number of different sets to generate (max 26)</li>
            <li>Click Generate to create PDFs for each set and answer keys</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
