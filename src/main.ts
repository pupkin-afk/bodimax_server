import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpErrorFilter } from './exception-filter/exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    exceptionFactory: (errors) => {
      const codes = errors.flatMap(err => 
        err.constraints ? Object.values(err.constraints) : []
      )
      return new BadRequestException({ codes });
    },
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));
  app.use(cookieParser());
  app.useGlobalFilters(new HttpErrorFilter());
  app.enableCors({
    origin: [
      'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });
  app.set('trust proxy', true);
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
