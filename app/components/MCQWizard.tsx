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
import { TestDetails } from "../../lib/types/types";
import { ArrowLeft } from "lucide-react";

export default function MCQWizard() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
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
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
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
              Question Upload
            </span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${step === 1 ? "50%" : "100%"}` }}
            />
          </div>
        </div>

        {step === 1 ? (
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
                  <Label
                    htmlFor="collegeName"
                    className="text-blue-900 text-lg"
                  >
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
                    className="rounded-xl h-12 border-blue-200 focus:border-blue-400 text-lg"
                  />
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="collegeAddress"
                    className="text-blue-900 text-lg"
                  >
                    Location
                  </Label>
                  <Input
                    id="collegeAddress"
                    required
                    value={testDetails.collegeAddress}
                    onChange={(e) =>
                      setTestDetails((prev) => ({
                        ...prev,
                        collegeAddress: e.target.value,
                      }))
                    }
                    placeholder="City, State"
                    className="rounded-xl h-12 border-blue-200 focus:border-blue-400 text-lg"
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
                      className="rounded-xl h-12 border-blue-200 focus:border-blue-400 text-lg"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label
                      htmlFor="testNumber"
                      className="text-blue-900 text-lg"
                    >
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
                      className="rounded-xl h-12 border-blue-200 focus:border-blue-400 text-lg"
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
        ) : (
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
              <div className="text-right">
                <h3 className="font-medium text-blue-900 text-xl">
                  {testDetails.collegeName}
                </h3>
                <p className="text-blue-600">
                  {testDetails.testName} #{testDetails.testNumber}
                </p>
              </div>
            </div>
            <MCQQuestionUploader testDetails={testDetails} />
          </div>
        )}
      </div>
    </div>
  );
}
