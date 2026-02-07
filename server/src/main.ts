import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许跨域请求，采用动态验证模式，平衡安全与真机调试需求
  app.enableCors({
    origin: (origin, callback) => {
      // 允许没有 origin 的请求 (如移动端 WebView 或 Postman)
      if (!origin) return callback(null, true);

      // 定义允许的规则：本地环境 + 局域网 IP (适配手机测试)
      const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
      const isLAN = /^http:\/\/192\.168\.\d+\.\d+/.test(origin);

      if (isLocalhost || isLAN || origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
