
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
 */
export const containsHarmfulContent = (input: string): boolean => {
  const harmfulPatterns = [
    /\b(hate speech)\b/i,
    /\b(kill yourself)\b/i,
    /\b(terrorist)\b/i
  ];
  return harmfulPatterns.some(pattern => pattern.test(input));
};

/**
 * Rate Limiting:
 * Prevents spamming to exhaust API quotas.
 */
export const checkRateLimit = (): boolean => {
  const now = Date.now();
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
 * Master Security Check (Text)
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

// ==========================================
// FILE SECURITY SECTION
// ==========================================

const MAX_FILE_SIZE_MB = 50;

/**
 * Check file size
 */
export const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
};

/**
 * Malware Heuristics (Basic)
 * Checks for double extensions or executable types disguised.
 */
export const scanForMalwarePatterns = (file: File): boolean => {
  const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.scr'];
  const name = file.name.toLowerCase();
  
  // Check if it ends with dangerous ext
  if (dangerousExtensions.some(ext => name.endsWith(ext))) return true;
  
  // Check for double extensions (e.g. image.png.exe)
  return dangerousExtensions.some(ext => name.includes(ext + '.'));
};

/**
 * Magic Number Validation
 * Reads the first few bytes of the file to ensure the content matches the extension.
 */
export const validateMagicNumbers = async (file: File, type: 'image' | 'pdf' | 'audio' | 'video'): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (!e.target?.result) return resolve(false);
      const arr = new Uint8Array(e.target.result as ArrayBuffer);
      let header = "";
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).toUpperCase().padStart(2, '0');
      }
      
      if (type === 'pdf') {
        resolve(header.startsWith("25504446"));
      } else if (type === 'image') {
        resolve(
          header.startsWith("FFD8FF") || // JPG
          header.startsWith("89504E47") || // PNG
          header.startsWith("47494638") // GIF
        );
      } else if (type === 'audio') {
        resolve(
          header.startsWith("494433") || // MP3 ID3
          header.startsWith("52494646") || // WAV RIFF
          header.startsWith("FFF") // MP3 Frame Sync
        );
      } else if (type === 'video') {
        if (header.startsWith("1A45DFA3")) return resolve(true);
        const ftyp = header.substring(8, 16);
        if (ftyp === "66747970") return resolve(true);
        resolve(false);
      } else {
        resolve(true);
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
};

/**
 * Image Dimension Check
 * Prevents "Pixel Bombs" (Decompression Bombs)
 */
export const validateImageDimensions = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    // Fixed: Using document.createElement('img') instead of 'new Image()' to prevent 'Illegal constructor' errors
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width > 4096 || img.height > 4096) resolve(false);
      else resolve(true);
    };
    img.onerror = () => resolve(false);
  });
};

/**
 * Master File Security Check
 */
export const runFileSecurityChecks = async (file: File, type: 'image' | 'pdf' | 'audio' | 'video'): Promise<void> => {
  if (!validateFileSize(file)) {
    throw new Error(`Security Alert: File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
  }

  if (scanForMalwarePatterns(file)) {
    throw new Error("Security Alert: Potential malware detected in filename.");
  }

  const isValidMagic = await validateMagicNumbers(file, type);
  if (!isValidMagic && type !== 'audio') { 
     if (type === 'video') {
        throw new Error(`Security Alert: Invalid video file format. Supported formats: MP4, MOV, WebM.`);
     }
     if (type === 'image' || type === 'pdf') {
        throw new Error(`Security Alert: File type mismatch. The file content does not match its extension.`);
     }
  }

  if (type === 'image') {
    const validDims = await validateImageDimensions(file);
    if (!validDims) {
      throw new Error("Security Alert: Image dimensions too large (Max 4096px). Possible pixel bomb.");
    }
  }
};
