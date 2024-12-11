"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MCQQuestionUploader from "./MCQQuestionUploader";
import AIQuestionGenerator from "./AIQuestionGenerator";
import QuestionSourceManager from "./QuestionSourceManager";
import { TestDetails, Question } from "@/lib/types/types";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function MCQWizard() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"file" | "ai">("file");
  const [uploadedQuestions, setUploadedQuestions] = useState<Question[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedUploadedQuestions, setSelectedUploadedQuestions] = useState<
    Question[]
  >([]);
  const [selectedGeneratedQuestions, setSelectedGeneratedQuestions] = useState<
    Question[]
  >([]);
  const [testDetails, setTestDetails] = useState<TestDetails>({
    collegeName: "",
    collegeAddress: "",
    testName: "",
    testNumber: "",
  });

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !testDetails.collegeName ||
      !testDetails.testName ||
      !testDetails.testNumber
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    const hasSelectedQuestions =
      uploadMethod === "file"
        ? selectedUploadedQuestions.length > 0
        : selectedGeneratedQuestions.length > 0;

    if (!hasSelectedQuestions) {
      setError("Please select some questions before proceeding");
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleUploadedQuestions = (questions: Question[]) => {
    setUploadedQuestions(questions);
    // Maintain existing selections that are still present in the new questions
    setSelectedUploadedQuestions((prev) =>
      prev.filter((selected) =>
        questions.some((q) => q.question === selected.question)
      )
    );
  };

  const handleGeneratedQuestions = (questions: Question[]) => {
    setGeneratedQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions, ...questions];
      // Remove duplicates based on question text
      return Array.from(
        new Map(newQuestions.map((q) => [q.question, q])).values()
      );
    });
  };

  const handleUploadedQuestionSelect = (questions: Question[]) => {
    setSelectedUploadedQuestions(questions);
  };

  const handleGeneratedQuestionSelect = (questions: Question[]) => {
    setSelectedGeneratedQuestions(questions);
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span
          className={`text-sm font-medium ${
            step >= 1 ? "text-blue-600" : "text-gray-500"
          }`}
        >
          Test Details
        </span>
        <span
          className={`text-sm font-medium ${
            step >= 2 ? "text-blue-600" : "text-gray-500"
          }`}
        >
          Add Questions
        </span>
        <span
          className={`text-sm font-medium ${
            step >= 3 ? "text-blue-600" : "text-gray-500"
          }`}
        >
          Generate Papers
        </span>
      </div>
      <div className="h-2 bg-blue-100 rounded-full">
        <div
          className="h-2 bg-blue-600 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <Card className="border-0 shadow-lg rounded-3xl">
      <CardHeader className="space-y-1 p-8">
        <CardTitle className="text-2xl text-center text-blue-900">
          Test Configuration
        </CardTitle>
        <CardDescription className="text-center text-blue-600 text-lg">
          Enter your institution and test details
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleDetailsSubmit}>
        <CardContent className="space-y-6 p-8">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-200 rounded-2xl"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label htmlFor="collegeName" className="text-blue-900 text-lg">
              Institution Name
            </Label>
            <Input
              id="collegeName"
              required
              value={testDetails.collegeName}
              onChange={(e) =>
                setTestDetails((prev) => ({
                  ...prev,
                  collegeName: e.target.value,
                }))
              }
              placeholder="Enter your institution name"
              className="rounded-xl h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-200 focus:outline-none text-lg"
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="collegeAddress" className="text-blue-900 text-lg">
              Location
            </Label>
            <Input
              id="collegeAddress"
              value={testDetails.collegeAddress}
              onChange={(e) =>
                setTestDetails((prev) => ({
                  ...prev,
                  collegeAddress: e.target.value,
                }))
              }
              placeholder="City, State"
              className="rounded-xl h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-200 focus:outline-none text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="testName" className="text-blue-900 text-lg">
                Test Name
              </Label>
              <Input
                id="testName"
                required
                value={testDetails.testName}
                onChange={(e) =>
                  setTestDetails((prev) => ({
                    ...prev,
                    testName: e.target.value,
                  }))
                }
                placeholder="Monthly Test"
                className="rounded-xl h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-200 focus:outline-none text-lg"
              />
            </div>
            <div className="space-y-4">
              <Label htmlFor="testNumber" className="text-blue-900 text-lg">
                Test Number
              </Label>
              <Input
                id="testNumber"
                required
                value={testDetails.testNumber}
                onChange={(e) =>
                  setTestDetails((prev) => ({
                    ...prev,
                    testNumber: e.target.value,
                  }))
                }
                placeholder="01"
                className="rounded-xl h-12 border-blue-200 focus:border-blue-400 focus:ring-blue-200 focus:outline-none text-lg"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-8">
          <Button
            type="submit"
            className="w-full h-14 text-lg rounded-2xl bg-blue-600 hover:bg-blue-700 transform transition-all hover:scale-102 active:scale-98"
          >
            Continue to Questions
          </Button>
        </CardFooter>
      </form>
    </Card>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/80 backdrop-blur p-4 rounded-2xl shadow-lg">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-blue-600 hover:text-blue-700 text-lg rounded-xl h-12"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          className="text-white bg-blue-600 hover:bg-blue-700 text-lg rounded-xl h-12"
          disabled={
            uploadMethod === "file"
              ? selectedUploadedQuestions.length === 0
              : selectedGeneratedQuestions.length === 0
          }
        >
          Next
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Method Selection Card */}
      <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
        <CardContent className="p-8">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="default"
              onClick={() => setUploadMethod("file")}
              className={`h-14 text-lg rounded-2xl transition-all duration-300 ${
                uploadMethod === "file"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "bg-white !text-blue-600 border-2 !border-blue-100 hover:bg-blue-50"
              }`}
            >
              Upload JSON File
            </Button>
            <Button
              variant="default"
              onClick={() => setUploadMethod("ai")}
              className={`h-14 text-lg rounded-2xl transition-all duration-300 ${
                uploadMethod === "ai"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "bg-white !text-blue-600 border-2 !border-blue-100 hover:bg-blue-50"
              }`}
            >
              Generate with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert
          variant="destructive"
          className="bg-red-50 border-red-200 rounded-2xl"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadMethod === "file" ? (
        <MCQQuestionUploader
          onQuestionsUploaded={handleUploadedQuestions}
          questions={uploadedQuestions}
          selectedQuestions={selectedUploadedQuestions}
          onQuestionSelect={handleUploadedQuestionSelect}
        />
      ) : (
        <AIQuestionGenerator
          onQuestionsGenerated={handleGeneratedQuestions}
          questions={generatedQuestions}
          selectedQuestions={selectedGeneratedQuestions}
          onQuestionSelect={handleGeneratedQuestionSelect}
        />
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/80 backdrop-blur p-4 rounded-2xl shadow-lg">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-blue-600 hover:text-blue-700 text-lg rounded-xl h-12"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
      </div>

      <QuestionSourceManager
        uploadedQuestions={selectedUploadedQuestions}
        generatedQuestions={selectedGeneratedQuestions}
        testDetails={testDetails}
      />
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {renderProgressBar()}
        {renderStep()}
      </div>
    </div>
  );
}
