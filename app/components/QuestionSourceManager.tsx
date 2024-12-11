import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Loader2, Search } from "lucide-react";
import { Question, TestDetails } from "@/lib/types/types";
import { generateMCQSets, generateCSVAnswerKey } from "@/lib/mcq/mcq-generator";

type GenerationError = {
  message: string;
};

interface QuestionSourceManagerProps {
  uploadedQuestions: Question[];
  generatedQuestions: Question[];
  testDetails: TestDetails;
}

export default function QuestionSourceManager({
  uploadedQuestions,
  generatedQuestions,
  testDetails,
}: QuestionSourceManagerProps) {
  const [selectedSource, setSelectedSource] = useState<
    "uploaded" | "generated" | "combined"
  >(uploadedQuestions.length > 0 ? "uploaded" : "generated");
  const [numSets, setNumSets] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [outputOptions, setOutputOptions] = useState({
    questionPDFs: true,
    answerPDFs: false,
    answerCSV: false,
  });

  // Initialize selected questions based on source
  useMemo(() => {
    switch (selectedSource) {
      case "uploaded":
        setSelectedQuestions(uploadedQuestions);
        break;
      case "generated":
        setSelectedQuestions(generatedQuestions);
        break;
      case "combined":
        setSelectedQuestions([...uploadedQuestions, ...generatedQuestions]);
        break;
    }
  }, [selectedSource, uploadedQuestions, generatedQuestions]);

  const filteredQuestions = useMemo(() => {
    if (!searchQuery) return selectedQuestions;
    return selectedQuestions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.choices.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  }, [selectedQuestions, searchQuery]);

  const handleGenerateFiles = async () => {
    if (selectedQuestions.length === 0) {
      setError("Please select questions to generate files");
      return;
    }

    if (
      !outputOptions.questionPDFs &&
      !outputOptions.answerPDFs &&
      !outputOptions.answerCSV
    ) {
      setError("Please select at least one output option");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { pdfs, answerKeys } = generateMCQSets(
        selectedQuestions,
        numSets,
        testDetails
      );

      // Download PDFs
      if (outputOptions.questionPDFs || outputOptions.answerPDFs) {
        pdfs.forEach((pdf, index) => {
          const isAnswer = index % 2 === 1;
          if (
            (isAnswer && !outputOptions.answerPDFs) ||
            (!isAnswer && !outputOptions.questionPDFs)
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

      // Download CSV
      if (outputOptions.answerCSV) {
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
    } catch (err) {
      setError((err as Error | GenerationError).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const sourceOptions = [
    {
      id: "uploaded",
      label: "Uploaded Questions",
      count: uploadedQuestions.length,
    },
    {
      id: "generated",
      label: "AI Generated Questions",
      count: generatedQuestions.length,
    },
    {
      id: "combined",
      label: "Combined Questions",
      count: uploadedQuestions.length + generatedQuestions.length,
    },
  ].filter((option) => option.count > 0);

  return (
    <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
      <CardHeader className="p-8 border-b">
        <CardTitle className="text-2xl text-blue-900">
          Generate Question Papers
        </CardTitle>
        <CardDescription className="text-blue-600 text-lg">
          Select questions and generate papers
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

        {/* Source Selection */}
        <div className="space-y-4">
          <Label className="text-blue-900 text-lg">Question Source</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sourceOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedSource(option.id as any)}
                className={`p-4 rounded-xl transition-all ${
                  selectedSource === option.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-blue-50 text-blue-900 hover:bg-blue-100"
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm opacity-80">
                  {option.count} questions
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
            <div className="text-sm text-blue-600">
              {filteredQuestions.length} of {selectedQuestions.length} questions
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredQuestions.map((question, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-grow space-y-2">
                    <p className="text-blue-900">{question.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {question.choices.map((choice, choiceIdx) => (
                        <div
                          key={choiceIdx}
                          className={`p-2 rounded-lg ${
                            choice === question.answer
                              ? "bg-blue-100 text-blue-700"
                              : "bg-white text-gray-600"
                          }`}
                        >
                          {String.fromCharCode(65 + choiceIdx)}. {choice}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Options */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-blue-900 text-lg">Number of Sets</Label>
              <Input
                type="number"
                min="1"
                max="26"
                value={numSets}
                onChange={(e) => setNumSets(Number(e.target.value))}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-blue-900 text-lg">Output Options</Label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
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
                  checked={outputOptions.questionPDFs}
                  onChange={(e) =>
                    setOutputOptions((prev) => ({
                      ...prev,
                      questionPDFs: e.target.checked,
                    }))
                  }
                  className="h-6 w-6 rounded-lg accent-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">Answer Papers</h3>
                    <p className="text-sm text-blue-600">
                      Test papers with answers marked
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={outputOptions.answerPDFs}
                  onChange={(e) =>
                    setOutputOptions((prev) => ({
                      ...prev,
                      answerPDFs: e.target.checked,
                    }))
                  }
                  className="h-6 w-6 rounded-lg accent-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Answer Key CSV
                    </h3>
                    <p className="text-sm text-blue-600">
                      Downloadable spreadsheet of answers
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={outputOptions.answerCSV}
                  onChange={(e) =>
                    setOutputOptions((prev) => ({
                      ...prev,
                      answerCSV: e.target.checked,
                    }))
                  }
                  className="h-6 w-6 rounded-lg accent-blue-600"
                />
              </label>
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerateFiles}
          disabled={loading || selectedQuestions.length === 0}
          className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
      </CardContent>
    </Card>
  );
}
