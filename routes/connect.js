const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/recruitment", {
  useNewUrlParser:true,
  useUnifiedTopology:true
})
const conn = mongoose.connection;
conn.on('open', () => {
  console.log('数据库连接成功')
})
conn.on('error', () => {
  console.log('数据库连接失败')
})