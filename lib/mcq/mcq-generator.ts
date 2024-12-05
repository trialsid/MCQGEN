import jsPDF from "jspdf";
import { TestDetails } from "../types/types";

interface Question {
  question: string;
  choices: string[];
  answer: string;
}

interface MCQSet {
  originalIndex: number;
  question: string;
  shuffledOptions: string[];
  correctLetter: string;
}

interface AnswerKeyItem {
  questionNum: number;
  originalIndex: number;
  correctLetter: string;
}

interface SetData {
  [key: string]: AnswerKeyItem[];
}

interface FontVariant {
  id: string;
  postScriptName: string;
  encoding: string;
}

interface ContentConfig {
  columns: {
    gap: number;
    padding: number;
  };
  question: {
    fontSize: number;
    numberWidth: number;
    spacing: number;
    lineHeight: number;
  };
  options: {
    fontSize: number;
    labelWidth: number;
    spacing: number;
    pairSpacing: number;
    lineHeight: number;
  };
}

class MCQPaperGenerator {
  private pdf: jsPDF;
  private showAnswers: boolean;
  private setName: string = "";
  private currentY: number = 0;
  private currentSide: "left" | "right" = "left";
  private isFirstPage: boolean = true;
  private fonts: { [family: string]: { [variant: string]: FontVariant } } = {};
  private currentQuestionText: string = "";
  private currentOptions: string[] = [];
  // private totalQuestions: number;,
  private readonly testDetails!: TestDetails;

  private readonly config = {
    page: {
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
      width: 210, // A4 width in mm
      height: 297, // A4 height in mm
    },
    header: {
      college: {
        //name: "SOMANAADRI Jr. COLLEGE",
        fontSize: 30,
        font: "stinger",
      },
      location: {
        //name: "IEEJA",
        fontSize: 16,
        font: "stinger",
      },
      test: {
        //text: ">> EVERYDAY TEST :: 12 <<",
        fontSize: 20,
        font: "noto-italic",
      },

      firstLineY: 40,
      studentInfoY: 50,
      setInfoY: 77,
    },
    content: {
      columns: {
        gap: 10,
        padding: 10,
      },
      question: {
        fontSize: 12,
        numberWidth: 8,
        spacing: 1,
        lineHeight: 0.5,
      },
      options: {
        fontSize: 12,
        labelWidth: 4,
        spacing: 1,
        pairSpacing: 6,
        lineHeight: 0.4,
      },
    } as ContentConfig,
    fonts: {
      noto: {
        regular: "../fonts/NotoSans-Regular.ttf",
        bold: "../fonts/NotoSans-Bold.ttf",
        italic: "../fonts/NotoSans-Italic.ttf",
      },
      stinger: {
        bold: "../fonts/StingerFitTrial-Bold.ttf",
      },
      arial: {
        regular: "../fonts/Arial-Unicode.ttf",
        bold: "../fonts/Arial-Unicode-Bold.ttf",
      },
    } as const,
  };

  constructor(
    format: "a4" | "letter" = "a4",
    showAnswers: boolean = false,
    totalQuestions: number,
    testDetails: TestDetails
  ) {
    if (!testDetails) {
      throw new Error("Test details are required");
    }

    this.pdf = new jsPDF({ format, orientation: "portrait", unit: "mm" });
    this.showAnswers = showAnswers;
    this.testDetails = { ...testDetails };

    this.loadFonts();
    this.initializePage();
    //this.totalQuestions = totalQuestions;
    //console.log("testDetails in constructor:", testDetails);
  }

  private async loadFonts(): Promise<void> {
    try {
      for (const [family, variants] of Object.entries(this.config.fonts)) {
        const loadedVariants: { [variant: string]: FontVariant } = {};

        for (const [variant, path] of Object.entries(variants)) {
          try {
            console.log(`Loading font: ${family} ${variant} from ${path}`); // Debug log
            const response = await fetch(path);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const fontData = await response.arrayBuffer();
            const binary = new Uint8Array(fontData);
            let base64 = "";
            for (let i = 0; i < binary.length; i++) {
              base64 += String.fromCharCode(binary[i]);
            }
            const fontBase64 = btoa(base64);

            const fontId = `${family}-${variant}`;
            this.pdf.addFileToVFS(path, fontBase64);
            this.pdf.addFont(path, fontId, variant);

            loadedVariants[variant] = {
              id: fontId,
              postScriptName: path,
              encoding: "Identity-H",
            };
          } catch (error) {
            console.error(`Failed to load font ${family} ${variant}:`, error);
          }
        }

        this.fonts[family] = loadedVariants;
      }
    } catch (error) {
      console.error("Error in loadFonts:", error);
    }
  }

