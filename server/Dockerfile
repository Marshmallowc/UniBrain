# 基础镜像
FROM node:18-bullseye

# 关键：安装 Poppler 
RUN apt-get update && apt-get install -y poppler-utils

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "run", "start:dev"]