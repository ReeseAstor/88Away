import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/seo";

export default function CookiesPage() {
  const envBase =
    (import.meta.env as { VITE_SITE_URL?: string })?.VITE_SITE_URL ??
    "https://88away.com";
  const siteUrl = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;

  return (
    <>
      <Seo
        title="Cookie Policy"
        description="Understand how 88Away uses cookies to support authentication, personalization, analytics, and secure collaboration experiences."
        noindex
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CookiePolicy",
          name: "88Away Cookie Policy",
          url: `${siteUrl}/cookies`,
          inLanguage: "en-US",
          publisher: {
            "@type": "Organization",
            name: "88Away",
            url: siteUrl,
          },
          dateModified: "2025-10-02",
        }}
      />
      <div data-testid="page-cookies" className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 data-testid="heading-cookie-policy" className="text-4xl font-bold mb-4">
          Cookie Policy
        </h1>
        <p className="text-muted-foreground mb-8">
          Last updated: October 2, 2025
        </p>

        <div className="space-y-6">
          <Card data-testid="section-what-are-cookies">
            <CardHeader>
              <CardTitle className="text-2xl">1. What Are Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cookies are small text files that are placed on your device (computer, tablet, or mobile) 
                when you visit a website. They are widely used to make websites work more efficiently and 
                provide a better user experience by remembering your preferences and previous actions.
              </p>
              <p className="text-muted-foreground">
                Cookies help us recognize you when you return to 88Away, remember your settings and 
                preferences, and provide essential functionality like keeping you logged in. They contain 
                information that is transferred to your device's hard drive and stored by your web browser.
              </p>
              <p className="text-muted-foreground">
                Most web browsers automatically accept cookies, but you can modify your browser settings 
                to decline cookies if you prefer. However, disabling cookies may prevent you from using 
                certain features of our platform.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-how-we-use-cookies">
            <CardHeader>
              <CardTitle className="text-2xl">2. How We Use Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                88Away uses cookies to enhance your experience and provide essential functionality. 
                We use cookies for the following purposes:
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Session Management</h3>
                <p className="text-muted-foreground">
                  Cookies help us manage your session on our platform, keeping you logged in as you 
                  navigate between pages and ensuring your collaborative editing sessions remain active 
                  without interruption.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication</h3>
                <p className="text-muted-foreground">
                  We use secure session cookies to verify your identity and maintain your authenticated 
                  state. This ensures that your writing projects and personal data remain secure and 
                  accessible only to you.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">User Preferences</h3>
                <p className="text-muted-foreground">
                  Cookies store your personal preferences such as theme settings (light or dark mode), 
                  language preferences, editor settings, and other customization options to provide a 
                  personalized experience each time you visit.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Platform Functionality</h3>
                <p className="text-muted-foreground">
                  Essential cookies enable core features like real-time collaboration, document auto-save, 
                  version control, and other critical platform functionality that makes 88Away work properly.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-cookie-types">
            <CardHeader>
              <CardTitle className="text-2xl">3. Types of Cookies We Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                We use different types of cookies for different purposes. Below is a detailed breakdown 
                of the cookies used on 88Away:
              </p>

              <div>
                <h3 className="text-lg font-semibold mb-3">Essential Cookies</h3>
                <p className="text-muted-foreground mb-4">
                  These cookies are necessary for the website to function properly. They enable core 
                  functionality such as security, authentication, and session management. The website 
                  cannot function properly without these cookies.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Functional Cookies</h3>
                <p className="text-muted-foreground mb-4">
                  These cookies allow the website to remember choices you make (such as your username, 
                  language, or theme preference) and provide enhanced, personalized features.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Analytics Cookies</h3>
                <p className="text-muted-foreground mb-4">
                  These cookies help us understand how visitors interact with our platform by collecting 
                  and reporting information anonymously. This helps us improve our services and user experience.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Cookie Details</h3>
                <div className="rounded-md border">
                  <Table data-testid="table-cookies">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Cookie Name</TableHead>
                        <TableHead className="font-semibold">Purpose</TableHead>
                        <TableHead className="font-semibold">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-sm">connect.sid</TableCell>
                        <TableCell className="text-muted-foreground">
                          Session authentication cookie that keeps you logged in and maintains 
                          your authenticated state across the platform
                        </TableCell>
                        <TableCell className="text-muted-foreground">Session (expires when browser closes)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">theme_preference</TableCell>
                        <TableCell className="text-muted-foreground">
                          Stores your theme preference (light or dark mode) to provide a 
                          consistent visual experience
                        </TableCell>
                        <TableCell className="text-muted-foreground">1 year</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">editor_settings</TableCell>
                        <TableCell className="text-muted-foreground">
                          Remembers your editor preferences such as font size, line spacing, 
                          and formatting toolbar configuration
                        </TableCell>
                        <TableCell className="text-muted-foreground">6 months</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">user_preferences</TableCell>
                        <TableCell className="text-muted-foreground">
                          Stores various user preferences including language, notification 
                          settings, and dashboard layout
                        </TableCell>
                        <TableCell className="text-muted-foreground">1 year</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">analytics_id</TableCell>
                        <TableCell className="text-muted-foreground">
                          Anonymous identifier used to track usage patterns and analyze platform 
                          performance to improve user experience
                        </TableCell>
                        <TableCell className="text-muted-foreground">2 years</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-third-party-cookies">
            <CardHeader>
              <CardTitle className="text-2xl">4. Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                In addition to our own cookies, we may use third-party cookies from trusted partners 
                to provide enhanced functionality and services:
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Stripe Payment Cookies</h3>
                <p className="text-muted-foreground">
                  When you make a payment or manage your subscription, Stripe (our payment processor) 
                  may set cookies to process transactions securely, prevent fraud, and remember your 
                  payment information for future purchases. These cookies are subject to Stripe's privacy 
                  policy and cookie policy.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Service Integration Cookies</h3>
                <p className="text-muted-foreground">
                  We integrate with third-party services like OpenAI for AI writing assistance. These 
                  services may use cookies when you interact with their features. We do not control 
                  these third-party cookies, and they are subject to the respective third party's 
                  privacy and cookie policies.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Third-Party Responsibility</h3>
                <p className="text-muted-foreground">
                  We are not responsible for the cookies set by third-party services. We encourage you 
                  to review the cookie policies of any third-party services you interact with through 
                  our platform. Links to third-party cookie policies are available in our Privacy Policy.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-managing-cookies">
            <CardHeader>
              <CardTitle className="text-2xl">5. Managing Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You have the right to decide whether to accept or reject cookies. You can manage your 
                cookie preferences through your browser settings or by using our cookie preference tools.
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Browser Settings</h3>
                <p className="text-muted-foreground mb-3">
                  Most web browsers allow you to control cookies through their settings. You can set 
                  your browser to refuse all cookies or to indicate when a cookie is being sent. Here's 
                  how to manage cookies in popular browsers:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                  <li><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                  <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Impact of Disabling Cookies</h3>
                <p className="text-muted-foreground">
                  Please note that if you disable or refuse cookies, some features of 88Away may not 
                  function properly. Essential cookies are required for authentication and core platform 
                  functionality. Disabling these cookies will prevent you from logging in and using the 
                  platform effectively.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Deleting Cookies</h3>
                <p className="text-muted-foreground">
                  You can delete cookies that have already been set through your browser settings. 
                  However, deleting cookies may result in the loss of saved preferences and require you 
                  to log in again. Your browser's help section will provide specific instructions on 
                  how to delete cookies.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Mobile Devices</h3>
                <p className="text-muted-foreground">
                  For mobile devices, cookie management is typically handled through your device's 
                  browser settings. Consult your mobile browser's help documentation for specific 
                  instructions on managing cookies on mobile devices.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-cookie-duration">
            <CardHeader>
              <CardTitle className="text-2xl">6. Cookie Duration and Expiry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cookies have different lifespans depending on their purpose. We use both session cookies 
                and persistent cookies:
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Session Cookies</h3>
                <p className="text-muted-foreground">
                  Session cookies are temporary and are deleted when you close your browser. These cookies 
                  are essential for maintaining your login session and ensuring secure authentication. Our 
                  main session cookie (connect.sid) is a session cookie that expires when you close your 
                  browser or log out.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Persistent Cookies</h3>
                <p className="text-muted-foreground">
                  Persistent cookies remain on your device for a set period or until you delete them. 
                  These cookies remember your preferences and settings across multiple visits. Our 
                  persistent cookies have expiry periods ranging from 6 months to 2 years, depending 
                  on their purpose.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Automatic Expiry</h3>
                <p className="text-muted-foreground">
                  All cookies automatically expire after their designated duration. When a cookie expires, 
                  it is automatically deleted from your device. You may need to reset your preferences 
                  or log in again after cookie expiry.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Cookie Renewal</h3>
                <p className="text-muted-foreground">
                  Some cookies may be renewed or extended each time you visit our platform. This ensures 
                  that your preferences and settings are maintained as long as you continue to use 88Away 
                  regularly.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-policy-changes">
            <CardHeader>
              <CardTitle className="text-2xl">7. Changes to Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time to reflect changes in our cookie 
                usage, technology, legal requirements, or other operational needs. When we make 
                significant changes, we will notify you in the following ways:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Updating the "Last updated" date at the top of this Cookie Policy</li>
                <li>Posting a notice on our platform about the changes</li>
                <li>Sending an email notification to your registered email address for significant changes</li>
                <li>Displaying a prominent banner or popup notification when you visit the platform</li>
              </ul>
              <p className="text-muted-foreground">
                We encourage you to review this Cookie Policy periodically to stay informed about how 
                we use cookies and how they help improve your experience on 88Away. Your continued use 
                of our platform after any changes to this Cookie Policy constitutes your acceptance of 
                the updated terms.
              </p>
              <p className="text-muted-foreground">
                If you do not agree with any changes to this Cookie Policy, you may adjust your cookie 
                preferences through your browser settings or discontinue use of our platform.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-contact-information">
            <CardHeader>
              <CardTitle className="text-2xl">8. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions, concerns, or requests regarding this Cookie Policy or our 
                use of cookies, please don't hesitate to contact us. We're here to help you understand 
                how we use cookies and address any privacy concerns you may have.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="font-semibold">88Away Privacy Team</p>
                <p className="text-muted-foreground">Email: privacy@88away.com</p>
                <p className="text-muted-foreground">Support: support@88away.com</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Resources</h3>
                <p className="text-muted-foreground">
                  For more information about how we handle your data and protect your privacy, please 
                  review our{" "}
                  <Link href="/privacy">
                    <a className="text-primary hover:underline" data-testid="link-privacy-policy">
                      Privacy Policy
                    </a>
                  </Link>
                  . For questions about our terms of service, please see our{" "}
                  <Link href="/terms">
                    <a className="text-primary hover:underline" data-testid="link-terms">
                      Terms and Conditions
                    </a>
                  </Link>
                  .
                </p>
              </div>
              <p className="text-muted-foreground">
                We will respond to all legitimate inquiries within 30 days. For urgent cookie or 
                privacy matters, please mark your email as "Urgent Privacy Matter" in the subject line.
              </p>
            </CardContent>
          </Card>
        </div>

          <div className="mt-12 p-6 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              This Cookie Policy is effective as of October 2, 2025. By using 88Away, you acknowledge 
              that you have read and understood this Cookie Policy and consent to our use of cookies 
              as described herein.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
