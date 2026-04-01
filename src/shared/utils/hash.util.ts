import * as bcrypt from 'bcrypt';
import { APP_CONSTANTS } from '../constants/app.constants';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, APP_CONSTANTS.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
