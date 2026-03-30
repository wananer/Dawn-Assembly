#!/bin/bash

# 早朝打卡脚本
# 用法: ./checkin.sh <部门ID> <姓名> [备注]

REPO_URL="https://github.com/wananer/Dawn-Assembly.git"
REPO_DIR="$HOME/.dawn-assembly"
DEPT_ID=$1
NAME=$2
NOTE=$3

if [ -z "$DEPT_ID" ] || [ -z "$NAME" ]; then
    echo "用法: ./checkin.sh <部门ID> <姓名> [备注]"
    echo ""
    echo "部门列表:"
    echo "  zhongshu  - 中书省"
    echo "  menxia    - 门下省"
    echo "  shangshu  - 尚书省"
    echo "  hubu      - 户部"
    echo "  libu      - 吏部"
    echo "  bingbu    - 兵部"
    echo "  xingbu    - 刑部"
    echo "  gongbu    - 工部"
    echo "  libu_hr   - 吏部HR"
    exit 1
fi

# 克隆或更新仓库
if [ ! -d "$REPO_DIR" ]; then
    echo "首次使用，正在克隆仓库..."
    git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"

# 拉取最新代码
git pull origin main

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    npm install
fi

# 执行打卡
node src/checkin.js checkin "$DEPT_ID" "$NAME" "$NOTE"
CHECKIN_RESULT=$?

if [ $CHECKIN_RESULT -eq 0 ]; then
    # 生成报告
    node src/checkin.js report > /dev/null 2>&1
    
    # 提交到GitHub
    TODAY=$(date +%Y-%m-%d)
    git add attendance/ reports/
    git commit -m "[$DEPT_ID] $NAME 打卡 - $TODAY" || true
    git push origin main
    
    echo "✅ 打卡成功并已同步到GitHub"
else
    echo "❌ 打卡失败"
    exit 1
fi