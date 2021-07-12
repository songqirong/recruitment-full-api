const { model, Schema } = require('mongoose');
module.exports = model('userLists', Schema({
  user_id: String,
  nickname: String, // 用户昵称
  user_avatar: String, // 用户头像
  belong_user_id: String, // 属于某个用户id的用户对话列表
  last_content: String, // 最后一次对话内容
  update_time: Number, //最后一次发消息的时间
}))