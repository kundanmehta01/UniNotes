import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to UniNotesHub ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our academic resource sharing platform.
              </p>
              <p className="mb-4">
                By accessing or using UniNotesHub, you agree to the terms outlined in this Privacy Policy. If you do not agree with our practices, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
              <p className="mb-4">When you register for an account, we collect:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Full name</li>
                <li>Email address</li>
                <li>University or educational institution</li>
                <li>Academic program/field of study</li>
                <li>Profile picture (optional)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.2 Content Information</h3>
              <p className="mb-4">We collect information about the content you share:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Research papers, notes, and study materials you upload</li>
                <li>Subject categories and tags</li>
                <li>Descriptions and metadata</li>
                <li>Comments and reviews on shared content</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.3 Usage Information</h3>
              <p className="mb-4">We automatically collect:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Log data (IP address, browser type, device information)</li>
                <li>Usage patterns and interactions with the platform</li>
                <li>Search queries and download history</li>
                <li>Session duration and frequency of visits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>Provide Services:</strong> Create and maintain your account, process uploads, and facilitate content sharing</li>
                <li><strong>Improve Platform:</strong> Analyze usage patterns to enhance user experience and platform functionality</li>
                <li><strong>Communication:</strong> Send important updates, notifications, and respond to your inquiries</li>
                <li><strong>Security:</strong> Detect and prevent fraud, spam, and unauthorized access</li>
                <li><strong>Compliance:</strong> Ensure adherence to academic integrity and intellectual property laws</li>
                <li><strong>Recommendations:</strong> Suggest relevant content and connect you with similar academic interests</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.1 Public Information</h3>
              <p className="mb-4">
                Your profile information (name, university, academic interests) and shared academic content are publicly visible to help facilitate academic collaboration and resource discovery.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.2 Service Providers</h3>
              <p className="mb-4">
                We may share information with trusted third-party service providers who help us operate our platform, including cloud storage, analytics, and customer support services.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.3 Legal Requirements</h3>
              <p className="mb-4">
                We may disclose information when required by law, court order, or to protect our rights, users' safety, or investigate violations of our terms of service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="mb-4">
                We implement robust security measures to protect your information:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication protocols</li>
                <li>Secure cloud infrastructure and backup systems</li>
              </ul>
              <p className="mb-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but strive to use commercially acceptable means to protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Update:</strong> Modify your profile and account information</li>
                <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
                <li><strong>Control:</strong> Manage privacy settings and content visibility</li>
                <li><strong>Export:</strong> Download your uploaded content and data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze platform usage. You can manage cookie settings through your browser, though some features may not function properly if cookies are disabled.
              </p>
              <p className="mb-4">
                For detailed information about our cookie practices, please see our <Link to="/cookie-policy" className="text-blue-600 hover:text-blue-800">Cookie Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="mb-4">
                UniNotesHub is intended for use by individuals who are at least 13 years old. We do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will promptly delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date. Your continued use of UniNotesHub after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="mb-2"><strong>Email:</strong> privacy@uninoteshub.com</p>
                <p className="mb-2"><strong>Address:</strong> UniNotesHub Privacy Team</p>
                <p className="mb-2">123 Academic Way, Education City, EC 12345</p>
                <p><strong>Response Time:</strong> We will respond to your inquiries within 30 days</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                This Privacy Policy is part of our <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>. 
                By using UniNotesHub, you agree to both documents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