  private getColumnWidth(): number {
    const usableWidth =
      this.config.page.width -
      this.config.page.margins.left -
      this.config.page.margins.right;
    return (usableWidth - this.config.content.columns.gap * 0.15) / 2;
  }

  private getColumnX(side: "left" | "right"): number {
    const baseX = this.config.page.margins.left;
    const columnWidth = this.getColumnWidth();
    const totalWidth =
      this.config.page.width -
      this.config.page.margins.left -
      this.config.page.margins.right;
    const gap = totalWidth * 0.05;

    // Move left column slightly right and right column slightly left
    const adjustment = 2; // 10mm adjustment

    if (side === "right") {
      // Move right column left by subtracting adjustment
      return baseX + columnWidth + gap - adjustment;
    }
    // Move left column right by adding adjustment
    return baseX + adjustment;
  }

  private initializePage(): void {
    if (this.isFirstPage) {
      this.drawMainHeader();
    } else {
      this.drawSubHeader();
    }
    this.drawColumnDivider();
    this.drawFooter();

    // Set initial Y position
    this.currentY = this.isFirstPage ? this.config.header.setInfoY + 15 : 3;
  }

  private drawMainHeader(): void {
    const { college, location, test } = this.config.header;
    const pageCenter = this.config.page.width / 2;

    //console.log("testDetails in drawMainHeader:", this.testDetails);
    // College name
    this.setFont("stinger", "bold", college.fontSize);
    this.pdf.text(this.testDetails.collegeName, pageCenter, 15, {
      align: "center",
    });

    // Location
    this.setFont("stinger", "bold", location.fontSize);
    this.pdf.text(this.testDetails.collegeAddress, pageCenter, 25, {
      align: "center",
    });

    // Test title
    this.setFont("noto", "italic", test.fontSize);
    const testText = `>> ${this.testDetails.testName} :: ${this.testDetails.testNumber} <<`;
    const finalTestText = this.showAnswers ? testText + " (ANSWERS)" : testText;
    this.pdf.text(finalTestText, pageCenter, 35, { align: "center" });

    // Draw lines
    this.drawHorizontalLine(40);
    this.drawStudentInfo();
    this.drawHorizontalLine(70);
    this.drawSetInfo();
    this.drawHorizontalLine(80);
    // Draw vertical line between lines 40 and 70
    const middleX = this.config.page.width / 2;
    this.pdf.line(middleX, 40, middleX, 70);
  }

  private drawSubHeader(): void {
    this.drawSetInfo();
    this.drawHorizontalLine(15);

    this.currentY = 20;
  }

  private drawStudentInfo(): void {
    const startY = this.config.header.studentInfoY;
    this.setFont("noto", "regular", 12);

    // Left column
    this.pdf.text("Name:", 15, startY);
    this.pdf.text("Class:", 15, startY + 10);

    // Right column
    const rightX = this.getColumnX("right");
    this.pdf.text("Section:", rightX, startY + 10);
  }

  private drawSetInfo(): void {
    const y = this.isFirstPage ? this.config.header.setInfoY : 10;
    this.setFont("noto", "bold", 12);

    // Set identifier
    this.pdf.text(`SET ${this.setName}`, 15, y);

    // Page type
    const pageType = this.showAnswers
      ? "Multiple Choice Questions - Answer Key"
      : "Multiple Choice Questions";
    this.pdf.text(pageType, this.config.page.width - 15, y, { align: "right" });
  }

  private drawHorizontalLine(y: number): void {
    this.pdf.line(
      this.config.page.margins.left,
      y,
      this.config.page.width - this.config.page.margins.right,
      y
    );
  }

