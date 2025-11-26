/**
 * Gift Email Templates
 * Email templates for gift code notifications, receipts, and confirmations
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string; // Plain text fallback
}

export interface GiftReceivedEmailParams {
  recipientName: string;
  senderName: string;
  giftCode: string;
  subscriptionTier: string;
  giftMessage?: string;
  expiresAt: Date;
  redeemUrl: string;
}

export interface GiftReceiptEmailParams {
  purchaserName: string;
  recipientEmail: string;
  giftCode: string;
  subscriptionTier: string;
  price: string;
  currency: string;
  giftDurationMonths: number | null;
  purchaseDate: Date;
  redeemUrl: string;
}

export interface GiftRedemptionConfirmationEmailParams {
  recipientName: string;
  subscriptionTier: string;
  expiresAt: Date;
  activatedDate: Date;
  features: string[];
}

/**
 * Email template: Gift received notification
 * Sent to the recipient when a gift code is purchased for them
 */
export function giftReceivedTemplate(params: GiftReceivedEmailParams): EmailTemplate {
  const expiryDate = params.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9fafb;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
        border-radius: 8px;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        background-color: white;
        padding: 40px 30px;
        margin-top: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .gift-section {
        background-color: #f0f4ff;
        border-left: 4px solid #667eea;
        padding: 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .code-box {
        background-color: #667eea;
        color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        margin: 20px 0;
        font-size: 20px;
        font-weight: bold;
        letter-spacing: 2px;
        font-family: 'Courier New', monospace;
      }
      .button {
        display: inline-block;
        background-color: #667eea;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
      }
      .button:hover {
        background-color: #5568d3;
      }
      .features {
        background-color: #f9fafb;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .features h3 {
        margin-top: 0;
      }
      .features ul {
        margin: 0;
        padding-left: 20px;
      }
      .features li {
        margin: 8px 0;
      }
      .footer {
        text-align: center;
        color: #666;
        font-size: 12px;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
      .expiry-warning {
        background-color: #fffbea;
        border-left: 4px solid #f59e0b;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
        color: #92400e;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎁 You've Received a Gift!</h1>
      </div>

      <div class="content">
        <p>Hi ${params.recipientName},</p>

        <p>${params.senderName} just gifted you a <strong>${params.subscriptionTier}</strong> subscription to Reading Daily!</p>

        ${params.giftMessage ? `
          <div class="gift-section">
            <p><strong>Message from ${params.senderName}:</strong></p>
            <p style="font-style: italic;">${params.giftMessage}</p>
          </div>
        ` : ''}

        <p>Your gift code is ready to redeem:</p>
        <div class="code-box">${params.giftCode}</div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.redeemUrl}" class="button">Redeem Your Gift</a>
        </div>

        <div class="features">
          <h3>What you'll get:</h3>
          <ul>
            <li>✓ Access to all Scripture readings</li>
            <li>✓ Advanced pronunciation practice</li>
            <li>✓ Offline reading mode</li>
            <li>✓ Ad-free experience</li>
            <li>✓ And more premium features</li>
          </ul>
        </div>

        <div class="expiry-warning">
          <strong>⚠️ Code expires on ${expiryDate}</strong><br>
          Make sure to redeem your gift before the expiration date to activate your subscription.
        </div>

        <p>Simply click the button above or enter the code in the app to activate your subscription immediately.</p>

        <p>If you have any questions, feel free to contact us at support@readingdaily.app</p>

        <p>Happy reading!<br>
        The Reading Daily Team</p>
      </div>

      <div class="footer">
        <p>This is a transactional email. Please do not reply to this message.</p>
        <p>&copy; 2024 Reading Daily. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

  const text = `
You've Received a Gift!

Hi ${params.recipientName},

${params.senderName} just gifted you a ${params.subscriptionTier} subscription to Reading Daily!

${params.giftMessage ? `Message from ${params.senderName}: "${params.giftMessage}"` : ''}

Your gift code is: ${params.giftCode}

Redeem your gift: ${params.redeemUrl}

What you'll get:
✓ Access to all Scripture readings
✓ Advanced pronunciation practice
✓ Offline reading mode
✓ Ad-free experience
✓ And more premium features

Code expires on ${expiryDate}

If you have any questions, contact us at support@readingdaily.app

Happy reading!
The Reading Daily Team
`;

  return {
    subject: `🎁 ${params.senderName} sent you a gift subscription!`,
    html,
    text,
  };
}

/**
 * Email template: Purchase receipt for gift sender
 * Sent to the purchaser confirming their gift purchase
 */
export function giftReceiptTemplate(params: GiftReceiptEmailParams): EmailTemplate {
  const purchaseDate = params.purchaseDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const durationText =
    params.giftDurationMonths === null
      ? 'Lifetime'
      : `${params.giftDurationMonths} month${params.giftDurationMonths !== 1 ? 's' : ''}`;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9fafb;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
        border-radius: 8px;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        background-color: white;
        padding: 40px 30px;
        margin-top: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .receipt-item {
        display: flex;
        justify-content: space-between;
        padding: 15px 0;
        border-bottom: 1px solid #eee;
      }
      .receipt-item:last-child {
        border-bottom: 2px solid #667eea;
        padding-top: 20px;
        font-weight: bold;
        font-size: 18px;
      }
      .code-box {
        background-color: #667eea;
        color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        margin: 20px 0;
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 2px;
        font-family: 'Courier New', monospace;
      }
      .status-badge {
        display: inline-block;
        background-color: #10b981;
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        color: #666;
        font-size: 12px;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✓ Gift Purchase Confirmed</h1>
      </div>

      <div class="content">
        <p>Hi ${params.purchaserName},</p>

        <p>Thank you for your gift purchase! Your payment has been received and your gift is ready to share.</p>

        <div class="status-badge">GIFT READY TO SEND</div>

        <h3>Receipt Details</h3>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
          <div class="receipt-item">
            <span>Recipient Email:</span>
            <span>${params.recipientEmail}</span>
          </div>
          <div class="receipt-item">
            <span>Subscription Tier:</span>
            <span>${params.subscriptionTier}</span>
          </div>
          <div class="receipt-item">
            <span>Duration:</span>
            <span>${durationText}</span>
          </div>
          <div class="receipt-item">
            <span>Purchase Date:</span>
            <span>${purchaseDate}</span>
          </div>
          <div class="receipt-item">
            <span>Amount:</span>
            <span>${params.currency}${params.price}</span>
          </div>
        </div>

        <h3>Gift Code</h3>
        <p>Share this code with your recipient:</p>
        <div class="code-box">${params.giftCode}</div>

        <h3>Next Steps</h3>
        <ol>
          <li>Share the gift code with ${params.recipientEmail}</li>
          <li>They can redeem it immediately in the Reading Daily app</li>
          <li>Their subscription will be activated instantly</li>
        </ol>

        <p>The recipient can redeem their gift by visiting this link: <a href="${params.redeemUrl}">${params.redeemUrl}</a></p>

        <p>If you need to send this gift again or have any questions, please contact us at support@readingdaily.app</p>

        <p>Thank you for supporting Reading Daily!<br>
        The Reading Daily Team</p>
      </div>

      <div class="footer">
        <p>This is a transactional email. Please do not reply to this message.</p>
        <p>&copy; 2024 Reading Daily. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

  const text = `
Gift Purchase Confirmed

Hi ${params.purchaserName},

Thank you for your gift purchase! Your payment has been received and your gift is ready to share.

GIFT READY TO SEND

Receipt Details:
- Recipient Email: ${params.recipientEmail}
- Subscription Tier: ${params.subscriptionTier}
- Duration: ${durationText}
- Purchase Date: ${purchaseDate}
- Amount: ${params.currency}${params.price}

Gift Code: ${params.giftCode}

Next Steps:
1. Share the gift code with ${params.recipientEmail}
2. They can redeem it immediately in the Reading Daily app
3. Their subscription will be activated instantly

The recipient can redeem their gift here: ${params.redeemUrl}

If you need to send this gift again or have any questions, contact us at support@readingdaily.app

Thank you for supporting Reading Daily!
The Reading Daily Team
`;

  return {
    subject: `Gift Purchase Receipt - ${params.subscriptionTier} Subscription`,
    html,
    text,
  };
}

/**
 * Email template: Redemption confirmation
 * Sent to the recipient after successfully redeeming a gift code
 */
export function giftRedemptionConfirmationTemplate(
  params: GiftRedemptionConfirmationEmailParams
): EmailTemplate {
  const expiryDate = params.expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const activationDate = params.activatedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const featuresList = params.features.map((feature) => `<li>✓ ${feature}</li>`).join('');

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9fafb;
      }
      .header {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
        border-radius: 8px;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        background-color: white;
        padding: 40px 30px;
        margin-top: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .success-badge {
        display: inline-block;
        background-color: #10b981;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        margin: 20px 0;
      }
      .subscription-details {
        background-color: #f0fdf4;
        border-left: 4px solid #10b981;
        padding: 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .subscription-details h3 {
        margin-top: 0;
      }
      .detail-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
      }
      .features {
        background-color: #f9fafb;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .features h3 {
        margin-top: 0;
      }
      .features ul {
        margin: 0;
        padding-left: 20px;
      }
      .features li {
        margin: 8px 0;
      }
      .button {
        display: inline-block;
        background-color: #10b981;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
      }
      .button:hover {
        background-color: #059669;
      }
      .footer {
        text-align: center;
        color: #666;
        font-size: 12px;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✓ Your Subscription is Active!</h1>
      </div>

      <div class="content">
        <p>Hi ${params.recipientName},</p>

        <p>Congratulations! Your gift subscription has been successfully redeemed and is now active.</p>

        <div class="success-badge">SUBSCRIPTION ACTIVATED</div>

        <div class="subscription-details">
          <h3>Subscription Details</h3>
          <div class="detail-item">
            <span>Tier:</span>
            <strong>${params.subscriptionTier}</strong>
          </div>
          <div class="detail-item">
            <span>Activated:</span>
            <strong>${activationDate}</strong>
          </div>
          <div class="detail-item">
            <span>Expires:</span>
            <strong>${expiryDate}</strong>
          </div>
        </div>

        <div class="features">
          <h3>Your Premium Access Includes:</h3>
          <ul>
            ${featuresList}
          </ul>
        </div>

        <p>You can now enjoy all the benefits of your ${params.subscriptionTier} subscription. Log in to the Reading Daily app to start exploring premium content!</p>

        <div style="text-align: center;">
          <a href="readingdaily://open-app" class="button">Open Reading Daily App</a>
        </div>

        <h3>Getting Started Tips</h3>
        <ul>
          <li><strong>Explore Readings:</strong> Browse the full collection of Scripture readings available to premium members</li>
          <li><strong>Practice Pronunciation:</strong> Use the advanced pronunciation tools to perfect your reading</li>
          <li><strong>Enable Offline Mode:</strong> Download content to read even without an internet connection</li>
          <li><strong>Customize Settings:</strong> Adjust your preferences to personalize your experience</li>
        </ul>

        <p>If you have any questions or need help, our support team is here: support@readingdaily.app</p>

        <p>Enjoy your premium experience!<br>
        The Reading Daily Team</p>
      </div>

      <div class="footer">
        <p>This is a transactional email. Please do not reply to this message.</p>
        <p>&copy; 2024 Reading Daily. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

  const text = `
Your Subscription is Active!

Hi ${params.recipientName},

Congratulations! Your gift subscription has been successfully redeemed and is now active.

SUBSCRIPTION ACTIVATED

Subscription Details:
- Tier: ${params.subscriptionTier}
- Activated: ${activationDate}
- Expires: ${expiryDate}

Your Premium Access Includes:
${params.features.map((f) => `✓ ${f}`).join('\n')}

You can now enjoy all the benefits of your ${params.subscriptionTier} subscription. Log in to the Reading Daily app to start exploring!

Getting Started Tips:
- Explore Readings: Browse the full collection available to premium members
- Practice Pronunciation: Use the advanced pronunciation tools
- Enable Offline Mode: Download content to read offline
- Customize Settings: Adjust preferences to personalize your experience

If you have any questions or need help, contact us at support@readingdaily.app

Enjoy your premium experience!
The Reading Daily Team
`;

  return {
    subject: `🎉 Welcome to ${params.subscriptionTier} - Your subscription is active!`,
    html,
    text,
  };
}

/**
 * Export all templates as a convenient object
 */
export const GiftEmailTemplates = {
  giftReceived: giftReceivedTemplate,
  giftReceipt: giftReceiptTemplate,
  giftRedemptionConfirmation: giftRedemptionConfirmationTemplate,
};
