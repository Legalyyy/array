import express, { type Express } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";
import { startBot } from "./bot.js";

// Extend session data type
declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = 5000;

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is required for security');
  process.exit(1);
}

app.set('trust proxy', true);
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// DEVELOPMENT ONLY - Create test access code
app.post("/api/dev/create-code", async (req, res) => {
  try {
    const { username, isPremium } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: "Username is required" });
    }
    
    // Generate random code
    const code = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    const userId = `test-${Date.now()}`;
    
    // Create access code
    await storage.createAccessCode({
      code,
      userId,
      username,
      avatarUrl: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`,
      roles: isPremium ? ['premium'] : [],
      hasRequiredRole: isPremium || false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    
    // Also create some sample trades for this user
    await storage.addTradeRecap({
      userId,
      username,
      notes: "Great trade on SPY calls",
      pnl: "+$250.00",
      imageUrl: "https://i.postimg.cc/1ztkf4hX/moveimage.png",
    });
    
    await storage.addTradeRecap({
      userId,
      username,
      notes: "Lost on TSLA puts",
      pnl: "-$150.00",
      imageUrl: null,
    });
    
    res.json({ 
      success: true, 
      code,
      message: `Access code created for ${username}. Use this code to login.`
    });
  } catch (error) {
    console.error("Error creating test code:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Verify access code endpoint
app.post("/api/verify-code", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: "Code is required" 
      });
    }

    // Validate code format (XXX-XXX)
    const codePattern = /^\d{3}-\d{3}$/;
    if (!codePattern.test(code)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid code format. Expected XXX-XXX" 
      });
    }

    // Get code from database
    const accessCode = await storage.getAccessCodeByCode(code);

    if (!accessCode) {
      return res.status(404).json({ 
        success: false, 
        error: "Invalid code" 
      });
    }

    // Check if code has expired
    if (new Date() > new Date(accessCode.expiresAt)) {
      return res.status(400).json({ 
        success: false, 
        error: "Code has expired. Generate a new one with /code" 
      });
    }

    // Mark code as used (for tracking, but doesn't prevent reuse)
    if (!accessCode.isUsed) {
      await storage.markCodeAsUsed(code);
    }

    // Save user info to session
    req.session.userId = accessCode.userId;
    req.session.username = accessCode.username;

    // Return user information (without userId for security)
    return res.json({
      success: true,
      user: {
        username: accessCode.username,
        avatarUrl: accessCode.avatarUrl,
        hasRequiredRole: accessCode.hasRequiredRole,
      }
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

// Get user profile by username
app.get("/api/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get user's trade recaps to extract user info
    const trades = await storage.getTradeRecapsByUsername(username);
    
    if (trades.length === 0) {
      // User not found or has no trades
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    // Check if logged in user is viewing their own profile
    // Compare session username with requested username (case-insensitive)
    const isOwnProfile = req.session.username?.toLowerCase() === username.toLowerCase();
    
    // Get avatar URL and hasRequiredRole from access codes
    let avatarUrl: string | null = null;
    let isPremium = false;
    try {
      const userAccessCode = await storage.getAccessCodeByUserId(trades[0].userId);
      if (userAccessCode) {
        avatarUrl = userAccessCode.avatarUrl || null;
        isPremium = userAccessCode.hasRequiredRole || false;
        console.log(`Profile request for ${username}: Found access code with hasRequiredRole:`, isPremium);
      } else {
        console.log(`Profile request for ${username}: No access code found`);
      }
    } catch (error) {
      console.error("Error fetching avatar:", error);
    }

    console.log(`Premium status for ${username}:`, {
      userId: trades[0].userId,
      isPremium
    });

    // Get profile customization if exists
    let customization = {};
    try {
      const profileCustomization = await storage.getProfileCustomization(trades[0].userId);
      if (profileCustomization) {
        customization = {
          backgroundImage: profileCustomization.backgroundImage,
          backgroundColor: profileCustomization.backgroundColor,
          backgroundGradient: profileCustomization.backgroundGradient,
          overlayColor: profileCustomization.overlayColor,
          overlayOpacity: profileCustomization.overlayOpacity,
          backgroundBlur: profileCustomization.backgroundBlur,
          nameFont: profileCustomization.nameFont,
          nameColor: profileCustomization.nameColor,
          nameGradient: profileCustomization.nameGradient,
          nameGlowColor: profileCustomization.nameGlowColor,
          nameAnimation: profileCustomization.nameAnimation,
          galleryDisplay: profileCustomization.galleryDisplay,
          avatarGlowColor: profileCustomization.avatarGlowColor,
          avatarGlowEnabled: profileCustomization.avatarGlowEnabled,
          profileEffect: profileCustomization.profileEffect,
          profileIntro: profileCustomization.profileIntro,
          showPnl: profileCustomization.showPnl,
          showNotes: profileCustomization.showNotes,
          isProfilePublic: profileCustomization.isProfilePublic,
        };
      }
    } catch (error) {
      console.error("Error fetching customization:", error);
    }
    
    // Sanitize trades - remove all sensitive/redundant fields
    const sanitizedTrades = trades.map(trade => ({
      id: trade.id,
      pnl: trade.pnl,
      notes: trade.notes,
      imageUrl: trade.imageUrl,
      createdAt: trade.createdAt
    }));
    
    // Return user info
    const userInfo = {
      username: username,  // Use the requested username (already public)
      totalTrades: trades.length,
      avatarUrl: avatarUrl,
      trades: sanitizedTrades,
      isOwnProfile: isOwnProfile,
      isPremium: isPremium,
      customization: customization,
    };
    
    return res.json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

// Save profile customization (requires authentication)
app.post("/api/customization", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    const customizationData = req.body;

    // Save customization
    await storage.saveProfileCustomization({
      userId: req.session.userId,
      ...customizationData,
    });

    return res.json({
      success: true,
      message: "Customization saved successfully"
    });
  } catch (error) {
    console.error("Error saving customization:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

// Update profile visibility (does NOT require premium)
app.post("/api/profile/visibility", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }

    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid visibility value" 
      });
    }

    // Get or create customization
    let customization = await storage.getProfileCustomization(req.session.userId);
    
    if (customization) {
      await storage.saveProfileCustomization({
        userId: req.session.userId,
        isProfilePublic: isPublic,
      });
    } else {
      await storage.saveProfileCustomization({
        userId: req.session.userId,
        isProfilePublic: isPublic,
      });
    }

    return res.json({
      success: true,
      message: "Profile visibility updated",
      isPublic
    });
  } catch (error) {
    console.error("Error updating profile visibility:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

// Delete a trade (requires authentication)
app.delete("/api/trades/:id", async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id);
    
    // Check if user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Authentication required" 
      });
    }
    
    // Get the trade to verify ownership
    const trade = await storage.getTradeRecapById(tradeId);
    
    if (!trade) {
      return res.status(404).json({ 
        success: false, 
        error: "Trade not found" 
      });
    }
    
    // Verify the user owns this trade
    if (trade.userId !== req.session.userId) {
      return res.status(403).json({ 
        success: false, 
        error: "You can only delete your own trades" 
      });
    }
    
    // Delete the trade
    await storage.deleteTradeRecap(tradeId);
    
    return res.json({
      success: true,
      message: "Trade deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
});

// Determine client path based on environment
const isDev = process.env.NODE_ENV === 'development';
const clientPath = isDev 
  ? path.resolve(__dirname, "../client")
  : path.resolve(__dirname, "client");

app.use(express.static(clientPath));

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Web interface available`);
  console.log(`📁 Serving client from: ${clientPath}`);
});

// Start Discord bot if token is available
if (process.env.DISCORD_TOKEN) {
  console.log(`🤖 Starting Discord bot...`);
  startBot().catch((error) => {
    console.error("❌ Failed to start Discord bot:", error);
  });
} else {
  console.log("⚠️  DISCORD_TOKEN not found - bot will not start");
  console.log("⚠️  Web login will not work without the bot running");
}