  private drawColumnDivider(): void {
    const startY = this.isFirstPage ? this.config.header.setInfoY + 3 : 15;
    const x = this.config.page.width / 2;

    this.pdf.line(
      x,
      startY,
      x,
      this.config.page.height - this.config.page.margins.bottom
    );
  }

  private drawFooter(): void {
    const y = this.config.page.height - this.config.page.margins.bottom;

    // Footer line
    this.drawHorizontalLine(y);

    // Page number
    this.setFont("noto", "italic", 10);
    this.pdf.text(
      `Page ${this.pdf.getCurrentPageInfo().pageNumber}`,
      this.config.page.width / 2,
      y + 5,
      { align: "center" }
    );
  }

  private setFont(family: string, style: string, size: number): void {
    try {
      if (this.fonts[family]?.[style]) {
        const font = this.fonts[family][style];
        this.pdf.setFont(font.id, style, font.encoding);
      } else {
        // Fallback to standard font
        this.pdf.setFont("helvetica", style);
      }
      this.pdf.setFontSize(size);
    } catch (error) {
      console.warn(
        `Error setting font ${family} ${style}, falling back to helvetica:`,
        error
      );
      this.pdf.setFont("helvetica", style);
      this.pdf.setFontSize(size);
    }
  }

  private measureText(
    text: string,
    maxWidth: number
  ): {
    lines: string[];
    height: number;
  } {
    const lines = this.pdf.splitTextToSize(text, maxWidth);
    const lineHeight = this.pdf.getTextDimensions("Test").h * 1.2;
    return {
      lines,
      height: lines.length * lineHeight,
    };
  }

  private canFitTwoOptions(option1: string, option2: string): boolean {
    const columnWidth = this.getColumnWidth();
    const effectiveWidth =
      this.currentSide === "left"
        ? columnWidth + this.config.content.columns.gap * 0.05
        : columnWidth;
    const singleOptionWidth =
      (effectiveWidth -
        this.config.content.question.numberWidth -
        this.config.content.options.pairSpacing) /
      2;

    const option1Text = this.measureText(
      option1,
      singleOptionWidth - this.config.content.options.labelWidth
    );
    const option2Text = this.measureText(
      option2,
      singleOptionWidth - this.config.content.options.labelWidth
    );

    return option1Text.lines.length === 1 && option2Text.lines.length === 1;
  }

  private writeOption(
    text: string,
    x: number,
    y: number,
    width: number,
    index: number,
    isCorrect: boolean,
    isPaired: boolean = false
  ): number {
    const label = `${String.fromCharCode(65 + index)}.`;
    const cleanedText = text.replace(/\.\s+/g, ". ").trim();
    const SLIGHT_INDENT = 2; // 2mm indent for options

    const columnWidth = this.getColumnWidth();
    const effectiveColumnWidth =
      this.currentSide === "left"
        ? columnWidth + this.config.content.columns.gap * 0.05
        : columnWidth;

    const columnPadding = this.config.content.columns.padding;
    const availableWidth = effectiveColumnWidth - columnPadding * 2;
    const maxWidth = availableWidth - 2;

    const textWidth = isPaired
      ? (maxWidth - this.config.content.options.pairSpacing) / 2
      : maxWidth;

    const { lines: finalLines } = this.measureText(
      cleanedText,
      textWidth - this.config.content.options.labelWidth
    );

    const labelX = x + SLIGHT_INDENT;
    this.setFont("arial", "bold", this.config.content.options.fontSize - 2);
    this.pdf.text(label, labelX, y);

    const textStartX = labelX + this.config.content.question.numberWidth - 2;
    this.setFont(
      "arial",
      isCorrect && this.showAnswers ? "bold" : "normal",
      this.config.content.options.fontSize
    );

    const lineHeight =
      this.config.content.options.fontSize *
      this.config.content.options.lineHeight;

    finalLines.forEach((line: string, i: number) => {
      this.pdf.text(line, textStartX, y + i * lineHeight);
    });

    return finalLines.length * lineHeight;
  }

