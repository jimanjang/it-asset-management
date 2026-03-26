import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: {
    id: string;
    email: string;
    name: string;
    picture: string;
  }) {
    // Domain restriction check
    const allowedDomain = process.env.ALLOWED_DOMAIN || 'daangnservice.com';
    if (!profile.email.endsWith(`@${allowedDomain}`)) {
      throw new Error(`Only @${allowedDomain} accounts are allowed`);
    }

    let user = await this.usersRepository.findOne({
      where: { google_id: profile.id },
    });

    if (!user) {
      user = this.usersRepository.create({
        google_id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        role: 'viewer',
      });
      await this.usersRepository.save(user);
    } else {
      user.name = profile.name;
      user.avatar_url = profile.picture;
      await this.usersRepository.save(user);
    }

    return user;
  }

  async generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }

  async findUserById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }
}
