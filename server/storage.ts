import {
  users,
  surveys,
  questions,
  responses,
  surveyCompletions,
  rewards,
  transactions,
  badges,
  userBadges,
  platformFees,
  unityReserves,
  unityTransactions,
  type User,
  type InsertUser,
  type Survey,
  type InsertSurvey,
  type Question,
  type InsertQuestion,
  type Response,
  type InsertResponse,
  type SurveyCompletion,
  type InsertSurveyCompletion,
  type Reward,
  type InsertReward,
  type Transaction,
  type InsertTransaction,
  type Badge,
  type UserBadge,
  type InsertUserBadge,
  type PlatformFee,
  type InsertPlatformFee,
  type UnityReserve,
  type InsertUnityReserve,
  type UnityTransaction,
  type InsertUnityTransaction,
} from "@shared/schema";
import { FEE_CONFIG } from "@shared/fee-config";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  toggleAdmin(userId: string): Promise<User>;
  
  getAllSurveys(): Promise<Survey[]>;
  getSurveyById(id: string): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurveyResponseCount(id: string): Promise<void>;
  
  getQuestionsBySurvey(surveyId: string): Promise<Question[]>;
  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  
  createResponses(responses: InsertResponse[]): Promise<Response[]>;
  getUserResponses(userId: string): Promise<Response[]>;
  
  hasSurveyCompletion(userId: string, surveyId: string): Promise<boolean>;
  createSurveyCompletion(completion: InsertSurveyCompletion): Promise<SurveyCompletion>;
  getUserSurveys(userId: string): Promise<Survey[]>;
  completeSurveyWithTransaction(data: {
    userId: string;
    surveyId: string;
    selectedTier: string;
    answers: Record<string, string>;
    rewardAmount: string;
  }): Promise<{ completion: SurveyCompletion; responses: Response[]; reward: Reward; transaction: Transaction; platformFee?: PlatformFee }>;
  
  getRewardsByUser(userId: string): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  createPlatformFee(platformFee: InsertPlatformFee): Promise<PlatformFee>;
  getPlatformFees(): Promise<PlatformFee[]>;
  
  getAllBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  checkAndAwardBadges(userId: string): Promise<UserBadge[]>;
  
  getLatestUnityReserves(): Promise<UnityReserve | undefined>;
  createUnityTransaction(transaction: InsertUnityTransaction): Promise<UnityTransaction>;
}

export class DatabaseStorage implements IStorage {
  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async toggleAdmin(userId: string): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const [updatedUser] = await db
      .update(users)
      .set({ isAdmin: !user.isAdmin })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getAllSurveys(): Promise<Survey[]> {
    return await db.select().from(surveys).orderBy(desc(surveys.createdAt));
  }

