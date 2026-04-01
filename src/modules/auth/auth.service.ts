import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';
import { AuthResponse } from './interfaces/auth/interfaces/auth-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}


  async register(
    login: string,
    password: string,
    role?: string,
  ): Promise<AuthResponse> {
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(login, hashed, role);

    return {
      token: this.jwtService.sign({ sub: user.id, login: user.login }),
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
      },
    };
  }


  async login(login: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findBylogin(login);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, login: user.login });

    return {
      token,
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
      },
    };
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, login: user.login };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }


  async sendResetEmail(email: string) {
    const token = Math.random().toString(36).substring(2);

    const resetLink = `http://localhost:4200/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'YOUR_EMAIL@gmail.com',
        pass: 'YOUR_APP_PASSWORD',
      },
    });

    await transporter.sendMail({
      from: 'YOUR_EMAIL@gmail.com',
      to: email,
      subject: 'Reset Password',
      html: `
      <h3>Réinitialisation mot de passe</h3>
      <p>Cliquez ici :</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
    });

    return { message: 'Email envoyé' };
  }
}
