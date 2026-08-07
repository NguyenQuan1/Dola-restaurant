import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('should hash passwords and compare them successfully', async () => {
    const service = new AuthService({} as any, {} as any, {} as any, {} as any, {} as any);

    const password = 'StrongPass123!';
    const hashed = await service.hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(await bcrypt.compare(password, hashed)).toBe(true);
  });
});
