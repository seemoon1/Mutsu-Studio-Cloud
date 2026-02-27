# 使用轻量级的 Node.js 18 环境
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖配置并安装
COPY package*.json ./
RUN npm install

# 复制所有源代码
COPY . .

# 编译 Next.js 项目
RUN npm run build

# 暴露 3000 端口 (HF 默认会根据我们昨天写的 README 抓取这个端口)
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]