const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const { successResponse, errorResponse } = require("../utils/response");
const logger = require("../config/logger");

/**
 * User Controller - Handles user-related HTTP requests
 */
class UserController {
  /**
   * Register a new user or update existing user
   * @route POST /api/user/register
   */
  async register(req, res, next) {
    try {
      const {
        walletAddress,
        dob,
        birthTime,
        birthPlace,
        username,
        latitude,
        longitude,
        timezoneOffset,
      } = req.body;

      // Register/update user
      const user = await userService.registerUser({
        walletAddress,
        dob,
        birthTime,
        birthPlace,
        username,
        latitude,
        longitude,
        timezoneOffset,
      });

      // Generate JWT token for the user
      const token = authService.generateToken(walletAddress, {
        userId: user.id,
      });

      logger.info("User registered successfully", { walletAddress });

      return successResponse(
        res,
        {
          message: "User registered successfully",
          user: {
            id: user.id,
            walletAddress: user.wallet_address,
            dob: user.dob,
            birthTime: user.birth_time,
            birthPlace: user.birth_place,
            latitude: user.latitude,
            longitude: user.longitude,
            timezoneOffset: user.timezone_offset,
            createdAt: user.created_at,
            username: user.username,
          },
          token,
        },
        201
      );
    } catch (error) {
      logger.error("Register controller error:", error);
      next(error);
    }
  }

  /**
   * Get user profile by wallet address
   * @route GET /api/user/profile/:walletAddress
   */
  async getProfile(req, res, next) {
    try {
      const { walletAddress } = req.params;

      const user = await userService.findUserByWallet(walletAddress);

      if (!user) {
        return errorResponse(res, "User not found", 404);
      }

      return successResponse(res, {
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          dob: user.dob,
          birthTime: user.birth_time,
          birthPlace: user.birth_place,
          latitude: user.latitude,
          longitude: user.longitude,
          twitterId: user.twitter_id,
          twitterUsername: user.twitter_username,
          twitterProfileUrl: user.twitter_profile_url,
          timezoneOffset: user.timezone_offset,
          createdAt: user.created_at,
          username: user.username,
        },
      });
    } catch (error) {
      logger.error("Get profile controller error:", error);
      next(error);
    }
  }

  /**
   * Register a user X account
   * @route POST /api/user/x-account
   */
  async registerX(req, res, next) {
    try {
      const { id, twitterId, twitterUsername, twitterProfileUrl } = req.body;

      if (!id || (!twitterId && !twitterUsername && !twitterProfileUrl)) {
        return res.status(400).json({
          success: false,
          message: "User id and X account details are required",
        });
      }

      const user = await userService.registerXAccount({
        userId: id,
        twitterId,
        twitterUsername,
        twitterProfileUrl,
      });

      return successResponse(
        res,
        {
          message: "User X account linked successfully",
          user: {
            id: user.id,
            walletAddress: user.wallet_address,
            dob: user.dob,
            createdAt: user.created_at,
            username: user.username,
            twitterId: user.twitter_id,
            twitterUsername: user.twitter_username,
            twitterProfileUrl: user.twitter_profile_url,
          },
        },
        200
      );
    } catch (error) {
      logger.error("Register X controller error:", error);
      next(error);
    }
  }
}

module.exports = new UserController();
