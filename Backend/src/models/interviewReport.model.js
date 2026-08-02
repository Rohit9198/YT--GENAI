const mongoose = require('mongoose');



/**
 * - job description Schema: String
 * - resume: String
 * - self description: String
 * 
 * -- matchscore: Number
 * 
 * - Technical question:[{
 *   question:"",
 *   intention:"",
 *   answer:"",
 * }]
 * -Behavioral questions:[{
 *  question:"",
 *  answer:"",
 * intention:"",
 * }]
 * - Skill gaps:[{
 *   skill:"",
 *  severity:"",
 *   type: String,
 *  enum:["low", "medium", "high"],
 *   gap:"",
 * }]
 * - preparation plan:[{
 *   day: Number,
 *   focus: String,
 *   tasks:[String]
 * }]
 */

const technicalQuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        required: [ true, "Tehnical question is required"]
    },
    intention:{
        type: String,
        required: [true, "Intention is required"]
    },
    answer:{
        type: String,
        required: [true, "Answer is required"]
    }
},{
    _id: false
})

const behavioralQuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        required: [ true, "Tehnical question is required"]
    },
    intention:{
        type: String,
        required: [true, "Intention is required"]
    },
    answer:{
        type: String,
        required: [true, "Answer is required"]
    }
},{
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill:{
        type: String,
        required:[true, "Skill is required"]
    },
    severity:{
        type: String,
        enum: ["low", "medium", "high"],
        required:[true, "severity is required"]
    }
},{
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({
    day:{
        type: Number,
        required:[true, "Day is required"]
    },
    focus:{
        type:String,
        required:[true, "Focus is required"]
    },
    tasks:[{
        type: String,
        required:[true, "Task is required"]
    }]
})

const interviewReportSchema = new mongoose.Schema({
    jobDescription:{
        type: String,
        required: [true, "job description is required"]
    },
    resume:{
        type: String,
    },
    selfDescription: {
        type: String,
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    technicalQuestions: [technicalQuestionsSchema],
    behavioralQuestionSchema:[behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan:[preparationPlanSchema],

},{
    timestamps: true
})

const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;