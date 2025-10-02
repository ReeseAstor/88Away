import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div data-testid="page-terms" className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 data-testid="heading-terms-conditions" className="text-4xl font-bold mb-4">
          Terms and Conditions
        </h1>
        <p className="text-muted-foreground mb-8">
          Last updated: October 2, 2025
        </p>

        <div className="space-y-6">
          <Card data-testid="section-acceptance">
            <CardHeader>
              <CardTitle className="text-2xl">1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Welcome to 88Away. By accessing or using our collaborative writing platform and services 
                (collectively, the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). 
                If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p className="text-muted-foreground">
                These Terms constitute a legally binding agreement between you and 88Away. Your use of the 
                Service is also governed by our Privacy Policy, which is incorporated into these Terms by 
                reference. By creating an account or using the Service, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms and our Privacy Policy.
              </p>
              <p className="text-muted-foreground">
                You must be at least 13 years old to use the Service. If you are between 13 and 18 years of 
                age, you represent that you have your parent's or legal guardian's permission to use the Service 
                and that they have reviewed and agreed to these Terms on your behalf.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-service-description">
            <CardHeader>
              <CardTitle className="text-2xl">2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                88Away is a collaborative writing platform designed to help writers create, organize, and 
                develop their creative projects. Our Service provides the following key features:
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Collaborative Writing Tools</h3>
                <p className="text-muted-foreground">
                  Real-time document editing and collaboration features that allow multiple users to work 
                  together on writing projects. Our platform includes version control, branching, merging, 
                  and conflict resolution tools to manage collaborative workflows effectively.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Writing Assistance</h3>
                <p className="text-muted-foreground">
                  AI-powered writing assistant features with three distinct personas: Muse (creative 
                  brainstorming), Editor (technical editing), and Coach (structural guidance). These AI 
                  features are powered by OpenAI's language models and are designed to enhance your creative 
                  process.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Project Management</h3>
                <p className="text-muted-foreground">
                  Comprehensive tools for organizing your writing projects, including character management, 
                  worldbuilding databases, timeline visualization, analytics dashboards, and commenting systems.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Export and Publishing</h3>
                <p className="text-muted-foreground">
                  The ability to export your work in multiple formats including PDF, ePub, DOCX, and JSON, 
                  with export capabilities varying based on your subscription tier.
                </p>
              </div>
              <p className="text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, 
                with or without notice. We will make reasonable efforts to notify users of significant changes 
                to core features.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-accounts">
            <CardHeader>
              <CardTitle className="text-2xl">3. User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Creation</h3>
                <p className="text-muted-foreground">
                  To access certain features of the Service, you must create an account. You agree to provide 
                  accurate, current, and complete information during registration and to update your information 
                  to keep it accurate and current.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Security</h3>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account credentials and for 
                  all activities that occur under your account. You agree to immediately notify us of any 
                  unauthorized access or use of your account. We cannot and will not be liable for any loss 
                  or damage arising from your failure to maintain account security.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Responsibility</h3>
                <p className="text-muted-foreground">
                  You are solely responsible for your account activity and all content created, shared, or 
                  stored through your account. You may not share your account credentials with others or allow 
                  others to access your account except through authorized collaboration features.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Multiple Accounts</h3>
                <p className="text-muted-foreground">
                  You may not create multiple accounts for the purpose of circumventing subscription limits, 
                  evading suspension or termination, or otherwise violating these Terms.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-payment">
            <CardHeader>
              <CardTitle className="text-2xl">4. Subscription and Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Subscription Plans</h3>
                <p className="text-muted-foreground">
                  88Away offers multiple subscription tiers with varying features, storage limits, AI usage 
                  quotas, and export capabilities. Subscription details, pricing, and features are available 
                  on our pricing page and may be modified from time to time with notice to existing subscribers.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Payment Processing</h3>
                <p className="text-muted-foreground">
                  All payments are processed securely through Stripe, our third-party payment processor. 
                  By subscribing to a paid plan, you authorize us to charge your payment method on a recurring 
                  basis according to your selected billing cycle (monthly or annual).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Billing and Renewals</h3>
                <p className="text-muted-foreground">
                  Subscriptions automatically renew at the end of each billing period unless you cancel before 
                  the renewal date. You will be charged the then-current subscription rate, which we reserve 
                  the right to modify with at least 30 days' notice to existing subscribers.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Cancellation and Refunds</h3>
                <p className="text-muted-foreground">
                  You may cancel your subscription at any time through your account settings. Upon cancellation, 
                  you will retain access to paid features until the end of your current billing period. We do 
                  not offer refunds for partial billing periods except as required by law or at our sole discretion.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Payment Failures</h3>
                <p className="text-muted-foreground">
                  If a payment fails, we will attempt to notify you and retry the charge. Continued payment 
                  failure may result in suspension or downgrade of your account. We are not responsible for 
                  any loss of data or access resulting from payment failures.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Taxes</h3>
                <p className="text-muted-foreground">
                  All fees are exclusive of applicable taxes unless otherwise stated. You are responsible for 
                  any taxes, duties, or other governmental charges associated with your subscription.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-intellectual-property">
            <CardHeader>
              <CardTitle className="text-2xl">5. Intellectual Property Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Content Ownership</h3>
                <p className="text-muted-foreground">
                  You retain all intellectual property rights to the content you create, upload, or store on 
                  88Away ("Your Content"). These Terms do not transfer any ownership of Your Content to us. 
                  Your creative work belongs to you, and we respect your rights as a creator.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">License to Us</h3>
                <p className="text-muted-foreground">
                  By using the Service, you grant us a limited, non-exclusive, royalty-free, worldwide license 
                  to host, store, process, display, and transmit Your Content solely for the purpose of 
                  providing and improving the Service. This includes processing Your Content through AI features 
                  when you choose to use them.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Collaborative Content</h3>
                <p className="text-muted-foreground">
                  When you collaborate with other users on shared projects, you acknowledge that all 
                  collaborators may have shared rights to the collaborative work. You are responsible for 
                  ensuring you have appropriate agreements with your collaborators regarding ownership and 
                  use of collaborative content.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Platform Intellectual Property</h3>
                <p className="text-muted-foreground">
                  The Service itself, including all software, designs, trademarks, logos, and other materials 
                  (excluding Your Content), is owned by 88Away and is protected by copyright, trademark, and 
                  other intellectual property laws. You may not copy, modify, distribute, or create derivative 
                  works of our platform or its components.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Content Representations</h3>
                <p className="text-muted-foreground">
                  By submitting content to the Service, you represent and warrant that you own or have the 
                  necessary rights to use and authorize us to use Your Content as described in these Terms, 
                  and that Your Content does not infringe on the intellectual property rights of any third party.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-ai-content">
            <CardHeader>
              <CardTitle className="text-2xl">6. AI-Generated Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Nature of AI Assistance</h3>
                <p className="text-muted-foreground">
                  Our AI writing assistant features use large language models provided by OpenAI to generate 
                  suggestions, edits, and content based on your prompts. AI-generated content is created through 
                  statistical patterns and should be considered as assistance and inspiration rather than 
                  definitive or authoritative output.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No Guarantees</h3>
                <p className="text-muted-foreground">
                  We make no representations or warranties about the accuracy, completeness, quality, or 
                  appropriateness of AI-generated content. AI outputs may contain errors, inconsistencies, 
                  inappropriate content, or biases. You are solely responsible for reviewing, editing, and 
                  verifying any AI-generated content before using it.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Content Ownership</h3>
                <p className="text-muted-foreground">
                  You own the rights to content generated by AI features when used within the Service, subject 
                  to the terms of service of our AI provider (OpenAI). However, AI may generate similar or 
                  identical outputs for different users given similar prompts. We cannot guarantee exclusive 
                  rights to AI-generated content.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">User Responsibility</h3>
                <p className="text-muted-foreground">
                  You are responsible for ensuring that any AI-generated content you use or publish complies 
                  with applicable laws and does not infringe on third-party rights. You should independently 
                  verify facts, claims, and other information in AI-generated content.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Data Processing</h3>
                <p className="text-muted-foreground">
                  When you use AI features, your prompts and selected content are sent to OpenAI's API for 
                  processing. OpenAI does not use data submitted via their API to train their models. For more 
                  information, please review our Privacy Policy and OpenAI's data usage policies.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-user-conduct">
            <CardHeader>
              <CardTitle className="text-2xl">7. User Responsibilities and Prohibited Conduct</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You agree to use the Service responsibly and in accordance with these Terms. You agree NOT to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Upload, create, or share content that is illegal, harmful, threatening, abusive, harassing, 
                    defamatory, vulgar, obscene, or otherwise objectionable</li>
                <li>Infringe on the intellectual property rights, privacy rights, or other rights of others</li>
                <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity</li>
                <li>Use the Service to transmit viruses, malware, or other malicious code</li>
                <li>Attempt to gain unauthorized access to any portion of the Service, other users' accounts, 
                    or any systems or networks connected to the Service</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                <li>Use automated systems (bots, scrapers) to access the Service without our express written permission</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service for any commercial purpose without our express written permission</li>
                <li>Share your account credentials or allow unauthorized access to your account</li>
                <li>Abuse or exploit bugs, glitches, or vulnerabilities in the Service</li>
                <li>Use the Service to send spam, chain letters, or other unsolicited communications</li>
                <li>Exceed rate limits or usage quotas specified for your subscription tier</li>
              </ul>
              <p className="text-muted-foreground">
                We reserve the right to investigate and take appropriate action against anyone who violates 
                these Terms, including removing content, suspending or terminating accounts, and reporting 
                to law enforcement authorities when appropriate.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-privacy">
            <CardHeader>
              <CardTitle className="text-2xl">8. Data and Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your privacy is important to us. Our collection, use, and protection of your personal 
                information is governed by our Privacy Policy, which is incorporated into these Terms by 
                reference.
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Collection and Use</h3>
                <p className="text-muted-foreground">
                  We collect and process information as described in our Privacy Policy, including account 
                  information, content data, usage data, and payment information. By using the Service, you 
                  consent to such collection and processing in accordance with our Privacy Policy.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Security</h3>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your data. However, 
                  no system is completely secure. You acknowledge that you provide your information at your 
                  own risk.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Third-Party Services</h3>
                <p className="text-muted-foreground">
                  The Service integrates with third-party services including OpenAI (for AI features), Stripe 
                  (for payment processing), and Neon Database (for data storage). Your use of these integrated 
                  features is subject to the respective privacy policies of these third parties.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Our Privacy Policy</h3>
                <p className="text-muted-foreground">
                  For complete information about how we collect, use, and protect your data, please review our{" "}
                  <Link href="/privacy">
                    <a className="text-primary hover:underline">Privacy Policy</a>
                  </Link>.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-termination">
            <CardHeader>
              <CardTitle className="text-2xl">9. Termination and Suspension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Termination by You</h3>
                <p className="text-muted-foreground">
                  You may terminate your account at any time by contacting our support team at 
                  support@88away.com or through your account settings. Upon termination, you will lose access 
                  to the Service and Your Content stored on our platform. We recommend exporting your content 
                  before terminating your account.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Termination by Us</h3>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your account and access to the Service at any 
                  time, with or without cause, and with or without notice. Reasons for termination may include, 
                  but are not limited to: violation of these Terms, fraudulent activity, abuse of the Service, 
                  non-payment of fees, or at our sole discretion.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Effect of Termination</h3>
                <p className="text-muted-foreground">
                  Upon termination, your right to use the Service immediately ceases. We may delete your 
                  account and all associated data after a reasonable period. You remain liable for all charges 
                  incurred prior to termination. Sections of these Terms that by their nature should survive 
                  termination shall survive, including ownership provisions, warranty disclaimers, and 
                  limitations of liability.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Retention</h3>
                <p className="text-muted-foreground">
                  After account termination, we may retain certain information as required by law, for 
                  legitimate business purposes, or as described in our Privacy Policy. We are under no 
                  obligation to store or provide access to Your Content after termination.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-liability">
            <CardHeader>
              <CardTitle className="text-2xl">10. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Disclaimer of Warranties</h3>
                <p className="text-muted-foreground">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
                  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
                  FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE. WE DO NOT 
                  WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL 88AWAY, ITS OFFICERS, DIRECTORS, 
                  EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR 
                  PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR 
                  OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OR INABILITY TO USE THE SERVICE.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Maximum Liability</h3>
                <p className="text-muted-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING 
                  OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US 
                  IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR $100, WHICHEVER 
                  IS GREATER.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Data Loss</h3>
                <p className="text-muted-foreground">
                  We are not liable for any loss or corruption of Your Content or other data. You are solely 
                  responsible for maintaining backups of Your Content. We strongly recommend regularly exporting 
                  and backing up your work.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Third-Party Actions</h3>
                <p className="text-muted-foreground">
                  We are not responsible for the actions, content, or data of third parties, including other 
                  users, and you release us from any claims arising from such third-party actions.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Jurisdictional Limitations</h3>
                <p className="text-muted-foreground">
                  Some jurisdictions do not allow the exclusion or limitation of certain warranties or 
                  liabilities. In such jurisdictions, the above limitations and exclusions may not apply to 
                  you, and our liability will be limited to the maximum extent permitted by law.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-dispute-resolution">
            <CardHeader>
              <CardTitle className="text-2xl">11. Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Informal Resolution</h3>
                <p className="text-muted-foreground">
                  If you have a dispute with us, you agree to first contact us at legal@88away.com and attempt 
                  to resolve the dispute informally. We will work in good faith to resolve any disputes through 
                  direct communication.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Governing Law</h3>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
                  in which 88Away is incorporated, without regard to its conflict of law provisions.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Arbitration</h3>
                <p className="text-muted-foreground">
                  Any dispute, controversy, or claim arising out of or relating to these Terms or the Service 
                  that cannot be resolved informally shall be settled by binding arbitration in accordance with 
                  applicable arbitration rules. The arbitration shall be conducted in English, and the arbitrator's 
                  decision shall be final and binding.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Class Action Waiver</h3>
                <p className="text-muted-foreground">
                  You agree that any arbitration or proceeding shall be limited to the dispute between you and 
                  us individually. To the fullest extent permitted by law, you agree that no arbitration or 
                  proceeding shall be joined with any other, no dispute shall be arbitrated on a class-action 
                  basis, and you waive any right to participate in a class action against us.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Exceptions</h3>
                <p className="text-muted-foreground">
                  Either party may seek equitable relief (such as injunctive relief) in a court of competent 
                  jurisdiction to prevent infringement of intellectual property rights or other irreparable harm.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-changes">
            <CardHeader>
              <CardTitle className="text-2xl">12. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. When we make changes to these Terms, 
                we will update the "Last updated" date at the top of this page and notify you through one or 
                more of the following methods:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Email notification to your registered email address</li>
                <li>A prominent notice on our platform or Service</li>
                <li>An in-app notification when you next use the Service</li>
              </ul>
              <p className="text-muted-foreground">
                Your continued use of the Service after any changes to these Terms constitutes your acceptance 
                of the modified Terms. If you do not agree to the modified Terms, you must stop using the 
                Service and may terminate your account.
              </p>
              <p className="text-muted-foreground">
                Material changes that negatively affect your rights will be communicated at least 30 days 
                before they take effect, except when changes are required to comply with legal requirements, 
                in which case they may take effect immediately.
              </p>
              <p className="text-muted-foreground">
                We encourage you to review these Terms periodically to stay informed of any updates. You can 
                always find the most current version of these Terms on this page.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-contact">
            <CardHeader>
              <CardTitle className="text-2xl">13. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions, concerns, or feedback regarding these Terms and Conditions or the 
                Service, please contact us through the following channels:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="font-semibold">88Away Legal Team</p>
                <p className="text-muted-foreground">General Support: support@88away.com</p>
                <p className="text-muted-foreground">Legal Inquiries: legal@88away.com</p>
                <p className="text-muted-foreground">Privacy Matters: privacy@88away.com</p>
                <p className="text-muted-foreground">Billing Questions: billing@88away.com</p>
              </div>
              <p className="text-muted-foreground">
                We will make reasonable efforts to respond to all legitimate inquiries within 5 business days. 
                For urgent legal matters, please mark your email as "Urgent Legal Matter" in the subject line.
              </p>
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                <p className="text-muted-foreground">
                  For information about our data practices, please see our{" "}
                  <Link href="/privacy">
                    <a className="text-primary hover:underline">Privacy Policy</a>
                  </Link>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            These Terms and Conditions are effective as of October 2, 2025. By using 88Away, you acknowledge 
            that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