  private writeOptionPair(
    option1: string,
    option2: string,
    x1: number,
    x2: number,
    y: number,
    index1: number,
    index2: number,
    correctIndex?: number
  ): number {
    const columnWidth = this.getColumnWidth();
    const effectiveWidth =
      this.currentSide === "left"
        ? columnWidth + this.config.content.columns.gap * 0.05
        : columnWidth;

    const optionWidth =
      (effectiveWidth -
        this.config.content.question.numberWidth -
        this.config.content.options.pairSpacing) /
      2;

    return Math.max(
      this.writeOption(
        option1,
        x1,
        y,
        optionWidth,
        index1,
        index1 === correctIndex,
        true
      ),
      this.writeOption(
        option2,
        x2,
        y,
        optionWidth,
        index2,
        index2 === correctIndex,
        true
      )
    );
  }

  private calculateTotalQuestionHeight(
    questionText: string,
    options: string[]
  ): number {
    const questionHeight = this.measureText(
      questionText,
      this.getColumnWidth() - this.config.content.question.numberWidth
    ).height;

    let optionsHeight = 0;
    let i = 0;

    while (i < options.length) {
      if (
        i + 1 < options.length &&
        this.canFitTwoOptions(options[i], options[i + 1])
      ) {
        const option1Height = this.measureText(
          options[i],
          this.getColumnWidth() / 2
        ).height;
        const option2Height = this.measureText(
          options[i + 1],
          this.getColumnWidth() / 2
        ).height;
        optionsHeight +=
          Math.max(option1Height, option2Height) +
          this.config.content.options.spacing;
        i += 2;
      } else {
        const singleOptionHeight = this.measureText(
          options[i],
          this.getColumnWidth() / 2
        ).height;
        optionsHeight +=
          singleOptionHeight + this.config.content.options.spacing;
        i++;
      }
    }

    return (
      questionHeight + this.config.content.question.spacing + optionsHeight
    );
  }

  public addQuestion(
    number: number,
    questionText: string,
    options: string[],
    correctIndex?: number
  ): void {
    this.currentQuestionText = questionText;
    this.currentOptions = options;

    this.checkAndAdjustPosition;

    const startY = this.currentY;

    // Calculate heights and spaces
    const footerStart =
      this.config.page.height - this.config.page.margins.bottom - 5;

    const questionTextHeight = this.measureText(
      questionText,
      this.getColumnWidth() - this.config.content.question.numberWidth
    ).height;

    const optionsSpacing = this.config.content.options.spacing;

    const optionPairSpacing = this.config.content.options.pairSpacing;

    // Calculate total height needed
    const totalHeight = this.calculateTotalQuestionHeight(
      questionText,
      options
    );

    const currentSpaceRemaining = footerStart - this.currentY;

    const canFitInCurrentSpace = totalHeight <= currentSpaceRemaining;

    // Position decision logic
    if (!canFitInCurrentSpace) {
      if (this.currentSide === "left") {
        const rightColumnY = this.isFirstPage
          ? this.config.header.setInfoY + 15
          : this.config.page.margins.top + 15;
        const rightColumnSpace = footerStart - rightColumnY;

        if (totalHeight <= rightColumnSpace) {
          this.currentSide = "right";
          this.currentY = rightColumnY;
        } else {
          this.pdf.addPage();
          this.isFirstPage = false;
          this.currentSide = "left";
          this.initializePage();
          this.currentY = this.config.page.margins.top + 15;
        }
      } else {
        this.pdf.addPage();
        this.isFirstPage = false;
        this.currentSide = "left";
        this.initializePage();
        this.currentY = this.config.page.margins.top + 15;
      }
    }

    // Position calculations
    const x = this.getColumnX(this.currentSide);

    const maxWidth =
      this.currentSide === "left"
        ? this.getColumnWidth() +
          this.config.content.columns.gap * 0.05 -
          this.config.content.columns.padding
        : this.getColumnWidth() - this.config.content.columns.padding;

    const textStartX = x + this.config.content.question.numberWidth;

    // Question number placement
    this.setFont("arial", "bold", this.config.content.question.fontSize);
    this.pdf.text(`${number}.`, x, this.currentY);

    // Question text placement
    this.setFont("arial", "italic", this.config.content.question.fontSize);
    const { lines: questionLines, height: questionHeight } = this.measureText(
      questionText,
      maxWidth - this.config.content.question.numberWidth
    );

    // Place each line of question text
    questionLines.forEach((line, i) => {
      const lineY = this.currentY + i * (questionHeight / questionLines.length);

      const isLastLine = i === questionLines.length - 1;
      if (!isLastLine) {
        this.justifyText(
          line,
          textStartX,
          lineY,
          maxWidth - this.config.content.question.numberWidth
        );
      } else {
        this.pdf.text(line, textStartX, lineY);
      }
    });

    this.currentY += questionHeight + this.config.content.question.spacing;

    const halfColumnX =
      textStartX + (maxWidth - this.config.content.question.numberWidth) / 2;

    // Options placement
    let i = 0;
    while (i < options.length) {
      if (
        i + 1 < options.length &&
        this.canFitTwoOptions(options[i], options[i + 1])
      ) {
        const pairHeight = this.writeOptionPair(
          options[i],
          options[i + 1],
          textStartX,
          halfColumnX,
          this.currentY,
          i,
          i + 1,
          correctIndex
        );
        this.currentY += pairHeight + this.config.content.options.spacing;
        i += 2;
      } else {
        const height = this.writeOption(
          options[i],
          textStartX,
          this.currentY,
          maxWidth / 2,
          i,
          i === correctIndex,
          false
        );
        this.currentY += height + this.config.content.options.spacing;
        i++;
      }
    }

    this.currentY += 2;
  }

