const mongoose = require('mongoose')
const { Schema } = mongoose // EQUIVALENT TO ----->  const Schema = mongoose.Schema

const userSchema = new Schema({
  googleId: String,
  name: String
})

mongoose.model('users', userSchema)