const Joi = require("joi");
const { errorResponse } = require("../utils/response");
const logger = require("../config/logger");

/**
 * Validation middleware factory
 * Creates middleware to validate request data against Joi schemas
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      logger.warn("Validation error:", errors);
      return errorResponse(res, "Validation failed", 400, errors);
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * User registration validation schema
 */
const userRegistrationSchema = Joi.object({
  walletAddress: Joi.string().required().trim().messages({
    "string.empty": "Wallet address is required",
    "any.required": "Wallet address is required",
  }),

  username: Joi.string().required().trim().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),

  dob: Joi.string()
    .optional()
    .allow("", null)
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .messages({
      "string.pattern.base": "Date of birth must be in YYYY-MM-DD format",
    }),

  birthTime: Joi.string()
    .optional()
    .allow("", null)
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .messages({
      "string.pattern.base": "Birth time must be in HH:MM format",
    }),

  birthPlace: Joi.string().optional().allow("", null).trim(),
}).options({ stripUnknown: true });

/**
 * Horoscope confirmation validation schema
 */
const horoscopeConfirmSchema = Joi.object({
  walletAddress: Joi.string()
    .required()
    .min(32)
    .max(44)
    .pattern(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
    .messages({
      "string.pattern.base": "Invalid Solana wallet address format",
      "string.empty": "Wallet address is required",
      "any.required": "Wallet address is required",
    }),

  signature: Joi.string().required().min(1).messages({
    "string.empty": "Transaction signature is required",
    "any.required": "Transaction signature is required",
  }),
});

/**
 * X account creation validation schema
 */
const xAccountCreationSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      "string.pattern.base": "Invalid User ID",
      "string.empty": "User ID is required",
      "any.required": "User ID is required",
    }),

  twitterId: Joi.string().required().min(1).messages({
    "string.empty": "Twitter id is required",
    "any.required": "Twitter Id is required",
  }),

  twitterUsername: Joi.string().required().min(1).messages({
    "string.empty": "Twitter Username is required",
    "any.required": "Twitter Username is required",
  }),

  twitterProfileUrl: Joi.string().required().min(1).messages({
    "string.empty": "Twitter Profile Url is required",
    "any.required": "Twitter Profile Url is required",
  }),
});

module.exports = {
  validate,
  validateUserRegistration: validate(userRegistrationSchema),
  validateHoroscopeConfirm: validate(horoscopeConfirmSchema),
  validateTwitterConfirm: validate(xAccountCreationSchema),
};