  private justifyText(text: string, x: number, y: number, width: number): void {
    const words = text.split(" ");
    const wordWidths = words.map((word) => this.pdf.getTextWidth(word));
    const totalWordWidth = wordWidths.reduce((sum, width) => sum + width, 0);
    const spacesNeeded = words.length - 1;

    if (spacesNeeded > 0) {
      const spaceWidth = (width - totalWordWidth) / spacesNeeded;
      let currentX = x;

      words.forEach((word, i) => {
        this.pdf.text(word, currentX, y);
        if (i < words.length - 1) {
          currentX += wordWidths[i] + spaceWidth;
        }
      });
    } else {
      this.pdf.text(text, x, y);
    }
  }

  private getCurrentQuestionHeight(): number {
    const questionHeight = this.getQuestionTextHeight();
    const optionsHeight = this.getOptionsHeight();
    // Check if this question will be at bottom of column
    const FOOTER_MARGIN = 5;
    const footerStart =
      this.config.page.height - this.config.page.margins.bottom - FOOTER_MARGIN;
    const remainingHeight = footerStart - this.currentY;
    const totalContentHeight = questionHeight + optionsHeight;

    // If question barely fits at bottom, use smaller gap
    if (
      totalContentHeight <= remainingHeight &&
      totalContentHeight + 12 > remainingHeight
    ) {
      return totalContentHeight + 1; // Use 2mm gap instead of 12mm
    }

    // Otherwise use normal gap
    return totalContentHeight + 5;
  }

  private checkAndAdjustPosition(): void {
    const footerStart =
      this.config.page.height - this.config.page.margins.bottom - 0.5;
    const nextQuestionHeight = this.getCurrentQuestionHeight();
    const remainingHeight = footerStart - this.currentY;

    // Add buffer for more accurate space check
    if (nextQuestionHeight > remainingHeight - 2) {
      // 2mm buffer
      if (this.currentSide === "left") {
        // Move to right column if enough space
        const rightColumnY = this.isFirstPage
          ? this.config.header.setInfoY + 15
          : this.config.page.margins.top + 15;

        if (nextQuestionHeight <= footerStart - rightColumnY - 2) {
          this.currentSide = "right";
          this.currentY = rightColumnY;
        } else {
          // Not enough space in right, new page
          this.pdf.addPage();
          this.isFirstPage = false;
          this.currentSide = "left";
          this.initializePage();
          this.currentY = this.config.page.margins.top + 15;
        }
      } else {
        // If in right column, always start new page
        this.pdf.addPage();
        this.isFirstPage = false;
        this.currentSide = "left";
        this.initializePage();
        this.currentY = this.config.page.margins.top + 15;
      }
    }
  }

