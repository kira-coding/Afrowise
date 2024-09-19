const mongoose = require('mongoose');
const commentSchema = mongoose.Schema({
    issue: {type:String, required:true},
    description: {type:String, required:true},
    course: {type:mongoose.Schema.Types.ObjectId,required:true},
})


const Comment = mongoose.model('Comment', commentSchema)
module.exports= Comment