import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingInterval, SubscriptionStatus } from '@prisma/client';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── PLANES ──────────────────────────────────────────────────────────────

  async createPlan(merchantId: string, dto: CreatePlanDto) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        merchantId,
        name:          dto.name,
        description:   dto.description,
        amountGs:      BigInt(dto.amountGs),
        interval:      dto.interval,
        intervalCount: dto.intervalCount ?? 1,
        trialDays:     dto.trialDays,
      },
    });
    return this.serializePlan(plan);
  }

  async listPlans(merchantId: string) {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { subscriptions: { where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } } } } } },
    });
    return plans.map(p => ({ ...this.serializePlan(p), activeSubscribers: p._count.subscriptions }));
  }

  async togglePlan(merchantId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({ where: { id: planId, merchantId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    const updated = await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { active: !plan.active },
    });
    return this.serializePlan(updated);
  }

  async deletePlan(merchantId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({ where: { id: planId, merchantId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    const active = await this.prisma.customerSubscription.count({
      where: { planId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
    });
    if (active > 0) throw new ConflictException(`El plan tiene ${active} suscriptores activos`);
    await this.prisma.subscriptionPlan.delete({ where: { id: planId } });
    return { deleted: true };
  }

  // ── SUSCRIPTORES ────────────────────────────────────────────────────────

  async createSubscription(merchantId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findFirst({ where: { id: dto.planId, merchantId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    if (!plan.active) throw new ConflictException('El plan está inactivo');

    if (dto.externalId) {
      const existing = await this.prisma.customerSubscription.findUnique({
        where: { merchantId_externalId: { merchantId, externalId: dto.externalId } },
      });
      if (existing) return this.serializeSub(existing);
    }

    const now = new Date();
    const isTrial = (plan.trialDays ?? 0) > 0;
    const trialEndsAt = isTrial ? addDays(now, plan.trialDays!) : undefined;
    const periodStart = isTrial ? trialEndsAt! : now;
    const periodEnd   = this.nextPeriodEnd(periodStart, plan.interval, plan.intervalCount);

    const sub = await this.prisma.customerSubscription.create({
      data: {
        merchantId,
        planId:            plan.id,
        customerEmail:     dto.customerEmail,
        customerName:      dto.customerName,
        customerPhone:     dto.customerPhone,
        externalId:        dto.externalId,
        status:            isTrial ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        currentPeriodStart: periodStart,
        currentPeriodEnd:   periodEnd,
        nextChargeAt:       periodEnd,
        trialEndsAt,
      },
      include: { plan: true },
    });

    return this.serializeSub(sub);
  }

  async listSubscriptions(merchantId: string, planId?: string) {
    const subs = await this.prisma.customerSubscription.findMany({
      where: { merchantId, ...(planId ? { planId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    return subs.map(s => this.serializeSub(s));
  }

  async cancelSubscription(merchantId: string, subId: string) {
    const sub = await this.prisma.customerSubscription.findFirst({ where: { id: subId, merchantId } });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');
    const updated = await this.prisma.customerSubscription.update({
      where: { id: subId },
      data: { status: SubscriptionStatus.CANCELED, canceledAt: new Date() },
    });
    return this.serializeSub(updated);
  }

  async pauseSubscription(merchantId: string, subId: string) {
    const sub = await this.prisma.customerSubscription.findFirst({ where: { id: subId, merchantId } });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');
    const updated = await this.prisma.customerSubscription.update({
      where: { id: subId },
      data: { status: SubscriptionStatus.PAUSED },
    });
    return this.serializeSub(updated);
  }

  async resumeSubscription(merchantId: string, subId: string) {
    const sub = await this.prisma.customerSubscription.findFirst({ where: { id: subId, merchantId } });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');
    const updated = await this.prisma.customerSubscription.update({
      where: { id: subId },
      data: { status: SubscriptionStatus.ACTIVE },
    });
    return this.serializeSub(updated);
  }

  // ── STATS ────────────────────────────────────────────────────────────────

  async getStats(merchantId: string) {
    const [plans, subs] = await Promise.all([
      this.prisma.subscriptionPlan.count({ where: { merchantId, active: true } }),
      this.prisma.customerSubscription.findMany({
        where: { merchantId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
        include: { plan: true },
      }),
    ]);

    const mrrGs = subs.reduce((acc, s) => {
      const monthly = this.toMonthlyGs(Number(s.plan.amountGs), s.plan.interval, s.plan.intervalCount);
      return acc + monthly;
    }, 0);

    return {
      activePlans:   plans,
      activeSubscribers: subs.length,
      mrrGs:         Math.round(mrrGs),
    };
  }

  // ── SCHEDULER helpers ────────────────────────────────────────────────────

  async getDueSubscriptions() {
    return this.prisma.customerSubscription.findMany({
      where: {
        status:      { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
        nextChargeAt: { lte: new Date() },
      },
      include: { plan: true, merchant: { include: { bankAccounts: { where: { isDefault: true }, take: 1 } } } },
    });
  }

  async advancePeriod(subId: string) {
    const sub = await this.prisma.customerSubscription.findUnique({ where: { id: subId }, include: { plan: true } });
    if (!sub) return;
    const newStart = sub.currentPeriodEnd;
    const newEnd   = this.nextPeriodEnd(newStart, sub.plan.interval, sub.plan.intervalCount);
    await this.prisma.customerSubscription.update({
      where: { id: subId },
      data: { status: SubscriptionStatus.ACTIVE, currentPeriodStart: newStart, currentPeriodEnd: newEnd, nextChargeAt: newEnd },
    });
  }

  async markPastDue(subId: string) {
    await this.prisma.customerSubscription.update({
      where: { id: subId },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
  }

  // ── UTILS ────────────────────────────────────────────────────────────────

  private nextPeriodEnd(from: Date, interval: BillingInterval, count: number): Date {
    switch (interval) {
      case BillingInterval.DAILY:   return addDays(from, count);
      case BillingInterval.WEEKLY:  return addWeeks(from, count);
      case BillingInterval.MONTHLY: return addMonths(from, count);
      case BillingInterval.YEARLY:  return addYears(from, count);
    }
  }

  private toMonthlyGs(amountGs: number, interval: BillingInterval, count: number): number {
    const factors: Record<BillingInterval, number> = {
      DAILY: 30 / count,
      WEEKLY: 4.33 / count,
      MONTHLY: 1 / count,
      YEARLY: 1 / (count * 12),
    };
    return amountGs * factors[interval];
  }

  private serializePlan<T extends { amountGs: bigint }>(p: T) {
    return { ...p, amountGs: Number(p.amountGs) };
  }

  private serializeSub<T extends { plan?: { amountGs: bigint } | null }>(s: T & { plan?: { amountGs: bigint } | null }) {
    return {
      ...s,
      plan: s.plan ? { ...s.plan, amountGs: Number(s.plan.amountGs) } : undefined,
    };
  }
}
