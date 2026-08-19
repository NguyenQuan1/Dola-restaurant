import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
export interface FindAllContactsQuery {
    search?: string;
    isResolved?: boolean;
    page?: number;
    limit?: number;
}
export declare class ContactsService {
    private readonly contactRepo;
    constructor(contactRepo: Repository<Contact>);
    findAll(query?: FindAllContactsQuery): Promise<{
        items: Contact[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<Contact>;
    create(dto: CreateContactDto): Promise<Contact>;
    toggleResolved(id: number, isResolved: boolean): Promise<Contact>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
