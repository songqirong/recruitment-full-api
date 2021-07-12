const { model, Schema } = require('mongoose');
module.exports = model('messages', Schema({
  content: String, // 聊天内容
  from_user_id: String, // 发出内容的人的id
  to_user_id: String, // 收到消息的人的id
  create_time: Number, // 消息被创建的时间
  read: Boolean, // 是否已被阅读
  chat_id: String // 标识属于谁的信息列表
}))