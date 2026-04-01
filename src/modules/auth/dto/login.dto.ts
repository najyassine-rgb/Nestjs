import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  // @IsString()
  @IsEmail()
  login: string;

  @IsNotEmpty()
  password: string;
}
