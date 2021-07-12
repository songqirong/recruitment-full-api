const { model, Schema } = require('mongoose');
module.exports = model('jobs', Schema({
  recruitment_job: String, // 招聘岗位
  recruitment_request: String, // 招聘要求
  recruitment_salary: Number, // 招聘薪资
  company_name: String, // 公司名称
  nickname: String, // 用户昵称
  user_id: String, // 创建人的唯一标识
  create_time: Number, // 创建时间
  avatar_url: String, // 用户头像
}))