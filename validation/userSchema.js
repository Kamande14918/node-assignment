const Joi = require("joi");

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(3).max(30).required(),
  password: Joi.string()
  .trim()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  .required()
  .messages({
    "string.pattern.base":
    "Password must be at least 8 characters long and include upper and lower case letters, a number and a special character."
  })
})

module.exports = userSchema;