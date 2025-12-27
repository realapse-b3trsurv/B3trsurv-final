import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertSurveySchema,
  insertQuestionSchema,
  insertResponseSchema,
  insertRewardSchema,
  insertTransactionSchema,
} from "@shared/schema";
import { FEE_CONFIG } from "@shared/fee-config";
import { calculateUnityPrice, getLatestUnityPrice, updateReserveSnapshot } from "./unity-pricing";
import {
  deployUnityContract,
  loadUnityContract,
  mintUnityTokens,
  burnUnityTokens,
  getUnityBalance,
  getUnityTotalSupply,
  getWalletAddress,
  generateNewWallet,
  web3,
} from "./vechain-service";
import "./types";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/connect", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      let user = await storage.getUserByWallet(walletAddress);
      
      if (!user) {
        const anonymousId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const nftTokenId = `NFT-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
        
        user = await storage.createUser({
          walletAddress,
          anonymousId,
          nftTokenId,
        });
      }

      req.session.userId = user.id;
      req.session.walletAddress = user.walletAddress;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      return res.json(user);
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(500).json({ error: "Failed to connect wallet" });
    }
  });

  app.get("/api/user/me", async (req, res) => {
    try {
      if (!req.session.walletAddress) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserByWallet(req.session.walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ error: "Failed to get user" });
    }
  });

  // WARNING: Development/Testing Only - This endpoint allows self-escalation to admin
  // In production, remove this endpoint and manage admin status through database directly
  app.post("/api/user/toggle-admin", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.toggleAdmin(req.session.userId);
      return res.json(user);
    } catch (error) {
      console.error("Toggle admin error:", error);
      return res.status(500).json({ error: "Failed to toggle admin status" });
    }
  });

  app.get("/api/surveys", async (req, res) => {
    try {
      const surveys = await storage.getAllSurveys();
      return res.json(surveys);
    } catch (error) {
      console.error("Get surveys error:", error);
      return res.status(500).json({ error: "Failed to get surveys" });
    }
  });

  app.get("/api/surveys/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const survey = await storage.getSurveyById(id);
      
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }

      return res.json(survey);
    } catch (error) {
      console.error("Get survey error:", error);
      return res.status(500).json({ error: "Failed to get survey" });
    }
  });

  app.post("/api/surveys", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Only administrators can create surveys" });
      }

      const surveyData = {
        ...req.body,
        creatorId: req.session.userId,
        maxResponses: req.body.maxResponses ? parseInt(req.body.maxResponses) : null,
      };

      const parsedSurvey = insertSurveySchema.parse(surveyData);
      const survey = await storage.createSurvey(parsedSurvey);

      if (req.body.questions && req.body.questions.length > 0) {
        const questionsToInsert = req.body.questions.map((q: any, index: number) => ({
          surveyId: survey.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || null,
          required: q.required !== undefined ? q.required : true,
          order: index,
        }));

        await storage.createQuestions(questionsToInsert);
      }

      if (survey.maxResponses && survey.maxResponses > 0) {
        const rewardAmount = parseFloat(survey.rewardAmount);
        const totalBudget = rewardAmount * survey.maxResponses;
        const businessFeePercentage = FEE_CONFIG.BUSINESS_FEE_PERCENTAGE;
        const businessFeeAmount = (totalBudget * businessFeePercentage) / 100;

        const feeTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

        const platformFee = await storage.createPlatformFee({
          type: "business_survey_creation_fee",
          surveyId: survey.id,
          userId: req.session.userId,
          tokenType: survey.rewardToken,
          amount: businessFeeAmount.toFixed(8),
          feePercentage: businessFeePercentage.toFixed(2),
          txHash: feeTxHash,
          status: "completed",
          metadata: {
            platformWallet: FEE_CONFIG.PLATFORM_WALLET_ADDRESS,
            totalBudget: totalBudget.toFixed(8),
            rewardAmount: survey.rewardAmount,
            maxResponses: survey.maxResponses,
          },
        });

        await storage.createTransaction({
          userId: req.session.userId,
          type: "platform_fee",
          tokenType: survey.rewardToken,
          amount: businessFeeAmount.toFixed(8),
          txHash: feeTxHash,
          status: "completed",
          metadata: {
            feeType: "business_survey_creation_fee",
            surveyId: survey.id,
            platformWallet: FEE_CONFIG.PLATFORM_WALLET_ADDRESS,
            platformFeeId: platformFee.id,
            totalBudget: totalBudget.toFixed(8),
          },
        });
      }

      return res.json(survey);
    } catch (error) {
      console.error("Create survey error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid survey data", details: error.errors });
      }
      return res.status(500).json({ error: "Failed to create survey" });
    }
  });

  app.get("/api/surveys/:id/questions", async (req, res) => {
    try {
      const { id } = req.params;
      const questions = await storage.getQuestionsBySurvey(id);
      return res.json(questions);
    } catch (error) {
      console.error("Get questions error:", error);
      return res.status(500).json({ error: "Failed to get questions" });
    }
  });

  app.post("/api/responses", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { surveyId, answers, selectedTier } = req.body;

      if (!surveyId || !answers) {
        return res.status(400).json({ error: "Survey ID and answers are required" });
      }

      if (!selectedTier || !["gold", "silver", "bronze"].includes(selectedTier)) {
        return res.status(400).json({ error: "Valid reward tier selection is required" });
      }

      const survey = await storage.getSurveyById(surveyId);
      if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
      }

      const alreadyCompleted = await storage.hasSurveyCompletion(req.session.userId, surveyId);
      if (alreadyCompleted) {
        return res.status(400).json({ error: "You have already completed this survey" });
      }

      const questions = await storage.getQuestionsBySurvey(surveyId);
      const requiredQuestions = questions.filter(q => q.required);
      const missingAnswers = requiredQuestions.filter(q => !answers[q.id]);
      
      if (missingAnswers.length > 0) {
        return res.status(400).json({ 
          error: "Missing required answers", 
          missingQuestions: missingAnswers.map(q => q.id) 
        });
      }

      const result = await storage.completeSurveyWithTransaction({
        userId: req.session.userId,
        surveyId,
        selectedTier,
        answers,
        rewardAmount: survey.rewardAmount,
      });

      const newBadges = await storage.checkAndAwardBadges(req.session.userId);

      return res.json({ ...result, newBadges });
    } catch (error) {
      console.error("Submit responses error:", error);
      return res.status(500).json({ error: "Failed to submit responses" });
    }
  });

  app.get("/api/my-surveys", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const surveys = await storage.getUserSurveys(req.session.userId);
      return res.json(surveys);
    } catch (error) {
      console.error("Get my surveys error:", error);
      return res.status(500).json({ error: "Failed to get surveys" });
    }
  });

  app.get("/api/my-rewards", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const rewards = await storage.getRewardsByUser(req.session.userId);
      return res.json(rewards);
    } catch (error) {
      console.error("Get rewards error:", error);
      return res.status(500).json({ error: "Failed to get rewards" });
    }
  });

  app.get("/api/my-transactions", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const transactions = await storage.getTransactionsByUser(req.session.userId);
      return res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      return res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  app.get("/api/badges", async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      return res.json(badges);
    } catch (error) {
      console.error("Get badges error:", error);
      return res.status(500).json({ error: "Failed to get badges" });
    }
  });

  app.get("/api/my-badges", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userBadges = await storage.getUserBadges(req.session.userId);
      return res.json(userBadges);
    } catch (error) {
      console.error("Get user badges error:", error);
      return res.status(500).json({ error: "Failed to get user badges" });
    }
  });

  // Unity Token Endpoints
  app.get("/api/unity/price", async (req, res) => {
    try {
      const priceData = await getLatestUnityPrice();
      return res.json(priceData);
    } catch (error) {
      console.error("Get Unity price error:", error);
      return res.status(500).json({ error: "Failed to get Unity price" });
    }
  });

  app.post("/api/unity/calculate-price", async (req, res) => {
    try {
      const circulatingSupply = req.body.circulatingSupply;
      const priceData = await calculateUnityPrice(circulatingSupply);
      return res.json(priceData);
    } catch (error) {
      console.error("Calculate Unity price error:", error);
      return res.status(500).json({ error: "Failed to calculate Unity price" });
    }
  });

  app.get("/api/unity/reserves", async (req, res) => {
    try {
      const reserves = await storage.getLatestUnityReserves();
      return res.json(reserves);
    } catch (error) {
      console.error("Get Unity reserves error:", error);
      return res.status(500).json({ error: "Failed to get Unity reserves" });
    }
  });

  app.get("/api/unity/contract", async (req, res) => {
    try {
      const walletAddress = getWalletAddress();
      if (!walletAddress) {
        return res.status(503).json({ 
          error: "VeChain wallet not configured. Set VECHAIN_PRIVATE_KEY or use /api/unity/generate-wallet" 
        });
      }

      const contract = await loadUnityContract();
      if (!contract) {
        return res.status(404).json({ error: "Unity contract not deployed" });
      }
      const totalSupply = await getUnityTotalSupply();
      return res.json({
        ...contract,
        totalSupply,
        reserveAddress: walletAddress,
      });
    } catch (error) {
      console.error("Get Unity contract error:", error);
      return res.status(500).json({ error: "Failed to get Unity contract info" });
    }
  });

  app.post("/api/unity/generate-wallet", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const wallet = generateNewWallet();
      
      return res.json({
        address: wallet.address,
        privateKey: wallet.privateKey,
        instructions: "Save this private key securely and add it to your secrets as VECHAIN_PRIVATE_KEY. This is shown only once."
      });
    } catch (error) {
      console.error("Generate wallet error:", error);
      return res.status(500).json({ error: "Failed to generate wallet" });
    }
  });

  app.post("/api/unity/deploy", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const walletAddress = getWalletAddress();
      if (!walletAddress) {
        return res.status(503).json({ 
          error: "VeChain wallet not configured. Set VECHAIN_PRIVATE_KEY or use /api/unity/generate-wallet" 
        });
      }

      const existingContract = await loadUnityContract();
      if (existingContract) {
        return res.status(400).json({ 
          error: "Unity contract already deployed",
          address: existingContract.address
        });
      }

      const { name, symbol, initialSupply } = req.body;
      const contract = await deployUnityContract(name, symbol, initialSupply);
      
      // Initialize reserves snapshot
      await updateReserveSnapshot(0, 0, 0, contract.address);

      return res.json(contract);
    } catch (error) {
      console.error("Deploy Unity contract error:", error);
      return res.status(500).json({ error: "Failed to deploy Unity contract" });
    }
  });

  app.post("/api/unity/mint", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const walletAddress = getWalletAddress();
      if (!walletAddress) {
        return res.status(503).json({ 
          error: "VeChain wallet not configured. Set VECHAIN_PRIVATE_KEY or use /api/unity/generate-wallet" 
        });
      }

      const { recipientAddress, amount, depositToken, depositAmount } = req.body;
      
      if (!recipientAddress || !amount || !depositToken || !depositAmount) {
        return res.status(400).json({ 
          error: "recipientAddress, amount, depositToken, and depositAmount required" 
        });
      }

      // Update reserves
      const reserves = await storage.getLatestUnityReserves();
      const updatedReserves = {
        VET: parseFloat(reserves?.vetAmount || "0"),
        VTHO: parseFloat(reserves?.vthoAmount || "0"),
        B3TR: parseFloat(reserves?.b3trAmount || "0"),
      };
      updatedReserves[depositToken as keyof typeof updatedReserves] += parseFloat(depositAmount);

      // Mint Unity tokens (helpers handle wei conversion)
      const txHash = await mintUnityTokens(recipientAddress, amount);

      // Update reserve snapshot
      const contract = await loadUnityContract();
      await updateReserveSnapshot(
        updatedReserves.VET,
        updatedReserves.VTHO,
        updatedReserves.B3TR,
        contract?.address
      );

      // Record transaction
      await storage.createUnityTransaction({
        userId: req.session.userId,
        type: "mint",
        unityAmount: amount,
        tokenType: depositToken,
        tokenAmount: depositAmount,
        exchangeRate: (parseFloat(depositAmount) / parseFloat(amount)).toFixed(8),
        txHash,
        status: "completed",
        metadata: {
          recipientAddress,
          reserves: updatedReserves,
        },
      });

      return res.json({ txHash, unityMinted: amount });
    } catch (error) {
      console.error("Mint Unity error:", error);
      return res.status(500).json({ error: "Failed to mint Unity tokens" });
    }
  });

  app.post("/api/unity/burn", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const walletAddress = getWalletAddress();
      if (!walletAddress) {
        return res.status(503).json({ 
          error: "VeChain wallet not configured. Set VECHAIN_PRIVATE_KEY or use /api/unity/generate-wallet" 
        });
      }

      const { amount, tokenToRelease } = req.body;
      
      if (!amount || !tokenToRelease) {
        return res.status(400).json({ error: "amount and tokenToRelease required" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate token amount to release
      const priceData = await getLatestUnityPrice();
      if (!priceData) {
        return res.status(500).json({ error: "Unable to fetch Unity price data" });
      }
      
      const unityValue = parseFloat(amount) * priceData.unityPriceUsd;
      const burnFee = 0.005;
      const netValue = unityValue * (1 - burnFee);
      
      const tokenPrice = priceData.tokenPrices[tokenToRelease as keyof typeof priceData.tokenPrices];
      const tokenAmount = tokenPrice > 0 ? netValue / tokenPrice : 0;

      // Update reserves
      const reserves = await storage.getLatestUnityReserves();
      const updatedReserves = {
        VET: parseFloat(reserves?.vetAmount || "0"),
        VTHO: parseFloat(reserves?.vthoAmount || "0"),
        B3TR: parseFloat(reserves?.b3trAmount || "0"),
      };
      updatedReserves[tokenToRelease as keyof typeof updatedReserves] = Math.max(
        0,
        updatedReserves[tokenToRelease as keyof typeof updatedReserves] - tokenAmount
      );

      // Burn Unity tokens (helpers handle wei conversion)
      const txHash = await burnUnityTokens(user.walletAddress, amount);

      // Update reserve snapshot
      const contract = await loadUnityContract();
      await updateReserveSnapshot(
        updatedReserves.VET,
        updatedReserves.VTHO,
        updatedReserves.B3TR,
        contract?.address
      );

      // Record transaction
      await storage.createUnityTransaction({
        userId: req.session.userId,
        type: "burn",
        unityAmount: amount,
        tokenType: tokenToRelease,
        tokenAmount: tokenAmount.toFixed(8),
        exchangeRate: (tokenAmount / parseFloat(amount)).toFixed(8),
        txHash,
        status: "completed",
        metadata: {
          userAddress: user.walletAddress,
          reserves: updatedReserves,
          burnFee,
        },
      });

      return res.json({ txHash, tokenReleased: tokenAmount.toFixed(8), token: tokenToRelease });
    } catch (error) {
      console.error("Burn Unity error:", error);
      return res.status(500).json({ error: "Failed to burn Unity tokens" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
