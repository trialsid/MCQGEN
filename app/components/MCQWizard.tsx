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
import MCQQuestionUploader from "./MCQQuestionUploader";
import { TestDetails } from "../../lib/types/types";

export default function MCQWizard() {
  const [step, setStep] = useState(1);
  const [testDetails, setTestDetails] = useState<TestDetails>({
    collegeName: "",
    collegeAddress: "",
    testName: "",
    testNumber: "",
  });

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all required fields are filled
    if (
      !testDetails.collegeName ||
      !testDetails.testName ||
      !testDetails.testNumber
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  console.log("Current testDetails:", testDetails); // Debug log

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Test Details
              </CardTitle>
              <CardDescription className="text-center">
                Enter the institution and test details
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleDetailsSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="collegeName">College Name</Label>
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
                    placeholder="Enter college name"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collegeAddress">
                    College Address/Location
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
                    placeholder="Enter college address or location"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testName">Test Name</Label>
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
                    placeholder="Enter test name (e.g., Monthly Test, Unit Test)"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testNumber">Test Number</Label>
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
                    placeholder="Enter test number (e.g., 01, 02)"
                    className="w-full"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Continue to Question Upload
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            ← Back to Test Details
          </Button>
          <div className="text-right">
            <h3 className="font-medium text-gray-900">
              {testDetails.collegeName}
            </h3>
            <p className="text-sm text-gray-500">
              {testDetails.testName} - #{testDetails.testNumber}
            </p>
          </div>
        </div>
        <MCQQuestionUploader testDetails={testDetails} />
      </div>
    </div>
  );
}
