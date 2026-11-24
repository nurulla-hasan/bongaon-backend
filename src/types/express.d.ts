import type { Role, UserStatus } from '../../generated/prisma/enums';

declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      role: Role;
      status: UserStatus;
    }

    interface Request {
      validatedQuery?: unknown;
    }
  }
}
