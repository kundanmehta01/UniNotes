import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to UniNotesHub, an academic resource sharing platform designed to facilitate collaboration and knowledge sharing among students, researchers, and educational professionals. By accessing or using our services, you agree to be bound by these Terms of Service ("Terms") and our <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>.
              </p>
              <p className="mb-4">
                If you do not agree to these Terms, you may not access or use UniNotesHub. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="mb-4">
                UniNotesHub is an online platform that enables users to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Upload, share, and discover academic resources including research papers, study notes, and educational materials</li>
                <li>Collaborate with peers and professionals in various academic fields</li>
                <li>Access curated collections of academic content</li>
                <li>Participate in academic discussions and reviews</li>
                <li>Build academic profiles and networks</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Eligibility</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">3.1 Account Creation</h3>
              <p className="mb-4">
                To access certain features of UniNotesHub, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">3.2 Eligibility</h3>
              <p className="mb-4">
                You must be at least 13 years old to use UniNotesHub. If you are under 18, you represent that you have obtained parental or guardian consent to use our services.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">3.3 Academic Verification</h3>
              <p className="mb-4">
                We may require verification of your academic affiliation or credentials for certain features or access levels. Providing false information may result in account suspension or termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Content and Intellectual Property</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.1 Your Content</h3>
              <p className="mb-4">
                You retain ownership of the intellectual property rights in the content you upload to UniNotesHub ("User Content"). By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, distribute, and modify your content solely for the purpose of providing our services.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.2 Content Standards</h3>
              <p className="mb-4">All User Content must:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Be original work or properly attributed and legally shared</li>
                <li>Comply with applicable copyright and intellectual property laws</li>
                <li>Be relevant to academic or educational purposes</li>
                <li>Not contain harmful, offensive, or inappropriate material</li>
                <li>Not violate academic integrity policies or promote academic dishonesty</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.3 Copyright Compliance</h3>
              <p className="mb-4">
                We respect intellectual property rights and expect users to do the same. If you believe your copyright has been infringed, please contact us at copyright@uninoteshub.com with detailed information about the alleged infringement.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.4 Content Moderation</h3>
              <p className="mb-4">
                We reserve the right to review, moderate, or remove any User Content that violates these Terms or is otherwise objectionable, without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Prohibited Uses</h2>
              <p className="mb-4">You may not use UniNotesHub to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>Academic Dishonesty:</strong> Facilitate cheating, plagiarism, or other forms of academic misconduct</li>
                <li><strong>Copyright Infringement:</strong> Upload or share copyrighted materials without proper authorization</li>
                <li><strong>Spam or Abuse:</strong> Send unsolicited messages, engage in harassment, or abuse other users</li>
                <li><strong>Illegal Activities:</strong> Engage in any unlawful activities or promote illegal conduct</li>
                <li><strong>System Interference:</strong> Attempt to gain unauthorized access to our systems or interfere with platform functionality</li>
                <li><strong>False Information:</strong> Provide false or misleading information about yourself or your academic credentials</li>
                <li><strong>Commercial Use:</strong> Use the platform for unauthorized commercial purposes or advertising</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Academic Integrity</h2>
              <p className="mb-4">
                UniNotesHub is committed to supporting academic integrity. Users are expected to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Use shared resources for learning and research purposes only</li>
                <li>Properly cite and attribute sources when using others' work</li>
                <li>Respect institutional policies regarding collaboration and resource sharing</li>
                <li>Not use the platform to circumvent academic requirements or assessments</li>
              </ul>
              <p className="mb-4">
                Violations of academic integrity may result in account suspension and notification to relevant academic institutions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>, which is incorporated into these Terms by reference.
              </p>
              <p className="mb-4">
                By using UniNotesHub, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Platform Availability and Modifications</h2>
              <p className="mb-4">
                We strive to provide reliable access to UniNotesHub but cannot guarantee uninterrupted service. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time, with or without notice.
              </p>
              <p className="mb-4">
                We may also impose limits on certain features or restrict access to parts of the service without liability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">9.1 Termination by You</h3>
              <p className="mb-4">
                You may terminate your account at any time by contacting us or using account deletion features within the platform.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">9.2 Termination by Us</h3>
              <p className="mb-4">
                We may suspend or terminate your account immediately, without prior notice, for violations of these Terms, suspicious activities, or any other reason we deem necessary to protect our platform and users.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">9.3 Effect of Termination</h3>
              <p className="mb-4">
                Upon termination, your right to access UniNotesHub will cease immediately. We may retain your information as required by law or for legitimate business purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Disclaimers and Limitations</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">10.1 Service Disclaimer</h3>
              <p className="mb-4">
                UniNotesHub is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, secure, or error-free.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">10.2 Content Disclaimer</h3>
              <p className="mb-4">
                We do not endorse, verify, or take responsibility for the accuracy, quality, or reliability of User Content. Users access and use content at their own risk.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">10.3 Limitation of Liability</h3>
              <p className="mb-4">
                To the fullest extent permitted by law, UniNotesHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="mb-4">
                You agree to defend, indemnify, and hold harmless UniNotesHub and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services, violation of these Terms, or infringement of any rights of another party.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
              <p className="mb-4">
                These Terms are governed by the laws of [Jurisdiction]. Any disputes arising from these Terms or your use of UniNotesHub will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
              <p className="mb-4">
                Before initiating arbitration, we encourage you to contact us at legal@uninoteshub.com to resolve any concerns informally.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. General Provisions</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">13.1 Entire Agreement</h3>
              <p className="mb-4">
                These Terms, together with our Privacy Policy and any other legal notices published by us on UniNotesHub, constitute the entire agreement between you and us.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">13.2 Severability</h3>
              <p className="mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">13.3 Assignment</h3>
              <p className="mb-4">
                You may not assign or transfer these Terms without our prior written consent. We may assign our rights and obligations without restriction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="mb-2"><strong>Email:</strong> legal@uninoteshub.com</p>
                <p className="mb-2"><strong>Address:</strong> UniNotesHub Legal Department</p>
                <p className="mb-2">123 Academic Way, Education City, EC 12345</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                By using UniNotesHub, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
