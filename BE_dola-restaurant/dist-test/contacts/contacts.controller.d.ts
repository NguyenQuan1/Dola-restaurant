import { ContactsService } from './contacts.service';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
export declare class ContactsController {
    private readonly contactsService;
    constructor(contactsService: ContactsService);
    findAll(search?: string, isResolved?: string, page?: string, limit?: string): Promise<{
        items: import("./entities/contact.entity").Contact[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/contact.entity").Contact>;
    resolve(id: number, dto: UpdateContactStatusDto): Promise<import("./entities/contact.entity").Contact>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
