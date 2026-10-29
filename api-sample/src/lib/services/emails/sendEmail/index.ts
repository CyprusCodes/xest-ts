/* eslint-disable no-console */
import hogan from "hogan.js";
import fs from "fs";
import mjml2html from "mjml";
import path from "path";
import Mailgun from "mailgun.js";
import formData from "form-data";
import emailConfig from "~root/constants/emailConstants";

const { fromEmail, replyToEmail } = emailConfig;

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "",
  url: process.env.MAILGUN_API_BASE_URL
});

interface Attachment {
  name: string;
  data: Buffer;
}

interface SendMailParams {
  to: string | string[];
  bcc?: string | string[] | null;
  template: string;
  version: string;
  metadata: Record<string, any>;
  attachment?: Attachment | null;
}

/**
 * Sends an email using Mailgun, MJML, and Hogan templates.
 */
const sendMail = async ({
  to,
  bcc = null,
  template,
  version,
  metadata,
  attachment = null
}: SendMailParams): Promise<any> => {
  const metadataEnriched = {
    replyTo: replyToEmail,
    ...metadata
  };

  try {
    // Helper to read and render hogan templates
    const renderTemplate = (ext: string) => {
      const filePath = path.join(
        __dirname,
        `./templates/${template}/${version}.${ext}`
      );
      const content = fs.readFileSync(filePath, "utf8");
      return hogan.compile(content).render(metadataEnriched);
    };

    const textBody = renderTemplate("txt");
    const subjectLine = renderTemplate("subject");

    // MJML requires a slightly different flow
    const mjmlRaw = fs.readFileSync(
      path.join(__dirname, `./templates/${template}/${version}.mjml`),
      "utf8"
    );
    const { html: mjmlParsed } = mjml2html(mjmlRaw);
    const emailBody = hogan.compile(mjmlParsed).render(metadataEnriched);

    const domain = process.env.MAILGUN_DOMAIN;
    if (!domain) throw new Error("MAILGUN_DOMAIN is missing");

    const messageParams = {
      from: fromEmail,
      to,
      bcc: bcc || undefined,
      subject: subjectLine,
      text: textBody,
      html: emailBody,
      "h:Reply-To": replyToEmail,
      attachment: attachment
        ? [
            {
              data: attachment.data,
              filename: attachment.name
            }
          ]
        : undefined
    };

    return await mg.messages.create(domain, messageParams);
  } catch (error) {
    console.error("Email delivery failed:", error);
    return false;
  }
};

export default sendMail;
