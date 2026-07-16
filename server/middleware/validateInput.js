/**
 * validateInput middleware
 * Simple validation and sanitization helper to protect API routes.
 */
const validateInput = (rules) => {
  return (req, res, next) => {
    const errors = [];

    // Basic sanitization & validation
    for (const [field, rule] of Object.entries(rules)) {
      let value = req.body[field];

      // Trim string inputs
      if (typeof value === "string") {
        value = value.trim();
        req.body[field] = value;
      }

      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push({ field, message: `${field} is required.` });
        continue;
      }

      if (value !== undefined && value !== null && value !== "") {
        if (rule.type === "email" && !/\S+@\S+\.\S+/.test(value)) {
          errors.push({ field, message: "Invalid email format." });
        }
        if (rule.type === "number" && isNaN(Number(value))) {
          errors.push({ field, message: `${field} must be a number.` });
        }
        if (rule.type === "date" && isNaN(Date.parse(value))) {
          errors.push({ field, message: "Invalid date format." });
        }
        if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
          errors.push({ field, message: `${field} must be at least ${rule.minLength} characters.` });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    next();
  };
};

module.exports = validateInput;
