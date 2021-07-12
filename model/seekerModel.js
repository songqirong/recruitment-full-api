const { model, Schema } = require('mongoose');
module.exports = model('seekers', Schema({
  apply_job: String, // 求职岗位
  personal_introduction: String, // 自我介绍
  user_id: String, // 账号唯一标识（加密后的手机号）
  nickname: String, // 用户昵称
  create_time: Number, // 创建时间
  avatar_url: String, // 用户头像
}))