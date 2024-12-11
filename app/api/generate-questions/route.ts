import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing Gemini API key");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

export async function POST(req: Request) {
  try {
    const { subject, grade, questionCount, customPrompt } = await req.json();

    const prompt =
      customPrompt ||
      `Generate ${questionCount} multiple choice questions for ${grade} grade students about ${subject}. Each question should have exactly one correct answer.`;

    const systemInstruction = `Based on user's requirements generate MCQ type questions. There should only be one correct option.
      Always output in the following format:
      {
        "questions": [
          {
            "question": "What is the value of sin(30°)?",
            "choices": ["1/2", "1", "0", "√3/2"],
            "answer": "1/2"
          }
        ]
      }`;

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: systemInstruction }],
        },
      ],
    });

    const result = await chatSession.sendMessage(prompt);
    const response = result.response.text();

    // Clean up the response by removing markdown code blocks
    const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim();

    // Validate JSON response
    try {
      const parsedResponse = JSON.parse(cleanResponse);

      if (
        !parsedResponse.questions ||
        !Array.isArray(parsedResponse.questions)
      ) {
        return new Response(
          JSON.stringify({ error: "Invalid response format from AI" }),
          {
            headers: { "Content-Type": "application/json" },
            status: 500,
          }
        );
      }

      return new Response(JSON.stringify(parsedResponse), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      console.error("Error parsing AI response:", cleanResponse);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate questions" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}
