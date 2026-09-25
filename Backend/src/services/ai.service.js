const { GoogleGenAI, Type } = require("@google/genai")

function getAi() {
    return new GoogleGenAI({
        apiKey: process.env.GOOGLE_GENAI_API_KEY || ""
    })
}

const interviewReportResponseSchema = {
    type: Type.OBJECT,
    properties: {
        matchScore: {
            type: Type.NUMBER,
            description: "A score between 0 and 100 indicating how well the candidate's profile matches the job description"
        },
        technicalQuestions: {
            type: Type.ARRAY,
            description: "Technical questions that can be asked in the interview along with their intention and how to answer them",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The technical question" },
                    intention: { type: Type.STRING, description: "The intention of interviewer" },
                    answer: { type: Type.STRING, description: "How to answer this question" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestions: {
            type: Type.ARRAY,
            description: "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The behavioral question" },
                    intention: { type: Type.STRING, description: "The intention of interviewer" },
                    answer: { type: Type.STRING, description: "How to answer this question" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: Type.ARRAY,
            description: "List of skill gaps in the candidate's profile along with their severity",
            items: {
                type: Type.OBJECT,
                properties: {
                    skill: { type: Type.STRING, description: "The skill which the candidate is lacking" },
                    severity: { type: Type.STRING, enum: ["low", "medium", "high"], description: "Severity of skill gap" }
                },
                required: ["skill", "severity"]
            }
        },
        preparationPlan: {
            type: Type.ARRAY,
            description: "A day-wise preparation plan for the candidate",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.NUMBER, description: "Day number starting from 1" },
                    focus: { type: Type.STRING, description: "Main focus of the day" },
                    tasks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tasks for the day" }
                },
                required: ["day", "focus", "tasks"]
            }
        },
        title: {
            type: Type.STRING,
            description: "The title of the job for which the interview report is generated"
        }
    },
    required: ["matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan", "title"]
}

function parseAiJsonResponse(text) {
    let clean = (text || "").trim()
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json\s*/, "").replace(/```$/, "").trim()
    } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```\s*/, "").replace(/```$/, "").trim()
    }
    return JSON.parse(clean)
}

async function callGeminiWithRetry(apiFn, maxRetries = 5, delayMs = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiFn()
        } catch (err) {
            const isTransient = err.status === 503 || err.status === 429 ||
                (err.message && (err.message.includes("503") || err.message.includes("high demand") || err.message.includes("UNAVAILABLE")))
            
            if (isTransient && attempt < maxRetries) {
                console.warn(`[Gemini API] Temporary high demand / 503 error on attempt ${attempt}/${maxRetries}. Retrying in ${delayMs}ms...`)
                await new Promise(resolve => setTimeout(resolve, delayMs))
                delayMs *= 2
                continue
            }
            throw err
        }
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await callGeminiWithRetry(() => getAi().models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportResponseSchema,
        }
    }))

    return parseAiJsonResponse(response.text)

}

async function generatePdfFromHtml(htmlContent) {
    const isVercel = !!process.env.VERCEL
    const puppeteer = require("puppeteer-core")
    const chromium = require("@sparticuz/chromium-min")

    const executablePath = isVercel
        ? await chromium.executablePath(
              "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
          )
        : (process.platform === "win32"
              ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              : process.platform === "darwin"
              ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
              : "/usr/bin/google-chrome")

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
    })
    try {
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4",
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        return pdfBuffer
    } finally {
        await browser.close()
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfResponseSchema = {
        type: Type.OBJECT,
        properties: {
            html: {
                type: Type.STRING,
                description: "The HTML content of the resume which can be converted to PDF using puppeteer"
            }
        },
        required: ["html"]
    }

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await callGeminiWithRetry(() => getAi().models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: resumePdfResponseSchema,
        }
    }))

    const jsonContent = parseAiJsonResponse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }