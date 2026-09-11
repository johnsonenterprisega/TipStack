import { Platform } from 'react-native';

const OWNER_EMAIL = 'johnsonenterprisega@gmail.com';

export interface NewUserSignupPayload {
  email: string;
  username: string;
}

export const emailNotificationService = {
  /**
   * Generates the Rich HTML Branded Email body using the TipStack standard gradient template.
   */
  generateBrandedHtml(payload: NewUserSignupPayload): string {
    const formattedDate = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const platformName = Platform.OS === 'web' ? 'Web Browser (Safari/Chrome)' : `Mobile (${Platform.OS.toUpperCase()})`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background-color: #0D0F14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #F0F2F8; }
    .wrapper { width: 100%; background-color: #0D0F14; padding: 30px 0; }
    .container { max-width: 560px; margin: 0 auto; background-color: #161920; border-radius: 20px; overflow: hidden; border: 1px solid #272C3A; }
    .header { background: linear-gradient(135deg, #00C9A7 0%, #007BFF 50%, #FFD166 100%); padding: 32px 24px; text-align: center; }
    .title { font-size: 30px; font-weight: 900; color: #0D0F14; margin: 0; }
    .tagline { font-size: 12px; font-weight: 800; color: rgba(13, 15, 20, 0.85); margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; background-color: rgba(0, 201, 167, 0.15); border: 1px solid #00C9A7; color: #00C9A7; font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: 50px; text-transform: uppercase; margin-bottom: 14px; }
    .headline { font-size: 20px; font-weight: 800; color: #FFFFFF; margin: 0 0 10px 0; }
    .subtext { font-size: 14px; color: #8B91A7; line-height: 1.5; margin: 0 0 20px 0; }
    .card { background-color: #1E2230; border: 1px solid #272C3A; border-radius: 12px; padding: 18px; margin-bottom: 22px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .row:last-child { border-bottom: none; }
    .label { font-size: 12px; font-weight: 600; color: #8B91A7; }
    .val { font-size: 13px; font-weight: 700; color: #F0F2F8; }
    .btn { display: block; background: linear-gradient(135deg, #00C9A7 0%, #007BFF 100%); color: #FFFFFF; text-align: center; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none; margin-bottom: 20px; }
    .footer { border-top: 1px solid #272C3A; padding: 16px; text-align: center; background-color: #11141A; }
    .footer-text { font-size: 11px; color: #545B73; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="title">TipStack</h1>
        <div class="tagline">Earn it. Track it. Stack it.</div>
      </div>
      <div class="content">
        <div class="badge">🎉 New User Alert</div>
        <h2 class="headline">A new hustler just joined TipStack!</h2>
        <p class="subtext">A new user has registered an account and is ready to start tracking their tips.</p>
        <div class="card">
          <div class="row"><span class="label">User Name:</span><span class="val" style="color: #FFD166;">${payload.username || 'Hustler'}</span></div>
          <div class="row"><span class="label">Email Address:</span><span class="val" style="color: #00C9A7;">${payload.email}</span></div>
          <div class="row"><span class="label">Registered At:</span><span class="val">${formattedDate}</span></div>
          <div class="row"><span class="label">Platform:</span><span class="val">${platformName}</span></div>
        </div>
        <a href="https://supabase.com/dashboard/project/eosbtwubpzoogpvajyyk/auth/users" class="btn" target="_blank">
          View User in Supabase Dashboard →
        </a>
      </div>
      <div class="footer">
        <p class="footer-text">© 2026 Johnson Enterprise Tech, LLC. Automated notification to ${OWNER_EMAIL}</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();
  },

  /**
   * Sends the notification email to johnsonenterprisega@gmail.com asynchronously without blocking user registration.
   */
  async notifyOwnerNewSignup(payload: NewUserSignupPayload): Promise<void> {
    try {
      const richHtml = this.generateBrandedHtml(payload);
      const subject = `🎉 New TipStack Sign-Up: ${payload.username || 'New User'} (${payload.email})`;

      console.log(`[EmailNotification] Dispatching sign-up notification to ${OWNER_EMAIL} for ${payload.email}...`);

      // Send via FormSubmit AJAX endpoint (zero key dependency, guaranteed delivery to destination inbox)
      const res = await fetch(`https://formsubmit.co/ajax/${OWNER_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: subject,
          _template: 'box',
          'App Name': 'TipStack by Johnson Enterprise Tech',
          'New User Name': payload.username || 'Hustler',
          'User Email': payload.email,
          'Registration Date': new Date().toISOString(),
          'Platform': Platform.OS,
          'Account Tier': 'Free Hustler',
          'Dashboard Link': 'https://supabase.com/dashboard/project/eosbtwubpzoogpvajyyk/auth/users',
          message: `New TipStack User Registered!\nName: ${payload.username}\nEmail: ${payload.email}`,
          _html: richHtml,
        }),
      });

      if (res.ok) {
        console.log(`[EmailNotification] ✅ Successfully dispatched sign-up alert to ${OWNER_EMAIL}`);
      } else {
        const errText = await res.text();
        console.warn('[EmailNotification] Notification response not ok:', errText);
      }
    } catch (e) {
      console.warn('[EmailNotification] Failed to send owner email notification:', e);
    }
  },
};
