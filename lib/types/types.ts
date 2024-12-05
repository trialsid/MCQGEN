// lib/types/types.ts
export interface TestDetails {
  collegeName: string;
  collegeAddress: string;
  testName: string;
  testNumber: string;
}

export interface Question {
  question: string;
  choices: string[];
  answer: string;
}
