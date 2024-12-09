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
  Search,
} from "lucide-react";
import { TestDetails } from "../../lib/types/types";
import AIQuestionGenerator from "./AIQuestionGenerator";

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

interface QuestionData {
  questions: Question[];
}

interface SearchBarProps {
  onSearch: (query: string) => void;
}

interface DragDropZoneProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  status: "idle" | "loading" | "success" | "error";
}

const DragDropZone = ({ onUpload, status }: DragDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`relative group cursor-pointer border-3 border-dashed rounded-2xl p-12 transition-all duration-300 
      bg-gradient-to-b from-blue-50/50 to-transparent hover:from-blue-100/50
      ${isDragging ? "from-blue-100/70 scale-102" : ""}
      ${
        status === "success"
          ? "border-green-400"
          : status === "error"
          ? "border-red-400"
          : "border-blue-200 hover:border-blue-400"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file)
          onUpload({
            target: { files: [file] },
          } as unknown as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      <input
        type="file"
        className="absolute inset-0 opacity-0"
        onChange={onUpload}
        accept=".json"
        id="file-upload"
      />
      <div className="text-center space-y-4">
        <label htmlFor="file-upload" className="cursor-pointer">
          <div
            className={`w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center transition-transform duration-300
            ${isDragging ? "scale-125" : "group-hover:scale-110"}`}
          >
            {status === "success" ? (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            ) : status === "error" ? (
              <AlertCircle className="w-10 h-10 text-red-600" />
            ) : status === "loading" ? (
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            ) : (
              <Upload className="w-10 h-10 text-blue-600" />
            )}
          </div>
        </label>
        <div className="space-y-2">
          <p className="text-lg font-medium text-blue-900">
            {status === "success"
              ? "File uploaded successfully"
              : status === "error"
              ? "Upload failed - try again"
              : status === "loading"
              ? "Processing file..."
              : "Drop your file here or click to browse"}
          </p>
          <p className="text-sm text-blue-600">Accepts JSON files only</p>
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({ onSearch }: SearchBarProps) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
    <Input
      placeholder="Search questions..."
      className="pl-10 h-12 rounded-xl"
      onChange={(e) => onSearch(e.target.value)}
    />
  </div>
);

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

const QuestionPreview = ({
  question,
  index,
  searchQuery = "",
}: {
  question: Question;
  index: number;
  searchQuery?: string;
}) => (
  <div className="group">
    <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/50 to-transparent transition-all duration-300 hover:translate-x-2">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center">
          {index + 1}
        </div>
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

export default function MCQQuestionUploader({ testDetails }: MCQUploaderProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [numSets, setNumSets] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>({
    questionPDFs: true,
    answerPDFs: false,
    answerCSV: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"file" | "ai">("file");

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
      setFilteredQuestions(data.questions);
      setUploadStatus("success");
    } catch (error) {
      console.error("Error loading questions:", error);
      setError(
        "Error loading questions file. Please ensure it's valid JSON with the correct format."
      );
      setUploadStatus("error");
    }
  };

  const validateQuestions = (data: unknown): data is QuestionData => {
    if (!data || typeof data !== "object") return false;
    const questionData = data as QuestionData;
    if (!Array.isArray(questionData?.questions)) return false;
    return questionData.questions.every((q: unknown) => {
      if (!q || typeof q !== "object") return false;
      const question = q as Question;
      return (
        typeof question.question === "string" &&
        Array.isArray(question.choices) &&
        question.choices.every((c) => typeof c === "string") &&
        typeof question.answer === "string" &&
        question.choices.includes(question.answer)
      );
    });
  };

  const handleQuestionsGenerated = (generatedQuestions: Question[]) => {
    setQuestions(generatedQuestions);
    setFilteredQuestions(generatedQuestions);
    setUploadStatus("success");
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
      {/* Method Selection */}
      <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
        <CardContent className="p-8">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={uploadMethod === "file" ? "default" : "outline"}
              onClick={() => setUploadMethod("file")}
              className="h-14 text-lg rounded-2xl"
            >
              Upload JSON File
            </Button>
            <Button
              variant={uploadMethod === "ai" ? "default" : "outline"}
              onClick={() => setUploadMethod("ai")}
              className="h-14 text-lg rounded-2xl"
            >
              Generate with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Method Content */}
      {uploadMethod === "file" ? (
        <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader className="p-8 border-b">
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

            <DragDropZone onUpload={handleFileUpload} status={uploadStatus} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-blue-900 text-lg">Number of Sets</Label>
                <div
                  className="relative h-12"
                  onMouseEnter={() => (document.body.style.overflow = "hidden")}
                  onMouseLeave={() => (document.body.style.overflow = "auto")}
                  onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0 && numSets < 26)
                      setNumSets((prev) => prev + 1);
                    if (e.deltaY > 0 && numSets > 1)
                      setNumSets((prev) => prev - 1);
                  }}
                >
                  <Input
                    type="number"
                    min="1"
                    max="26"
                    value={numSets}
                    onChange={(e) => setNumSets(Number(e.target.value))}
                    className="h-full rounded-xl bg-white text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
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
                      <h3 className="font-medium text-blue-900">
                        Answer Papers
                      </h3>
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

            <div className="mt-4 text-sm text-gray-500">
              <h3 className="font-medium mb-2">Instructions:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Upload a JSON file containing your questions</li>
                <li>
                  Format should be:{" "}
                  {`{ "questions": [{ "question": "...", "choices": ["A", "B", "C", "D"], "answer": "A" }] }`}
                </li>
                <li>
                  Select the number of different sets to generate (max 26)
                </li>
                <li>Choose which files you want to generate</li>
                <li>Click Generate to create your selected files</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AIQuestionGenerator onQuestionsGenerated={handleQuestionsGenerated} />
      )}
      {questions.length > 0 && (
        <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader className="p-8 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-blue-900">
                  Loaded Questions ({filteredQuestions.length})
                </CardTitle>
                <CardDescription className="text-blue-600 text-lg">
                  Preview and manage your questions
                </CardDescription>
              </div>
              <SearchBar onSearch={handleSearch} />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {filteredQuestions.map((question, index) => (
                <QuestionPreview
                  key={index}
                  question={question}
                  index={index}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
