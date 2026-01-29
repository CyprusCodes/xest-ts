/**
 * Interface for Email Configuration
 */
export interface EmailConfig {
  fromEmail: string;
  replyToEmail: string;
}

const emailConfig: EmailConfig = {
  fromEmail: "name <your@email.com>",
  replyToEmail: "your@email.com"
};

export default emailConfig;
