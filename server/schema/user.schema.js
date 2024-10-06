
const mongoose = require('mongoose')
const { Schema } = mongoose
const user = new Schema({
    name: {
        type: String,
        required: true,
        unique: false
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password:{
        type: String,
        required: true,
        unique: false
    }
})

const UserSchema = mongoose.model('user' , user)
module.exports = UserSchema