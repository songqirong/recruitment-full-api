const { model, Schema } = require('mongoose');
module.exports = model('avatars', Schema({
  avatar_url: String,
  name: String,
  create_time: Number
}))