  async getSurveyById(id: string): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    return survey || undefined;
  }

  async createSurvey(insertSurvey: InsertSurvey): Promise<Survey> {
    const [survey] = await db
      .insert(surveys)
      .values(insertSurvey)
      .returning();
    return survey;
  }

  async updateSurveyResponseCount(id: string): Promise<void> {
    await db
      .update(surveys)
      .set({ totalResponses: db.$count(responses, eq(responses.surveyId, id)) })
      .where(eq(surveys.id, id));
  }

  async getQuestionsBySurvey(surveyId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.surveyId, surveyId))
      .orderBy(questions.order);
  }

  async createQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    return await db
      .insert(questions)
      .values(insertQuestions)
      .returning();
  }

  async createResponses(insertResponses: InsertResponse[]): Promise<Response[]> {
    return await db
      .insert(responses)
      .values(insertResponses)
      .returning();
  }

  async getUserResponses(userId: string): Promise<Response[]> {
    return await db
      .select()
      .from(responses)
      .where(eq(responses.userId, userId))
      .orderBy(desc(responses.submittedAt));
  }

  async hasSurveyCompletion(userId: string, surveyId: string): Promise<boolean> {
    const [completion] = await db
      .select()
      .from(surveyCompletions)
      .where(and(eq(surveyCompletions.userId, userId), eq(surveyCompletions.surveyId, surveyId)))
      .limit(1);
    return !!completion;
  }

  async createSurveyCompletion(insertCompletion: InsertSurveyCompletion): Promise<SurveyCompletion> {
    const [completion] = await db
      .insert(surveyCompletions)
      .values(insertCompletion)
      .returning();
    return completion;
  }

  async getUserSurveys(userId: string): Promise<Survey[]> {
    const completions = await db
      .select({ surveyId: surveyCompletions.surveyId })
      .from(surveyCompletions)
      .where(eq(surveyCompletions.userId, userId));
    
    const surveyIds = completions.map(c => c.surveyId);
    if (surveyIds.length === 0) return [];
    
    const result = await db.select().from(surveys);
    return result.filter(s => surveyIds.includes(s.id));
  }

  async completeSurveyWithTransaction(data: {
    userId: string;
    surveyId: string;
    selectedTier: string;
    answers: Record<string, string>;
    rewardAmount: string;
  }): Promise<{ completion: SurveyCompletion; responses: Response[]; reward: Reward; transaction: Transaction; platformFee?: PlatformFee }> {
    return await db.transaction(async (tx) => {
      const [completion] = await tx
        .insert(surveyCompletions)
        .values({
          userId: data.userId,
          surveyId: data.surveyId,
          selectedTier: data.selectedTier,
        })
        .returning();

      const responsesToInsert = Object.entries(data.answers).map(([questionId, answer]) => ({
        userId: data.userId,
        surveyId: data.surveyId,
        questionId,
        answer: String(answer),
      }));

      const createdResponses = await tx
        .insert(responses)
        .values(responsesToInsert)
        .returning();

      const rewardTiers = {
        gold: { token: "B3TR", tier: "gold", multiplier: 1.0 },
        silver: { token: "VET", tier: "silver", multiplier: 1.0 },
        bronze: { token: "VTHO", tier: "bronze", multiplier: 1.0 },
      };

      const rewardConfig = rewardTiers[data.selectedTier as keyof typeof rewardTiers];
      const grossAmount = parseFloat(data.rewardAmount) * rewardConfig.multiplier;
      
      const consumerFeePercentage = FEE_CONFIG.CONSUMER_FEE_PERCENTAGE;
      const feeAmount = (grossAmount * consumerFeePercentage) / 100;
      const netRewardAmount = (grossAmount - feeAmount).toFixed(8);
      const feeAmountFormatted = feeAmount.toFixed(8);
      
      const userTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      const feeTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

      const [reward] = await tx
        .insert(rewards)
        .values({
          userId: data.userId,
          surveyId: data.surveyId,
          tokenType: rewardConfig.token,
          amount: netRewardAmount,
          tier: rewardConfig.tier,
          status: "completed",
          txHash: userTxHash,
        })
        .returning();

      const [transaction] = await tx
        .insert(transactions)
        .values({
          userId: data.userId,
          type: "reward",
          tokenType: rewardConfig.token,
          amount: netRewardAmount,
          txHash: userTxHash,
          status: "completed",
          metadata: { 
            surveyId: data.surveyId, 
            rewardId: reward.id,
            grossAmount: grossAmount.toFixed(8),
            feeAmount: feeAmountFormatted,
            feePercentage: consumerFeePercentage,
          },
        })
        .returning();

      const [platformFee] = await tx
        .insert(platformFees)
        .values({
          type: "consumer_reward_fee",
          surveyId: data.surveyId,
          userId: data.userId,
          tokenType: rewardConfig.token,
          amount: feeAmountFormatted,
          feePercentage: consumerFeePercentage.toFixed(2),
          txHash: feeTxHash,
          status: "completed",
          metadata: {
            rewardId: reward.id,
            platformWallet: FEE_CONFIG.PLATFORM_WALLET_ADDRESS,
            grossAmount: grossAmount.toFixed(8),
            netAmount: netRewardAmount,
          },
        })
        .returning();

      await tx
        .insert(transactions)
        .values({
          userId: data.userId,
          type: "platform_fee",
          tokenType: rewardConfig.token,
          amount: feeAmountFormatted,
          txHash: feeTxHash,
          status: "completed",
          metadata: {
            feeType: "consumer_reward_fee",
            surveyId: data.surveyId,
            rewardId: reward.id,
            platformWallet: FEE_CONFIG.PLATFORM_WALLET_ADDRESS,
            platformFeeId: platformFee.id,
          },
        })
        .returning();

      await tx
        .update(surveys)
        .set({ totalResponses: sql`${surveys.totalResponses} + 1` })
        .where(eq(surveys.id, data.surveyId));

      return { completion, responses: createdResponses, reward, transaction, platformFee };
    });
  }

  async getRewardsByUser(userId: string): Promise<Reward[]> {
    return await db
      .select()
      .from(rewards)
      .where(eq(rewards.userId, userId))
      .orderBy(desc(rewards.createdAt));
  }

  async createReward(insertReward: InsertReward): Promise<Reward> {
    const [reward] = await db
      .insert(rewards)
      .values(insertReward)
      .returning();
    return reward;
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async createPlatformFee(insertPlatformFee: InsertPlatformFee): Promise<PlatformFee> {
    const [platformFee] = await db
      .insert(platformFees)
      .values(insertPlatformFee)
      .returning();
    return platformFee;
  }

  async getPlatformFees(): Promise<PlatformFee[]> {
    return await db
      .select()
      .from(platformFees)
      .orderBy(desc(platformFees.createdAt));
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(badges.requiredSurveys);
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .then(rows => rows.map(row => ({
        ...row.user_badges,
        badge: row.badges!,
      })));
  }

  async awardBadge(insertUserBadge: InsertUserBadge): Promise<UserBadge> {
    const [userBadge] = await db
      .insert(userBadges)
      .values(insertUserBadge)
      .onConflictDoNothing()
      .returning();
    return userBadge;
  }

  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    const completionCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(surveyCompletions)
      .where(eq(surveyCompletions.userId, userId))
      .then(rows => rows[0]?.count || 0);

    const allBadges = await this.getAllBadges();
    const earnedBadgeIds = await db
      .select({ badgeId: userBadges.badgeId })
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .then(rows => rows.map(row => row.badgeId));

    const eligibleBadges = allBadges.filter(
      badge => badge.requiredSurveys <= completionCount && !earnedBadgeIds.includes(badge.id)
    );

    const newlyAwarded: UserBadge[] = [];
    for (const badge of eligibleBadges) {
      const awarded = await this.awardBadge({ userId, badgeId: badge.id });
      if (awarded) {
        newlyAwarded.push(awarded);
      }
    }

    return newlyAwarded;
  }

  async getLatestUnityReserves(): Promise<UnityReserve | undefined> {
    const [reserve] = await db
      .select()
      .from(unityReserves)
      .orderBy(desc(unityReserves.snapshotAt))
      .limit(1);
    return reserve || undefined;
  }

  async createUnityTransaction(transaction: InsertUnityTransaction): Promise<UnityTransaction> {
    const [created] = await db
      .insert(unityTransactions)
      .values(transaction)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
