import MCQWizard from "./components/MCQWizard";

export const metadata = {
  title: "MCQ Generator",
  description: "Generate multiple-choice question papers with answer keys",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm py-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            MCQ Generator
          </h1>
          <p className="mt-2 text-gray-600 text-center">
            Create multiple sets of question papers with randomized options
          </p>
        </div>
      </header>

      <div className="container mx-auto pt-32 pb-12">
        <MCQWizard />
      </div>

      <footer className="mt-8 text-center text-gray-500 text-sm pb-4">
        <p>© 2024 MCQ Generator. All rights reserved.</p>
      </footer>
    </main>
  );
}
