"use client";

import { useState } from "react";
import { generateMCQSets, generateCSVAnswerKey } from "@/lib/mcq/mcq-generator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Download,
} from "lucide-react";
import { TestDetails } from "../../lib/types/types";

interface Question {
  question: string;
  choices: string[];
  answer: string;
}

interface MCQUploaderProps {
  testDetails: TestDetails;
}

interface GenerateOptions {
  questionPDFs: boolean;
  answerPDFs: boolean;
  answerCSV: boolean;
}

const QuestionPreview = ({
  question,
  index,
}: {
  question: Question;
  index: number;
}) => (
  <div className="p-6 bg-blue-50/50 rounded-2xl space-y-3 transform transition-all hover:scale-102">
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
        {index + 1}
      </span>
      <p className="text-blue-900 text-lg">{question.question}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-11">
      {question.choices.map((choice, idx) => (
        <div
          key={idx}
          className={`p-3 rounded-xl ${
            choice === question.answer
              ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
              : "bg-white text-gray-600"
          }`}
        >
          {String.fromCharCode(65 + idx)}. {choice}
        </div>
      ))}
    </div>
  </div>
);

export default function MCQQuestionUploader({ testDetails }: MCQUploaderProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [numSets, setNumSets] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>({
    questionPDFs: true,
    answerPDFs: true,
    answerCSV: true,
  });

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

    setUploadStatus("loading");
    try {
      const file = e.target.files[0];
      const content = await file.text();
      const data = JSON.parse(content);

      if (!validateQuestions(data)) {
        throw new Error("Invalid question format in JSON file");
      }

      setQuestions(data.questions);
      setUploadStatus("success");
    } catch (error) {
      console.error("Error loading questions:", error);
      setError(
        "Error loading questions file. Please ensure it's valid JSON with the correct format."
      );
      setUploadStatus("error");
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

    if (
      !generateOptions.questionPDFs &&
      !generateOptions.answerPDFs &&
      !generateOptions.answerCSV
    ) {
      setError("Please select at least one output option");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { pdfs, answerKeys } = generateMCQSets(
        questions,
        numSets,
        testDetails
      );

      // Download PDFs
      if (generateOptions.questionPDFs || generateOptions.answerPDFs) {
        pdfs.forEach((pdf, index) => {
          const isAnswer = index % 2 === 1;
          if (
            (isAnswer && !generateOptions.answerPDFs) ||
            (!isAnswer && !generateOptions.questionPDFs)
          ) {
            return;
          }

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
      }

      // Download CSV answer key
      if (generateOptions.answerCSV) {
        const csvBlob = await generateCSVAnswerKey(answerKeys);
        const csvUrl = URL.createObjectURL(csvBlob);
        const a = document.createElement("a");
        a.href = csvUrl;
        a.download = `${testDetails.collegeName}_${testDetails.testName}_answer_key.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(csvUrl);
      }
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
    <div className="space-y-6">
      <Card className="rounded-3xl border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl text-blue-900">
            Upload Questions
          </CardTitle>
          <CardDescription className="text-blue-600 text-lg">
            Upload your questions and choose generation options
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 rounded-2xl"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label className="text-blue-900 text-lg">
              Question File (JSON)
            </Label>
            <div
              className={`border-3 border-dashed rounded-2xl p-8 text-center transition-all duration-300 
              ${
                uploadStatus === "success"
                  ? "border-green-400 bg-green-50"
                  : uploadStatus === "error"
                  ? "border-red-400 bg-red-50"
                  : "border-blue-200 hover:border-blue-400"
              }`}
            >
              {uploadStatus === "success" ? (
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
              ) : uploadStatus === "error" ? (
                <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
              ) : (
                <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              )}

              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-lg block mb-2"
              >
                {uploadStatus === "success" ? (
                  <span className="text-green-600">
                    File uploaded successfully
                  </span>
                ) : uploadStatus === "error" ? (
                  <span className="text-red-600">
                    Upload failed - try again
                  </span>
                ) : (
                  <span className="text-blue-600 hover:text-blue-700">
                    Click to upload or drag and drop
                  </span>
                )}
              </label>
              <p className="text-sm text-gray-500">JSON files only</p>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-blue-900 text-lg">Number of Sets</Label>
            <Input
              type="number"
              min="1"
              max="26"
              value={numSets}
              onChange={(e) => setNumSets(Number(e.target.value))}
              className="rounded-xl h-12 border-blue-200 focus:border-blue-400 text-lg"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-blue-900 text-lg">Output Options</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Question Papers
                    </h3>
                    <p className="text-sm text-blue-600">
                      Test papers without answers
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={generateOptions.questionPDFs}
                  onChange={(e) =>
                    setGenerateOptions((prev) => ({
                      ...prev,
                      questionPDFs: e.target.checked,
                    }))
                  }
                  className="h-6 w-6 rounded-lg accent-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">Answer Papers</h3>
                    <p className="text-sm text-blue-600">
                      Test papers with answers marked
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={generateOptions.answerPDFs}
                  onChange={(e) =>
                    setGenerateOptions((prev) => ({
                      ...prev,
                      answerPDFs: e.target.checked,
                    }))
                  }
                  className="h-6 w-6 rounded-lg accent-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Download className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Answer Key CSV
                    </h3>
                    <p className="text-sm text-blue-600">
                      Downloadable spreadsheet of correct answers
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={generateOptions.answerCSV}
                  onChange={(e) =>
                    setGenerateOptions((prev) => ({
                      ...prev,
                      answerCSV: e.target.checked,
                    }))
                  }
                  className="h-6 w-6 rounded-lg accent-blue-600"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || questions.length === 0}
            className="w-full h-14 text-lg rounded-2xl bg-blue-600 hover:bg-blue-700 transform transition-all hover:scale-102 active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Files...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Generate {numSets} {numSets === 1 ? "Set" : "Sets"}
              </>
            )}
          </Button>

          <div className="mt-4 text-sm text-gray-500">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Upload a JSON file containing your questions</li>
              <li>
                Format should be:{" "}
                {`{ "questions": [{ "question": "...", "choices": ["A", "B", "C", "D"], "answer": "A" }] }`}
              </li>
              <li>Select the number of different sets to generate (max 26)</li>
              <li>Choose which files you want to generate</li>
              <li>Click Generate to create your selected files</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card className="rounded-3xl border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl text-blue-900">
              Loaded Questions ({questions.length})
            </CardTitle>
            <CardDescription className="text-blue-600 text-lg">
              Preview your uploaded questions and answers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionPreview
                  key={index}
                  question={question}
                  index={index}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