  private getQuestionTextHeight(): number {
    const maxWidth =
      this.currentSide === "left"
        ? this.getColumnWidth() + this.config.content.columns.gap * 0.15
        : this.getColumnWidth() * 0.85;

    const { height } = this.measureText(
      this.currentQuestionText,
      maxWidth - this.config.content.question.numberWidth
    );
    return height;
  }

  private getOptionsHeight(): number {
    const maxOptionWidth =
      (this.currentSide === "left"
        ? this.getColumnWidth() + this.config.content.columns.gap * 0.15
        : this.getColumnWidth()) *
        0.85 -
      this.config.content.options.labelWidth;

    return this.currentOptions.reduce((totalHeight, option) => {
      const { height } = this.measureText(option, maxOptionWidth);
      return totalHeight + height + this.config.content.options.spacing;
    }, 0);
  }

  public setSetName(name: string): void {
    this.setName = name;
  }

  public generatePDF(): Blob {
    return this.pdf.output("blob");
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateMCQSets(
  questions: Question[],
  numSets: number,
  testDetails: TestDetails
): { pdfs: Blob[]; answerKeys: SetData } {
  const setNames = Array.from({ length: numSets }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  //console.log("testDetails in generateMCQSets:", testDetails);

  const setData: SetData = {};
  const pdfs: Blob[] = [];

  setNames.forEach((setName) => {
    // Create shuffled questions with shuffled options
    const setQuestions: MCQSet[] = questions.map((q, idx) => {
      const shuffledOptions = shuffleArray(q.choices);
      const correctIndex = shuffledOptions.findIndex((opt) => opt === q.answer);

      return {
        originalIndex: idx,
        question: q.question,
        shuffledOptions,
        correctLetter: String.fromCharCode(65 + correctIndex),
      };
    });

    // Shuffle questions themselves
    const shuffledQuestions = shuffleArray(setQuestions);

    try {
      // Generate question paper and answer key
      const questionPaper = new MCQPaperGenerator(
        "a4",
        false,
        questions.length,
        { ...testDetails }
      );
      const answerPaper = new MCQPaperGenerator("a4", true, questions.length, {
        ...testDetails,
      });

      // Set the set name for both papers
      questionPaper.setSetName(setName);
      answerPaper.setSetName(setName);

      // Add questions to both papers
      shuffledQuestions.forEach((q, idx) => {
        const questionNumber = idx + 1;
        const correctIndex = q.shuffledOptions.findIndex(
          (opt) => opt === questions[q.originalIndex].answer
        );

        // Add to question paper (without highlighting answers)
        questionPaper.addQuestion(
          questionNumber,
          q.question,
          q.shuffledOptions
        );

        // Add to answer paper (with highlighted answers)
        answerPaper.addQuestion(
          questionNumber,
          q.question,
          q.shuffledOptions,
          correctIndex
        );
      });

      // Store answer key data
      setData[`Set ${setName}`] = shuffledQuestions.map((q, idx) => ({
        questionNum: idx + 1,
        originalIndex: q.originalIndex,
        correctLetter: q.correctLetter,
      }));

      // Generate and store PDFs
      pdfs.push(questionPaper.generatePDF(), answerPaper.generatePDF());
    } catch (error) {
      console.error(`Error generating Set ${setName}:`, error);
      throw new Error(`Failed to generate Set ${setName}`);
    }
  });

  return { pdfs, answerKeys: setData };
}

export async function generateCSVAnswerKey(setData: SetData): Promise<Blob> {
  const setNames = Object.keys(setData);
  const numQuestions = setData[setNames[0]].length;

  // Create CSV header
  const header = ["Question Number", ...setNames].join(",");
  const rows = [header];

  // Create rows for each question
  for (let qNum = 1; qNum <= numQuestions; qNum++) {
    const row = [qNum.toString()];

    setNames.forEach((setName) => {
      const answer = setData[setName].find((item) => item.questionNum === qNum);
      row.push(answer?.correctLetter || "");
    });

    rows.push(row.join(","));
  }

  // Create blob with CSV content
  const csvContent = rows.join("\n");
  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
}

export default generateMCQSets;
