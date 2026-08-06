import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ContactsPublicController } from './contacts-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  controllers: [ContactsController, ContactsPublicController],
  providers: [ContactsService],
})
export class ContactsModule {}