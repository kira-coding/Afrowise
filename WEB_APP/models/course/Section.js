const mongoose = require("mongoose");
const multipleChoiceSchema = new mongoose.Schema({
  //type:{type:String,default: 'multipleChoice'},
  instruction: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true }
});
const multipleAnswerSchema = new mongoose.Schema({
  //type:{type:String,default: 'multipleAnswer'},
  instruction: { type: String, required: true },
  options: [ String ],
  correctAnswers: {type:[ String],required: true}
});
const matchingSchema = new mongoose.Schema({
  //type:{type:String,default: 'matching'},
  instruction: { type: String, required: true },
  firstColumn: [{ type: String }],
  secondColumn: [{ type: String }]
});
const orderedElements = new mongoose.Schema({

  //type:{type:String,default: 'order'},
  instruction: { type: String, required: true },
  correctlyOrdered: [{ type: String }],
  hint:String
});

const questionSchema = new mongoose.Schema({
  type:{  
    type: String,
    required: true,
    enum: ["multipleChoice", "multipleAnswer", "order","matching"],},
  multipleChoice:{
    type:multipleChoiceSchema,
    required:function () {
      return this.type == "multipleChoice"
    }
  },
  multipleAnswer:{
    type:multipleAnswerSchema,
    required:function (){
      return this.type == "multipleAnswer"
    }
  },
  order:{
    type:orderedElements,
    required:function(){
      return this.type== "order"
    }
  },
  matching:{
    type:matchingSchema,
    required:function (){
      return this.type== "matching"
    }
  }
})
const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 1, maxlength: 255 },
  type: {
    type: String,
    required: true,
    enum: ["Text", "Video", "Image","Question"],
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  content: {
    type: String,
    required: function () {
      return this.type == "Text";
    },
  },
  address: {
    type: mongoose.Schema.Types.String,
    required: function () {
      return this.type == "Video" || this.type == "Image";
    },
  },
  question: {
    type:questionSchema, 
    required: function () {
      return this.type == "Question" ;
    },
  },
});

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
