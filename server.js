const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require("path"); // 【加上这一行！】引入 Node.js 内置的 path 模块

const app = express();
app.use(cors());
app.use(express.json());

// 告诉服务器，把当前目录下的静态文件（比如 index.html）暴露出去
app.use(express.static(path.join(__dirname))); 

// ... 你的创建数据库和路由的后续代码保持不变 ...
// 创建数据库
const db = new Database("diary.db");

// 创建表
db.prepare(`
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  date TEXT
)
`).run();

// 查询今日是否已写
app.get("/status", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const row = db.prepare("SELECT * FROM entries WHERE date=?").get(today);
  
  if (row) {
    res.json({ hasWrittenToday: true });
  } else {
    res.json({ hasWrittenToday: false });
  }
});

// 写一句话（每天一次）
app.post("/write", (req, res) => {

  const content = req.body.content;

  const today = new Date().toISOString().split("T")[0];

  const row = db.prepare(
    "SELECT * FROM entries WHERE date=?"
  ).get(today);

  if (row) {
    return res.json({
      success:false,
      message:"今天已经写过了"
    });
  }

  db.prepare(
    "INSERT INTO entries (content,date) VALUES (?,?)"
  ).run(content,today);

  res.json({
    success:true,
    message:"写入成功"
  });

});


// 回顾所有记录
app.get("/review",(req,res)=>{

  const rows = db.prepare(
    "SELECT * FROM entries ORDER BY date DESC"
  ).all();

  res.json(rows);

});


app.listen(3000,()=>{
  console.log("服务器运行：http://localhost:3000");
});