const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// 部门配置
const DEPARTMENTS = [
  { id: 'zhongshu', name: '中书省', color: '#e74c3c' },
  { id: 'menxia', name: '门下省', color: '#e67e22' },
  { id: 'shangshu', name: '尚书省', color: '#f39c12' },
  { id: 'hubu', name: '户部', color: '#27ae60' },
  { id: 'libu', name: '吏部', color: '#2980b9' },
  { id: 'bingbu', name: '兵部', color: '#8e44ad' },
  { id: 'xingbu', name: '刑部', color: '#2c3e50' },
  { id: 'gongbu', name: '工部', color: '#16a085' },
  { id: 'libu_hr', name: '吏部HR', color: '#d35400' }
];

// 数据存储路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据文件
if (!fs.existsSync(ATTENDANCE_FILE)) {
  fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify({ records: [] }, null, 2));
}

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// 读取打卡记录
function loadRecords() {
  try {
    const data = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { records: [] };
  }
}

// 保存打卡记录
function saveRecords(data) {
  fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(data, null, 2));
}

// API: 获取所有部门列表
app.get('/api/departments', (req, res) => {
  res.json({ success: true, departments: DEPARTMENTS });
});

// API: 打卡
app.post('/api/checkin', (req, res) => {
  const { departmentId, memberName, note } = req.body;
  
  if (!departmentId || !memberName) {
    return res.status(400).json({ success: false, message: '部门ID和成员姓名不能为空' });
  }
  
  const department = DEPARTMENTS.find(d => d.id === departmentId);
  if (!department) {
    return res.status(400).json({ success: false, message: '无效的部门ID' });
  }
  
  const data = loadRecords();
  const today = moment().format('YYYY-MM-DD');
  const now = moment().format('HH:mm:ss');
  
  // 检查今天是否已打卡
  const existingRecord = data.records.find(r => 
    r.date === today && r.departmentId === departmentId && r.memberName === memberName
  );
  
  if (existingRecord) {
    return res.status(400).json({ success: false, message: '今日已打卡，请勿重复打卡' });
  }
  
  const record = {
    id: Date.now().toString(),
    departmentId,
    departmentName: department.name,
    memberName,
    date: today,
    time: now,
    timestamp: Date.now(),
    note: note || ''
  };
  
  data.records.push(record);
  saveRecords(data);
  
  res.json({ success: true, message: '打卡成功', record });
});

// API: 获取今日打卡情况
app.get('/api/today', (req, res) => {
  const data = loadRecords();
  const today = moment().format('YYYY-MM-DD');
  const todayRecords = data.records.filter(r => r.date === today);
  
  // 统计各部门打卡人数
  const stats = DEPARTMENTS.map(dept => {
    const deptRecords = todayRecords.filter(r => r.departmentId === dept.id);
    return {
      ...dept,
      checkedIn: deptRecords.length,
      members: deptRecords.map(r => ({ name: r.memberName, time: r.time, note: r.note }))
    };
  });
  
  res.json({ 
    success: true, 
    date: today,
    totalDepartments: DEPARTMENTS.length,
    checkedInDepartments: stats.filter(s => s.checkedIn > 0).length,
    totalCheckIns: todayRecords.length,
    stats
  });
});

// API: 获取历史打卡记录
app.get('/api/history', (req, res) => {
  const { days = 7 } = req.query;
  const data = loadRecords();
  const endDate = moment();
  const startDate = moment().subtract(parseInt(days) - 1, 'days');
  
  const historyRecords = data.records.filter(r => {
    const recordDate = moment(r.date);
    return recordDate.isBetween(startDate, endDate, 'day', '[]');
  });
  
  // 按日期分组
  const byDate = {};
  for (let i = 0; i < parseInt(days); i++) {
    const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
    byDate[date] = { date, total: 0, departments: {} };
    DEPARTMENTS.forEach(d => {
      byDate[date].departments[d.id] = 0;
    });
  }
  
  historyRecords.forEach(r => {
    if (byDate[r.date]) {
      byDate[r.date].total++;
      byDate[r.date].departments[r.departmentId] = (byDate[r.date].departments[r.departmentId] || 0) + 1;
    }
  });
  
  res.json({ 
    success: true, 
    days: parseInt(days),
    history: Object.values(byDate).reverse()
  });
});

// API: 获取部门统计
app.get('/api/stats/department/:departmentId', (req, res) => {
  const { departmentId } = req.params;
  const { days = 30 } = req.query;
  
  const department = DEPARTMENTS.find(d => d.id === departmentId);
  if (!department) {
    return res.status(400).json({ success: false, message: '无效的部门ID' });
  }
  
  const data = loadRecords();
  const endDate = moment();
  const startDate = moment().subtract(parseInt(days) - 1, 'days');
  
  const deptRecords = data.records.filter(r => {
    const recordDate = moment(r.date);
    return r.departmentId === departmentId && recordDate.isBetween(startDate, endDate, 'day', '[]');
  });
  
  // 按日期统计
  const dailyStats = {};
  for (let i = 0; i < parseInt(days); i++) {
    const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
    dailyStats[date] = { date, count: 0, members: [] };
  }
  
  deptRecords.forEach(r => {
    if (dailyStats[r.date]) {
      dailyStats[r.date].count++;
      dailyStats[r.date].members.push({ name: r.memberName, time: r.time });
    }
  });
  
  res.json({ 
    success: true, 
    department,
    days: parseInt(days),
    totalCheckIns: deptRecords.length,
    dailyStats: Object.values(dailyStats).reverse()
  });
});

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🌅 早朝打卡系统已启动`);
  console.log(`📊 访问地址: http://localhost:${PORT}`);
  console.log(`📅 当前日期: ${moment().format('YYYY-MM-DD')}`);
});

module.exports = app;