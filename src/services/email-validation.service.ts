import formData from "form-data";
import Mailgun from "mailgun.js";

/**
 * Email Validation Service using Mailgun
 * Validates email addresses before sending to reduce bounces
 */

const mailgun = process.env.MAILGUN_VALIDATION_KEY
  ? new Mailgun(formData).client({
      username: "api",
      key: process.env.MAILGUN_VALIDATION_KEY,
      url:
        process.env.MAILGUN_REGION === "eu"
          ? "https://api.eu.mailgun.net"
          : "https://api.mailgun.net",
    })
  : null;

export interface EmailValidationResult {
  valid: boolean;
  email: string;
  reason?: string;
  risk?: "high" | "medium" | "low" | "unknown";
  didYouMean?: string;
  parts?: {
    localPart: string;
    domain: string;
    displayName?: string;
  };
}

export class EmailValidationService {
  /**
   * Validate a single email address
   */
  static async validateEmail(email: string): Promise<EmailValidationResult> {
    // Basic validation first (free, fast)
    const basicValidation = this.basicValidation(email);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    // Use Mailgun validation if available
    if (mailgun) {
      try {
        return await this.mailgunValidation(email);
      } catch (error) {
        console.error("Mailgun validation error:", error);
        // Fall back to basic validation
        return basicValidation;
      }
    }

    return basicValidation;
  }

  /**
   * Validate multiple email addresses
   */
  static async validateBulk(
    emails: string[],
  ): Promise<EmailValidationResult[]> {
    const promises = emails.map((email) => this.validateEmail(email));
    return Promise.all(promises);
  }

  /**
   * Basic email validation (free, fast, no API calls)
   */
  private static basicValidation(email: string): EmailValidationResult {
    // Trim whitespace
    email = email.trim().toLowerCase();

    // Check format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        email,
        reason: "Invalid email format",
        risk: "high",
      };
    }

    // Extract parts
    const [localPart, domain] = email.split("@");

    // Check for common typos in domains
    const commonDomains = {
      "gmail.com": ["gmai.com", "gmial.com", "gmil.com", "gmal.com"],
      "yahoo.com": ["yahooo.com", "yaho.com", "yahho.com"],
      "hotmail.com": ["hotmial.com", "hotmai.com", "hotmil.com"],
      "outlook.com": ["outlok.com", "outloo.com"],
    };

    let didYouMean: string | undefined;

    for (const [correct, typos] of Object.entries(commonDomains)) {
      if (typos.includes(domain)) {
        didYouMean = `${localPart}@${correct}`;
        return {
          valid: false,
          email,
          reason: "Possible typo in domain",
          didYouMean,
          risk: "medium",
          parts: { localPart, domain },
        };
      }
    }

    // Check for disposable/temporary email domains
    const disposableDomains = [
      "tempmail.com",
      "guerrillamail.com",
      "10minutemail.com",
      "mailinator.com",
      "throwaway.email",
      "temp-mail.org",
    ];

    if (disposableDomains.includes(domain)) {
      return {
        valid: false,
        email,
        reason: "Disposable/temporary email address",
        risk: "high",
        parts: { localPart, domain },
      };
    }

    // Basic validation passed
    return {
      valid: true,
      email,
      risk: "unknown",
      parts: { localPart, domain },
    };
  }

  /**
   * Advanced Mailgun validation (costs $0.004 per validation)
   */
  private static async mailgunValidation(
    email: string,
  ): Promise<EmailValidationResult> {
    if (!mailgun) {
      throw new Error("Mailgun validation not configured");
    }

    try {
      const result: any = await mailgun.validate.get(email);

      // Mailgun returns comprehensive validation data
      const risk =
        result.risk === "high"
          ? "high"
          : result.risk === "medium"
            ? "medium"
            : result.risk === "low"
              ? "low"
              : "unknown";

      return {
        valid: result.result === "deliverable",
        email: result.address,
        reason: result.reason || undefined,
        risk,
        didYouMean: result.did_you_mean || undefined,
        parts: result.parts
          ? {
              localPart: result.parts.local_part,
              domain: result.parts.domain,
              displayName: result.parts.display_name,
            }
          : undefined,
      };
    } catch (error: any) {
      console.error("Mailgun validation API error:", error);
      throw error;
    }
  }

  /**
   * Validate and clean a list of emails
   * Returns only valid emails
   */
  static async cleanList(emails: string[]): Promise<string[]> {
    const results = await this.validateBulk(emails);
    return results
      .filter((r) => r.valid && r.risk !== "high")
      .map((r) => r.email);
  }

  /**
   * Get validation statistics for a list
   */
  static async getListStats(emails: string[]): Promise<{
    total: number;
    valid: number;
    invalid: number;
    risky: number;
    disposable: number;
    typos: number;
  }> {
    const results = await this.validateBulk(emails);

    return {
      total: results.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
      risky: results.filter((r) => r.risk === "high" || r.risk === "medium")
        .length,
      disposable: results.filter((r) => r.reason?.includes("disposable"))
        .length,
      typos: results.filter((r) => r.didYouMean).length,
    };
  }
}
