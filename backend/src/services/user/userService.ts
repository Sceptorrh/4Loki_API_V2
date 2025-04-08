import pool from '../../config/database';
import { logger } from '../../utils/logger';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export class UserService {
  public static async createOrUpdateUser(user: User): Promise<User> {
    try {
      const [result] = await pool.query(
        `INSERT INTO Users (id, email, name, picture) 
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         picture = VALUES(picture)`,
        [user.id, user.email, user.name, user.picture]
      );

      return user;
    } catch (error) {
      logger.error('Error creating/updating user:', error);
      throw new Error('Failed to create/update user');
    }
  }
} 