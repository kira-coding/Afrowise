const mongoose = require('mongoose');
const priceSchema = mongoose.Schema({
    value: { type: Number, required: true },
    frequency: {
        type:mongoose.Schema.Types.Date,
        required:false
    }
})


const Price = mongoose.model('Price', priceSchema)

exports.Price = Price