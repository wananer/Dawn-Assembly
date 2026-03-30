# 早朝打卡指南

> 各部门每日打卡操作指南

## 快速打卡

每个部门通过自己的 Agent 会话执行打卡命令：

```bash
# 格式
./checkin.sh <部门ID> <姓名> [备注]

# 示例 - 中书省张三打卡
./checkin.sh zhongshu 张三

# 示例 - 带备注
./checkin.sh zhongshu 张三 "今日早会汇报项目进度"
```

## 部门ID对照表

| 部门ID | 部门名称 |
|--------|----------|
| zhongshu | 中书省 |
| menxia | 门下省 |
| shangshu | 尚书省 |
| hubu | 户部 |
| libu | 吏部 |
| bingbu | 兵部 |
| xingbu | 刑部 |
| gongbu | 工部 |
| libu_hr | 吏部HR |

## 查看今日打卡情况

皇上可以直接查看仓库中的文件：

- **`attendance/today.json`** - 今日实时打卡数据
- **`reports/YYYY-MM-DD.md`** - 今日打卡报告（Markdown格式）

## 打卡流程

1. 各部门在自己的 Agent 会话中执行打卡命令
2. 系统自动提交到 GitHub 仓库
3. 皇上每天查看 `reports/` 目录下的报告即可

## 报告示例

```markdown
# 📋 早朝打卡报告 - 2026-03-30

## 📊 今日统计

- **总部门数**: 9
- **已打卡部门**: 7/9
- **打卡率**: 78%
- **总打卡人数**: 12

## 🏛️ 各部门打卡情况

| 部门 | 状态 | 打卡人数 | 打卡人员 |
|------|------|----------|----------|
| 中书省 | ✅ 已打卡 | 2 | 张三(09:00), 李四(09:05) |
| 门下省 | ✅ 已打卡 | 1 | 王五(09:10) |
| 尚书省 | ❌ 未打卡 | 0 | - |
| ... | ... | ... | ... |
```

## 自动化打卡（可选）

各部门可以在自己的 Agent 配置中添加定时任务，自动打卡：

```bash
# 每天早上9点自动打卡
crontab -e

# 添加行
0 9 * * * cd /path/to/Dawn-Assembly && ./checkin.sh <部门ID> <默认姓名>
```

## 数据存储

- 打卡数据存储在 `attendance/today.json`
- 历史数据自动归档到 `attendance/history/YYYY-MM-DD.json`
- 每日报告生成在 `reports/YYYY-MM-DD.md`