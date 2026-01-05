import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 5, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* Terms of Service */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using this organizational knowledge management platform ("Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not access or use the Service. These Terms constitute a legally binding agreement between you and the Company regarding your use of the Service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Service provides organizational knowledge management tools including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Employee profile management and organizational mapping</li>
              <li>Process documentation and workflow analysis</li>
              <li>Knowledge synthesis and insight generation</li>
              <li>Dependency tracking and relationship visualization</li>
              <li>Data analytics and reporting capabilities</li>
              <li>AI-powered query interfaces for organizational knowledge</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts and Access</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To access certain features of the Service, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security and confidentiality of your login credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in unauthorized activities.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Acceptable Use Policy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable local, state, national, or international law or regulation</li>
              <li>Infringe upon the intellectual property rights of others</li>
              <li>Transmit any material that is defamatory, offensive, or otherwise objectionable</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Collect or harvest any information from the Service without authorization</li>
              <li>Use the Service for any purpose other than its intended organizational use</li>
              <li>Share confidential organizational data with unauthorized parties</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Intellectual Property Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Service and its original content, features, and functionality are owned by the Company and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of any data, content, or materials you upload to the Service ("User Content"). By uploading User Content, you grant us a non-exclusive, worldwide, royalty-free license to use, process, and display such content solely for the purpose of providing the Service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Ownership and Portability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your organization retains full ownership of all organizational data uploaded to the Service. You may request export of your data at any time in a standard, machine-readable format. Upon termination of your account, we will provide a reasonable period for data export before deletion.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Service Availability and Modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to maintain high availability of the Service but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless the Company and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising out of or related to your use of the Service, your violation of these Terms, or your violation of any rights of another party.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Governing Law and Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the Company is incorporated, without regard to its conflict of law provisions. Any disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation, followed by binding arbitration if necessary.
            </p>
          </section>

          <Separator className="my-12" />

          {/* Privacy Policy */}
          <h1 className="text-4xl font-bold text-foreground mb-2 pt-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 5, 2026</p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information to provide and improve our Service. The types of information we collect include:
            </p>
            
            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">1.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Name, email address, job title, department, and organizational role</li>
              <li><strong>Profile Data:</strong> Employee profiles, skills, expertise areas, and professional background</li>
              <li><strong>Organizational Data:</strong> Process documentation, workflow information, and institutional knowledge</li>
              <li><strong>Communication Data:</strong> Messages, feedback, and support inquiries</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">1.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers</li>
              <li><strong>Log Data:</strong> Access times, error logs, and system activity</li>
              <li><strong>Cookies and Tracking:</strong> Session cookies, authentication tokens, and analytics data</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Providing, maintaining, and improving the Service</li>
              <li>Processing and managing user accounts</li>
              <li>Generating organizational insights and analytics</li>
              <li>Facilitating knowledge discovery and dependency mapping</li>
              <li>Sending service-related notifications and updates</li>
              <li>Responding to user inquiries and support requests</li>
              <li>Detecting and preventing security threats and fraud</li>
              <li>Complying with legal obligations and enforcing our Terms</li>
              <li>Conducting research and development to improve our offerings</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Information Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We do not sell your personal information. We may share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Within Your Organization:</strong> Information may be visible to authorized users within your organization based on access controls</li>
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in operating our Service, subject to confidentiality obligations</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales, with appropriate notice</li>
              <li><strong>With Consent:</strong> When you have given explicit consent for specific sharing</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement robust security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Encryption of data in transit using TLS/SSL protocols</li>
              <li>Encryption of data at rest using industry-standard algorithms</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection and security practices</li>
              <li>Incident response procedures for potential breaches</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              While we strive to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security but commit to promptly addressing any security incidents.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide the Service. Upon account termination, we will retain data for a reasonable period to comply with legal obligations, resolve disputes, and enforce agreements. Organizational data may be retained in anonymized form for analytical purposes.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights and Choices</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your jurisdiction, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements</li>
              <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your personal information</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent for data processing</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us using the information provided below. We will respond to your request within the timeframe required by applicable law.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Maintain user sessions and authentication</li>
              <li>Remember user preferences and settings</li>
              <li>Analyze usage patterns and improve the Service</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect the functionality of the Service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards, including standard contractual clauses and adequacy decisions where applicable.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child, we will take steps to delete such information promptly.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms and Conditions or our Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-foreground">Email: legal@company.com</p>
              <p className="text-foreground">Address: 123 Business Avenue, Suite 500</p>
              <p className="text-foreground">Phone: +1 (555) 123-4567</p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              © 2026 Company Name. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
