const mongoose = require('mongoose');
const { model, Schema } = mongoose;
module.exports = model('users', Schema({
  phone_number: String, // 用户手机号
  password: String, // 用户密码
  create_time: Number, // 注册时间
  user_avatar: String, // 用户头像
  user_type: String, // 用户类型
  user_name: String, // 用户名
  phone_key: String, // 解码密钥
  nickname: String, //用户昵称
}))