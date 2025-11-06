import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";

// Session middleware for authentication
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    avatarUrl?: string;
    hasRequiredRole?: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Verify access code and create session
  app.post("/api/verify-code", async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ success: false, error: "Code is required" });
      }
      
      // Find access code
      const accessCode = await storage.getAccessCodeByCode(code);
      
      if (!accessCode) {
        return res.status(404).json({ success: false, error: "Invalid code" });
      }
      
      if (accessCode.isUsed) {
        return res.status(400).json({ success: false, error: "Code has already been used" });
      }
      
      if (new Date() > accessCode.expiresAt) {
        return res.status(400).json({ success: false, error: "Code has expired" });
      }
      
      // Mark code as used
      await storage.markCodeAsUsed(code);
      
      // Create session
      req.session.userId = accessCode.userId;
      req.session.username = accessCode.username;
      req.session.avatarUrl = accessCode.avatarUrl || undefined;
      req.session.hasRequiredRole = accessCode.hasRequiredRole;
      
      res.json({
        success: true,
        user: {
          userId: accessCode.userId,
          username: accessCode.username,
          avatarUrl: accessCode.avatarUrl,
          hasRequiredRole: accessCode.hasRequiredRole,
        }
      });
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  
  // Get current session
  app.get("/api/session", async (req: Request, res: Response) => {
    if (req.session.userId) {
      res.json({
        success: true,
        user: {
          userId: req.session.userId,
          username: req.session.username,
          avatarUrl: req.session.avatarUrl,
          hasRequiredRole: req.session.hasRequiredRole,
        }
      });
    } else {
      res.json({ success: false });
    }
  });
  
  // Load user profile by username
  app.get("/api/profile/:username", async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      
      // Get trades for this username
      const trades = await storage.getTradeRecapsByUsername(username);
      
      // Try to find user by access code if no trades found
      let userId: string | null = null;
      let userUsername: string = username;
      let avatarUrl: string | null = null;
      let isPremium: boolean = false;
      
      if (trades.length > 0) {
        // User has trades - get user info from first trade
        const firstTrade = trades[0];
        userId = firstTrade.userId;
        userUsername = firstTrade.username;
      }
      
      // Try to find user by access code (either to get missing info or to find user without trades)
      const accessCodes = await storage.getAllAccessCodes();
      const accessCode = accessCodes.find(ac => ac.username.toLowerCase() === username.toLowerCase());
      
      if (accessCode) {
        userId = accessCode.userId;
        userUsername = accessCode.username;
        avatarUrl = accessCode.avatarUrl;
        isPremium = accessCode.hasRequiredRole;
      } else if (trades.length === 0) {
        // User not found in trades or access codes
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      // Get customization
      const customization = await storage.getProfileCustomization(userId!);
      
      // Check if viewing own profile
      const isOwnProfile = req.session.userId === userId;
      
      // Determine if user has premium (required role)
      if (isOwnProfile) {
        isPremium = req.session.hasRequiredRole || false;
      }
      
      res.json({
        success: true,
        user: {
          userId: userId,
          username: userUsername,
          avatarUrl: avatarUrl,
          totalTrades: trades.length,
          trades: trades.map(t => ({
            id: t.id,
            notes: t.notes,
            pnl: t.pnl,
            imageUrl: t.imageUrl,
            createdAt: t.createdAt,
          })),
          customization: customization || {},
          isOwnProfile: isOwnProfile,
          isPremium: isPremium,
        }
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  
  // Save profile customization
  app.post("/api/customization", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      if (!req.session.hasRequiredRole) {
        return res.status(403).json({ success: false, error: "Premium access required" });
      }
      
      const customization = {
        userId: req.session.userId,
        ...req.body,
      };
      
      await storage.saveProfileCustomization(customization);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving customization:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  
  // Update profile visibility
  app.post("/api/profile/visibility", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const { isPublic } = req.body;
      
      // Get current customization
      const customization = await storage.getProfileCustomization(req.session.userId);
      
      // Update visibility
      await storage.saveProfileCustomization({
        userId: req.session.userId,
        ...customization,
        isProfilePublic: isPublic,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating visibility:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  
  // Delete trade
  app.delete("/api/trades/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Not authenticated" });
      }
      
      const tradeId = parseInt(req.params.id);
      
      // Check if trade exists and belongs to user
      const trade = await storage.getTradeRecapById(tradeId);
      
      if (!trade) {
        return res.status(404).json({ success: false, error: "Trade not found" });
      }
      
      if (trade.userId !== req.session.userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      
      await storage.deleteTradeRecap(tradeId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
