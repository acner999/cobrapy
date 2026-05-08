import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminBanksService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bank.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(code: string) {
    return this.prisma.bank.findUnique({
      where: { code },
    });
  }

  async create(data: { code: string; name: string }) {
    return this.prisma.bank.create({ data });
  }

  async update(code: string, data: { name?: string; active?: boolean }) {
    return this.prisma.bank.update({
      where: { code },
      data,
    });
  }

  async delete(code: string) {
    return this.prisma.bank.delete({ where: { code } });
  }
}