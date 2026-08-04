const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                message: "Please upload a resume PDF file."
            });
        }

        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        const { selfDescription, jobDescription } = req.body

        if (!selfDescription || !jobDescription) {
            return res.status(400).json({
                message: "Please provide selfDescription and jobDescription."
            });
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        })

        const userId = req.user.id || req.user._id;

        const interviewReport = await interviewReportModel.create({
            user: userId,
            resume: resumeContent.text,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error in generateInterViewReportController:", err);
        res.status(err.status || 500).json({
            message: "Failed to generate interview report",
            error: err.message || err
        });
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params
        const userId = req.user.id || req.user._id;

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: userId })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error in getInterviewReportByIdController:", err);
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const userId = req.user.id || req.user._id;
        const interviewReports = await interviewReportModel.find({ user: userId }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error("Error in getAllInterviewReportsController:", err);
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (err) {
        console.error("Error in generateResumePdfController:", err);
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }