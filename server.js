const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

fs.mkdirSync(DATA_DIR, {recursive:true});
fs.mkdirSync(UPLOAD_DIR, {recursive:true});

function loadDB(){
  if(!fs.existsSync(DB_FILE)){
    const db = {
      users: [
        {id:1, username:"admin", password:bcrypt.hashSync("admin123", 10), role:"admin"},
        {id:2, username:"moderator", password:bcrypt.hashSync("mod123", 10), role:"moderator"}
      ],
      posts: [
        {id:1,title:"আমাদের ওয়েবসাইটে স্বাগতম",category:"Update",body:"Govt. Shaheed Suhrawardy College Rover Scout Group-এর অফিসিয়াল আপডেট প্ল্যাটফর্মে স্বাগতম।",image:"",date:"2026-09-27",author:"Admin"},
        {id:2,title:"Rover Scout Group-এর কার্যক্রম",category:"Activity",body:"প্রশিক্ষণ, সেবামূলক কাজ, ক্যাম্প ও অন্যান্য কার্যক্রমের আপডেট এখানে প্রকাশ করা হবে।",image:"",date:"2026-09-26",author:"Admin"}
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2));
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_FILE,"utf8"));
}
let db = loadDB();
function saveDB(){fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2));}

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));
app.use(session({
  secret: process.env.SESSION_SECRET || "CHANGE_THIS_SECRET_BEFORE_DEPLOYMENT",
  resave:false,
  saveUninitialized:false,
  cookie:{httpOnly:true, sameSite:"lax", secure:false, maxAge:8*60*60*1000}
}));
app.use(express.static(path.join(ROOT,"public")));

const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null,UPLOAD_DIR),
  filename:(req,file,cb)=>{
    const safe = Date.now()+"-"+Math.random().toString(36).slice(2,9)+path.extname(file.originalname).toLowerCase();
    cb(null,safe);
  }
});
const upload = multer({
  storage,
  limits:{fileSize:5*1024*1024},
  fileFilter:(req,file,cb)=>{
    const ok=["image/jpeg","image/png","image/webp","image/gif"].includes(file.mimetype);
    cb(ok?null:new Error("Only image files are allowed."), ok);
  }
});

function requireStaff(req,res,next){
  if(!req.session.user) return res.status(401).json({error:"Login required"});
  next();
}
function requireAdmin(req,res,next){
  if(!req.session.user || req.session.user.role!=="admin") return res.status(403).json({error:"Admin permission required"});
  next();
}

app.get("/api/posts",(req,res)=>{
  res.json([...db.posts].sort((a,b)=>b.id-a.id));
});
app.get("/api/me",(req,res)=>{
  res.json({user:req.session.user||null});
});
app.post("/api/login",async(req,res)=>{
  const {username,password}=req.body;
  const user=db.users.find(u=>u.username===String(username||"").trim().toLowerCase());
  if(!user || !(await bcrypt.compare(String(password||""),user.password)))
    return res.status(401).json({error:"ভুল username বা password"});
  req.session.user={id:user.id,username:user.username,role:user.role};
  res.json({user:req.session.user});
});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));

app.post("/api/posts",requireStaff,upload.single("image"),(req,res)=>{
  const {title,category,body}=req.body;
  if(!title?.trim() || !body?.trim()) return res.status(400).json({error:"Title ও Description প্রয়োজন"});
  const post={
    id:Date.now(), title:title.trim(), category:category||"Update", body:body.trim(),
    image:req.file?"/uploads/"+req.file.filename:"",
    date:new Date().toISOString().slice(0,10),
    author:req.session.user.role==="admin"?"Admin":"Moderator"
  };
  db.posts.push(post); saveDB(); res.json(post);
});

app.put("/api/posts/:id",requireStaff,upload.single("image"),(req,res)=>{
  const post=db.posts.find(p=>p.id===Number(req.params.id));
  if(!post) return res.status(404).json({error:"Post not found"});
  const {title,category,body}=req.body;
  if(title?.trim()) post.title=title.trim();
  if(category) post.category=category;
  if(body?.trim()) post.body=body.trim();
  if(req.file) post.image="/uploads/"+req.file.filename;
  saveDB(); res.json(post);
});

app.delete("/api/posts/:id",requireAdmin,(req,res)=>{
  const id=Number(req.params.id);
  const post=db.posts.find(p=>p.id===id);
  if(!post) return res.status(404).json({error:"Post not found"});
  if(post.image) {
    const f=path.join(ROOT,"public",post.image.replace(/^\/+/,""));
    if(fs.existsSync(f)) fs.unlinkSync(f);
  }
  db.posts=db.posts.filter(p=>p.id!==id); saveDB(); res.json({ok:true});
});

app.get("/api/admin/users",requireAdmin,(req,res)=>{
  res.json(db.users.map(u=>({id:u.id,username:u.username,role:u.role})));
});
app.post("/api/admin/users",requireAdmin,async(req,res)=>{
  const {username,password,role}=req.body;
  const u=String(username||"").trim().toLowerCase();
  if(!u || !password || !["admin","moderator"].includes(role)) return res.status(400).json({error:"Invalid user"});
  if(db.users.some(x=>x.username===u)) return res.status(409).json({error:"Username already exists"});
  const user={id:Date.now(),username:u,password:await bcrypt.hash(password,10),role};
  db.users.push(user); saveDB(); res.json({id:user.id,username:user.username,role:user.role});
});
app.delete("/api/admin/users/:id",requireAdmin,(req,res)=>{
  const id=Number(req.params.id);
  if(req.session.user.id===id) return res.status(400).json({error:"নিজের account delete করা যাবে না"});
  db.users=db.users.filter(u=>u.id!==id); saveDB(); res.json({ok:true});
});

app.use((err,req,res,next)=>{
  console.error(err);
  res.status(400).json({error:err.message||"Request failed"});
});
app.get("*",(req,res)=>res.sendFile(path.join(ROOT,"public","index.html")));

app.listen(PORT,()=>console.log(`GSSC Rover website running at http://localhost:${PORT}`));
