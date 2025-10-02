import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div data-testid="page-privacy" className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 data-testid="heading-privacy-policy" className="text-4xl font-bold mb-4">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-8">
          Last updated: October 2, 2025
        </p>

        <div className="space-y-6">
          <Card data-testid="section-data-collection">
            <CardHeader>
              <CardTitle className="text-2xl">1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Information</h3>
                <p className="text-muted-foreground">
                  When you create an account on 88Away, we collect your email address, username, 
                  and authentication credentials. This information is necessary to provide you with 
                  access to our collaborative writing platform.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Content Data</h3>
                <p className="text-muted-foreground">
                  We store all content you create on our platform, including your writing projects, 
                  characters, worldbuilding notes, timelines, and any other data you input into our 
                  system. This data is essential for providing our core services.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Interaction Data</h3>
                <p className="text-muted-foreground">
                  When you use our AI-powered writing assistant features (Muse, Editor, and Coach personas), 
                  we process your content and prompts to generate AI responses. This may include the text 
                  you're working on and your instructions to the AI.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Usage Information</h3>
                <p className="text-muted-foreground">
                  We collect information about how you use 88Away, including pages visited, features used, 
                  collaboration activities, and analytics data to improve our services and user experience.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
                <p className="text-muted-foreground">
                  If you subscribe to a paid plan, our payment processor (Stripe) collects and processes 
                  your payment information. We do not store complete credit card numbers on our servers.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-how-we-use-information">
            <CardHeader>
              <CardTitle className="text-2xl">2. How We Use Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To provide, maintain, and improve our collaborative writing platform services</li>
                <li>To enable AI-powered writing assistance through OpenAI's language models</li>
                <li>To facilitate team collaboration features and real-time document editing</li>
                <li>To process payments and manage your subscription through Stripe</li>
                <li>To send you service-related notifications and important updates</li>
                <li>To analyze usage patterns and enhance user experience</li>
                <li>To prevent fraud, abuse, and ensure platform security</li>
                <li>To comply with legal obligations and enforce our terms of service</li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="section-data-storage-security">
            <CardHeader>
              <CardTitle className="text-2xl">3. Data Storage and Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Storage Infrastructure</h3>
                <p className="text-muted-foreground">
                  Your data is stored securely using Neon Database, a serverless PostgreSQL platform 
                  with enterprise-grade security and reliability. All data is encrypted at rest and 
                  in transit using industry-standard encryption protocols.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Security Measures</h3>
                <p className="text-muted-foreground">
                  We implement multiple layers of security including encrypted connections, secure 
                  authentication, role-based access controls, and regular security audits. Our platform 
                  is designed with security best practices to protect your creative work.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Backup</h3>
                <p className="text-muted-foreground">
                  We maintain regular backups of your data to prevent loss. Our version control system 
                  also preserves document history, allowing you to recover previous versions of your work.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Access Controls</h3>
                <p className="text-muted-foreground">
                  Access to user data is strictly limited to authorized personnel who need it to provide 
                  support or maintain our services. All access is logged and monitored.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-third-party-services">
            <CardHeader>
              <CardTitle className="text-2xl">4. Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                88Away integrates with the following third-party services to provide our features:
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">OpenAI</h3>
                <p className="text-muted-foreground">
                  We use OpenAI's API to power our AI writing assistant features. When you use AI features, 
                  your content may be processed by OpenAI's services according to their data usage policies. 
                  OpenAI does not use data submitted via their API to train their models.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Stripe</h3>
                <p className="text-muted-foreground">
                  Stripe processes all payment transactions for paid subscriptions. Your payment information 
                  is handled directly by Stripe and is subject to their privacy policy. We receive only 
                  limited payment information necessary for subscription management.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Neon Database</h3>
                <p className="text-muted-foreground">
                  We use Neon Database as our primary data storage provider. Neon provides enterprise-grade 
                  security, encryption, and compliance certifications to protect your data.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Third-Party Links</h3>
                <p className="text-muted-foreground">
                  Our service may contain links to third-party websites or services. We are not responsible 
                  for the privacy practices of these external sites.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-cookies-tracking">
            <CardHeader>
              <CardTitle className="text-2xl">5. Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Essential Cookies</h3>
                <p className="text-muted-foreground">
                  We use essential cookies to maintain your session, remember your preferences, and 
                  provide core functionality. These cookies are necessary for the platform to work properly.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                <p className="text-muted-foreground">
                  We collect anonymized usage data to understand how our platform is used and to improve 
                  our services. This includes page views, feature usage, and performance metrics.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Choices</h3>
                <p className="text-muted-foreground">
                  Most browsers allow you to control cookies through their settings. However, disabling 
                  essential cookies may limit your ability to use certain features of our platform.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-user-rights">
            <CardHeader>
              <CardTitle className="text-2xl">6. Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You have the following rights regarding your personal data:
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Access and Portability</h3>
                <p className="text-muted-foreground">
                  You can access, download, and export your data at any time through our platform. 
                  We provide multiple export formats including JSON, PDF, and ePub depending on your 
                  subscription plan.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Correction and Update</h3>
                <p className="text-muted-foreground">
                  You can modify your account information and content at any time through your account 
                  settings and project management tools.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Deletion</h3>
                <p className="text-muted-foreground">
                  You have the right to request deletion of your account and associated data. Contact 
                  us at privacy@88away.com to initiate an account deletion request. Please note that 
                  we may retain certain information as required by law or for legitimate business purposes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Processing Objection</h3>
                <p className="text-muted-foreground">
                  You can opt out of certain data processing activities, such as marketing communications 
                  or optional analytics. However, some processing is necessary to provide our core services.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">GDPR Rights</h3>
                <p className="text-muted-foreground">
                  If you are in the European Economic Area (EEA), you have additional rights under the 
                  General Data Protection Regulation (GDPR), including the right to lodge a complaint 
                  with a supervisory authority.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-childrens-privacy">
            <CardHeader>
              <CardTitle className="text-2xl">7. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                88Away is not intended for children under the age of 13. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe 
                your child has provided us with personal information, please contact us at 
                privacy@88away.com, and we will delete such information from our systems.
              </p>
              <p className="text-muted-foreground">
                For users between 13 and 18 years of age, we recommend parental guidance when using 
                our platform, particularly when using AI-powered features.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-policy-changes">
            <CardHeader>
              <CardTitle className="text-2xl">8. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                technology, legal requirements, or other factors. When we make significant changes, we 
                will notify you by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Posting the updated policy on this page with a new "Last updated" date</li>
                <li>Sending an email notification to your registered email address</li>
                <li>Displaying a prominent notice on our platform</li>
              </ul>
              <p className="text-muted-foreground">
                Your continued use of 88Away after any changes to this Privacy Policy constitutes your 
                acceptance of the updated terms. We encourage you to review this policy periodically.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-contact">
            <CardHeader>
              <CardTitle className="text-2xl">9. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our 
                data practices, please contact us:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="font-semibold">88Away Privacy Team</p>
                <p className="text-muted-foreground">Email: privacy@88away.com</p>
                <p className="text-muted-foreground">Support: support@88away.com</p>
              </div>
              <p className="text-muted-foreground">
                We will respond to all legitimate requests within 30 days. For urgent privacy concerns, 
                please mark your email as "Urgent Privacy Matter" in the subject line.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            This Privacy Policy is effective as of October 2, 2025. By using 88Away, you acknowledge 
            that you have read and understood this Privacy Policy and agree to its terms.
          </p>
        </div>
      </div>
    </div>
  );
}
