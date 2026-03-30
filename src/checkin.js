const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 数据文件路径
const DATA_FILE = path.join(__dirname, '..', 'attendance', 'today.json');
const HISTORY_DIR = path.join(__dirname, '..', 'attendance', 'history');

// 确保目录存在
function ensureDirs() {
  const attendanceDir = path.join(__dirname, '..', 'attendance');
  if (!fs.existsSync(attendanceDir)) {
    fs.mkdirSync(attendanceDir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

// 获取今天的日期
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// 获取当前时间
function getNow() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

// 加载今日打卡数据
function loadTodayData() {
  ensureDirs();
  if (!fs.existsSync(DATA_FILE)) {
    return { date: getToday(), records: {} };
  }
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    // 如果日期变了，归档昨天的数据
    if (data.date !== getToday()) {
      archiveData(data);
      return { date: getToday(), records: {} };
    }
    return data;
  } catch (e) {
    return { date: getToday(), records: {} };
  }
}

// 保存今日打卡数据
function saveTodayData(data) {
  ensureDirs();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 归档数据
function archiveData(data) {
  const archiveFile = path.join(HISTORY_DIR, `${data.date}.json`);
  fs.writeFileSync(archiveFile, JSON.stringify(data, null, 2));
}

// 打卡
function checkIn(departmentId, memberName, note = '') {
  const dept = DEPARTMENTS.find(d => d.id === departmentId);
  if (!dept) {
    return { success: false, message: '无效的部门ID' };
  }
  
  const data = loadTodayData();
  
  // 检查今天是否已打卡
  if (data.records[departmentId]) {
    const existing = data.records[departmentId].find(r => r.memberName === memberName);
    if (existing) {
      return { success: false, message: '今日已打卡，请勿重复打卡' };
    }
  }
  
  // 创建打卡记录
  const record = {
    departmentId,
    departmentName: dept.name,
    memberName,
    time: getNow(),
    timestamp: Date.now(),
    note
  };
  
  // 保存记录
  if (!data.records[departmentId]) {
    data.records[departmentId] = [];
  }
  data.records[departmentId].push(record);
  saveTodayData(data);
  
  return { success: true, message: '打卡成功', record };
}

// 获取今日统计
function getTodayStats() {
  const data = loadTodayData();
  const stats = {
    date: data.date,
    totalDepartments: DEPARTMENTS.length,
    checkedInDepartments: 0,
    totalCheckIns: 0,
    departments: {}
  };
  
  DEPARTMENTS.forEach(dept => {
    const records = data.records[dept.id] || [];
    stats.departments[dept.id] = {
      ...dept,
      checkedIn: records.length,
      members: records
    };
    if (records.length > 0) {
      stats.checkedInDepartments++;
    }
    stats.totalCheckIns += records.length;
  });
  
  return stats;
}

// 生成Markdown报告
function generateReport() {
  const stats = getTodayStats();
  const today = stats.date;
  
  let md = `# 📋 早朝打卡报告 - ${today}\n\n`;
  md += `> 生成时间: ${getNow()}\n\n`;
  
  // 统计摘要
  md += `## 📊 今日统计\n\n`;
  md += `- **总部门数**: ${stats.totalDepartments}\n`;
  md += `- **已打卡部门**: ${stats.checkedInDepartments}/${stats.totalDepartments}\n`;
  md += `- **打卡率**: ${Math.round(stats.checkedInDepartments/stats.totalDepartments*100)}%\n`;
  md += `- **总打卡人数**: ${stats.totalCheckIns}\n\n`;
  
  // 各部门详情
  md += `## 🏛️ 各部门打卡情况\n\n`;
  md += `| 部门 | 状态 | 打卡人数 | 打卡人员 |\n`;
  md += `|------|------|----------|----------|\n`;
  
  DEPARTMENTS.forEach(dept => {
    const deptStats = stats.departments[dept.id];
    const status = deptStats.checkedIn > 0 ? '✅ 已打卡' : '❌ 未打卡';
    const members = deptStats.members.map(m => `${m.memberName}(${m.time})`).join(', ') || '-';
    md += `| ${dept.name} | ${status} | ${deptStats.checkedIn} | ${members} |\n`;
  });
  
  md += `\n---\n`;
  md += `*数据来源: [Dawn-Assembly](https://github.com/wananer/Dawn-Assembly)*\n`;
  
  return md;
}

// 保存报告
function saveReport() {
  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const today = getToday();
  const reportPath = path.join(reportDir, `${today}.md`);
  const md = generateReport();
  fs.writeFileSync(reportPath, md);
  
  return { path: reportPath, content: md };
}

// 导出模块
module.exports = {
  DEPARTMENTS,
  checkIn,
  getTodayStats,
  generateReport,
  saveReport,
  getToday,
  getNow
};

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'checkin') {
    const deptId = args[1];
    const name = args[2];
    const note = args[3] || '';
    
    if (!deptId || !name) {
      console.log('用法: node checkin.js checkin <部门ID> <姓名> [备注]');
      console.log('部门列表:');
      DEPARTMENTS.forEach(d => console.log(`  ${d.id} - ${d.name}`));
      process.exit(1);
    }
    
    const result = checkIn(deptId, name, note);
    console.log(result.message);
    if (result.success) {
      console.log(JSON.stringify(result.record, null, 2));
    }
    process.exit(result.success ? 0 : 1);
  } else if (command === 'stats') {
    const stats = getTodayStats();
    console.log(JSON.stringify(stats, null, 2));
  } else if (command === 'report') {
    const result = saveReport();
    console.log(`报告已保存: ${result.path}`);
    console.log('\n--- 报告内容 ---\n');
    console.log(result.content);
  } else {
    console.log('早朝打卡系统\n');
    console.log('命令:');
    console.log('  checkin <部门ID> <姓名> [备注]  - 打卡');
    console.log('  stats                           - 查看今日统计');
    console.log('  report                          - 生成报告\n');
    console.log('部门列表:');
    DEPARTMENTS.forEach(d => console.log(`  ${d.id} - ${d.name}`));
  }
}