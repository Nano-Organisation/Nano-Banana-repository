
// Rate Limiting Configuration
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;
let requestTimestamps: number[] = [];

/**
 * Sanitize Input: Strips HTML/Script tags to prevent XSS.
 * Removes potentially executable characters while preserving text content.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  // Strip HTML tags
  let clean = input.replace(/<[^>]*>?/gm, '');
  // Escape potentially dangerous characters if needed, but for prompt engineering,
  // we usually want raw text. React handles output escaping by default.
  // We trim whitespace to prevent empty-spam.
  return clean.trim();
};

/**
 * Prompt Injection Defense:
 * Detects common patterns used to override system instructions.
 */
export const detectPromptInjection = (input: string): boolean => {
  const patterns = [
    /ignore previous instructions/i,
    /forget all instructions/i,
    /system override/i,
    /ignore all rules/i,
    /bypass safety/i
  ];
  return patterns.some(pattern => pattern.test(input));
};

/**
 * Length Limits:
 * Enforces character limits to prevent UI breaking or token overflow costs.
 */
export const validateLength = (input: string, maxLength: number = 5000): boolean => {
  return input.length <= maxLength;
};

/**
 * Profanity/Safety Filtering:
 * Blocks harmful content before sending to API.
 * (Simplified list for demonstration)
 */
export const containsHarmfulContent = (input: string): boolean => {
  const harmfulPatterns = [
    /\b(hate speech)\b/i,
    /\b(kill yourself)\b/i,
    /\b(terrorist)\b/i
    // Add more specific blocklist items here
  ];
  return harmfulPatterns.some(pattern => pattern.test(input));
};

/**
 * Rate Limiting:
 * Prevents spamming to exhaust API quotas.
 */
export const checkRateLimit = (): boolean => {
  const now = Date.now();
  // Filter out timestamps older than the window
  requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp < WINDOW_MS);
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  requestTimestamps.push(now);
  return true;
};

/**
 * Format Validation: Email
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Format Validation: Date (YYYY-MM-DD)
 */
export const validateDate = (date: string): boolean => {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(date)) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Master Security Check
 * Runs all text-based checks in one go.
 */
export const runSecurityChecks = (input: string, context: string = "Input"): void => {
  if (!checkRateLimit()) {
    throw new Error("Rate Limit Exceeded: You are making requests too quickly. Please wait a moment.");
  }

  if (!validateLength(input)) {
    throw new Error(`${context} is too long. Maximum allowed characters: 5000.`);
  }

  if (containsHarmfulContent(input)) {
    throw new Error("Safety Alert: Input contains prohibited or harmful content.");
  }

  if (detectPromptInjection(input)) {
    throw new Error("Security Alert: Prompt injection attempt detected.");
  }
};
