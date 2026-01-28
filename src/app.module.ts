import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EmailsModule } from './modules/emails/emails.module';
import { FoldersModule } from './modules/folders/folders.module';

@Module({
  imports: [AuthModule, UsersModule, EmailsModule, FoldersModule],
  providers: [AppService],
})
export class AppModule {}
