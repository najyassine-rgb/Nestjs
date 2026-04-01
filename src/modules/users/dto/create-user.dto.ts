import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  // @IsString()
  @IsEmail()
  login: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
  @IsOptional()
  role?: string;
}
