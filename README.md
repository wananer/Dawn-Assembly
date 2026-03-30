# 早朝打卡 (Dawn Assembly)

> 三省六部每日晨会签到系统

## 项目简介

早朝打卡是一个用于管理团队每日晨会签到和汇报的系统，支持各部门独立打卡、实时统计和可视化展示。

## 功能特性

- 📋 **每日打卡** - 各部门成员可独立打卡签到
- 📊 **实时统计** - 查看今日打卡情况和打卡率
- 📈 **可视化图表** - 饼图展示今日分布，折线图展示7天趋势
- 🏛️ **部门管理** - 支持三省六部共9个部门
- 💾 **数据持久化** - 打卡记录本地存储

## 支持的部门

| 部门ID | 部门名称 | 颜色 |
|--------|----------|------|
| zhongshu | 中书省 | 🔴 红色 |
| menxia | 门下省 | 🟠 橙色 |
| shangshu | 尚书省 | 🟡 黄色 |
| hubu | 户部 | 🟢 绿色 |
| libu | 吏部 | 🔵 蓝色 |
| bingbu | 兵部 | 🟣 紫色 |
| xingbu | 刑部 | ⚫ 深灰 |
| gongbu | 工部 | 🩵 青色 |
| libu_hr | 吏部HR | 🟤 棕色 |

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

服务将在 http://localhost:3000 启动

### 开发模式

```bash
npm run dev
```

## API 接口

### 获取部门列表
```
GET /api/departments
```

### 打卡
```
POST /api/checkin
Content-Type: application/json

{
  "departmentId": "zhongshu",
  "memberName": "张三",
  "note": "今日请假"
}
```

### 获取今日打卡情况
```
GET /api/today
```

### 获取历史记录
```
GET /api/history?days=7
```

### 获取部门统计
```
GET /api/stats/department/:departmentId?days=30
```

## 项目结构

```
Dawn-Assembly/
├── src/
│   └── index.js          # 服务端主程序
├── public/
│   └── index.html        # 前端页面
├── data/
│   └── attendance.json   # 打卡数据存储
├── package.json
├── LICENSE
└── README.md
```

## 技术栈

- **后端**: Node.js + Express
- **前端**: HTML5 + CSS3 + Chart.js
- **数据存储**: JSON 文件

## 许可证

MIT License

## 贡献者

- 三省六部团队