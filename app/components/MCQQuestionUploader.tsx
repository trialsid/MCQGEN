import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Search,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CheckSquare2,
} from "lucide-react";
import { Question } from "@/lib/types/types";

interface MCQUploaderProps {
  onQuestionsUploaded: (questions: Question[]) => void;
  questions: Question[];
  selectedQuestions: Question[];
  onQuestionSelect: (questions: Question[]) => void;
}

interface DragDropZoneProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  status: "idle" | "loading" | "success" | "error";
}

interface QuestionData {
  questions: Question[];
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

export default function MCQQuestionUploader({
  onQuestionsUploaded,
  questions: existingQuestions,
  selectedQuestions,
  onQuestionSelect,
}: MCQUploaderProps) {
  const [questions, setQuestions] = useState<Question[]>(existingQuestions);
  const [filteredQuestions, setFilteredQuestions] =
    useState<Question[]>(existingQuestions);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [searchQuery, setSearchQuery] = useState("");

  const validateQuestions = (data: unknown): data is QuestionData => {
    if (!data || typeof data !== "object") return false;
    const questionData = data as QuestionData;

    if (!Array.isArray(questionData?.questions)) {
      console.error("Questions property is not an array");
      return false;
    }

    return questionData.questions.every((q: unknown) => {
      if (!q || typeof q !== "object") {
        console.error("Question item is not an object");
        return false;
      }

      const question = q as Question;
      const isValid =
        typeof question.question === "string" &&
        Array.isArray(question.choices) &&
        question.choices.every((c) => typeof c === "string") &&
        typeof question.answer === "string" &&
        question.choices.includes(question.answer);

      if (!isValid) {
        console.error("Invalid question format:", question);
        console.error(
          "- Question text is string:",
          typeof question.question === "string"
        );
        console.error("- Choices is array:", Array.isArray(question.choices));
        console.error(
          "- All choices are strings:",
          question.choices?.every((c) => typeof c === "string")
        );
        console.error(
          "- Answer is string:",
          typeof question.answer === "string"
        );
        console.error(
          "- Answer is in choices:",
          question.choices?.includes(question.answer)
        );
      }

      return isValid;
    });
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files?.[0]) return;

    setUploadStatus("loading");
    try {
      const file = e.target.files[0];
      const content = await file.text();
      let data;

      try {
        data = JSON.parse(content);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(
          "Invalid JSON format. Please check your file structure."
        );
      }

      if (!validateQuestions(data)) {
        throw new Error(
          "Invalid question format in JSON file. Each question must have: question (string), choices (array of strings), and answer (string that matches one of the choices)."
        );
      }

      setQuestions(data.questions);
      setFilteredQuestions(data.questions);
      onQuestionsUploaded(data.questions);
      setUploadStatus("success");
    } catch (error) {
      console.error("Error loading questions:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error loading questions file. Please ensure it's valid JSON with the correct format."
      );
      setUploadStatus("error");
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
              Upload Questions
            </CardTitle>
            <CardDescription className="text-blue-600 text-lg">
              Upload your questions file in JSON format
            </CardDescription>
          </div>
          {questions.length > 0 && (
            <div className="text-blue-600">
              {selectedQuestions.length} of {questions.length} selected
            </div>
          )}
        </div>
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

        {questions.length > 0 && (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
