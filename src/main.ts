import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as dotenv from 'dotenv';
dotenv.config();
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS
  app.enableCors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const uploadsPath = join(process.cwd(), 'uploads');
  
  app.use('/uploads', express.static(uploadsPath, {
    index: false,
    fallthrough: true,
  }));
  
  console.log('Archivos estáticos desde:', uploadsPath);

  // Verificar carpeta avatars
  const avatarsPath = join(uploadsPath, 'avatars');
  
  if (!fs.existsSync(avatarsPath)) {
    console.warn('Carpeta uploads/avatars NO existe. Creándola...');
    fs.mkdirSync(avatarsPath, { recursive: true });
    console.log('Carpeta uploads/avatars creada');
  } else {
    console.log('Carpeta uploads/avatars existe');
  }

  // Listar archivos
  if (fs.existsSync(avatarsPath)) {
    const files = fs.readdirSync(avatarsPath);
    console.log(`Archivos en uploads/avatars: ${files.length}`);
    if (files.length > 0) {
      console.log('   Ejemplo:', files[0]);
      console.log('Prueba directa: http://localhost:3000/uploads/avatars/' + files[0]);
    }
  }

  await app.listen(3000);
  console.log("Backend corriendo en http://localhost:3000");
}
bootstrap();