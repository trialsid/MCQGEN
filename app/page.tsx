import MCQWizard from "./components/MCQWizard";

export const metadata = {
  title: "MCQ Generator",
  description: "Generate multiple-choice question papers with answer keys",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MCQ Generator</h1>
          <p className="mt-2 text-gray-600">
            Create multiple sets of question papers with randomized options
          </p>
        </header>

        <MCQWizard />

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2024 MCQ Generator. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
