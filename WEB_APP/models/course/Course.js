const mongoose = require('mongoose');
const courseSchema = mongoose.Schema({
    title: { type: String, required: true, minlength: 3, maxlength: 255,index:true },
    description: { type: String, required: true, minlength: 3, maxlength: 1100, index:true },
    rootFolder: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Folder' ,},
    state: {
        type: String,
        required: true,
        enum: ['Pending',"Submitted" ,'Posted', 'OutDated'],
        default: 'Pending'
    },
    tags: { type: [mongoose.Schema.Types.ObjectId], required: false },
    picture: { type: mongoose.Schema.Types.Buffer, required:false },
    owner:{type:mongoose.Schema.Types.ObjectId,ref:"Teacher"},
    authors: [{ type: mongoose.Schema.Types.ObjectId,ref:"Teacher",}],
    price: { type: mongoose.Schema.Types.ObjectId, required: false, ref: "Price" },
     chat: { type: mongoose.Schema.Types.ObjectId, required: false, ref: "Chat" },
    comments:[{type:mongoose.Schema.Types.ObjectId,ref:"Comment"}]
})

const Course = mongoose.model('Course', courseSchema)

module.exports= Course