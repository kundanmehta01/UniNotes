import { Link } from 'react-router-dom';

const Guidelines = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Guidelines</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Welcome to UniNotesHub</h2>
              <p className="mb-4">
                UniNotesHub is a community-driven platform where students, researchers, and educators come together to share knowledge and academic resources. These guidelines help create a positive, respectful, and productive environment for all users.
              </p>
              <p className="mb-4">
                By participating in our community, you agree to follow these guidelines along with our <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-800">Terms of Service</Link> and <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Academic Integrity</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">1.1 Original Work and Attribution</h3>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2 text-green-800">✓ Do:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Share your own original work and research</li>
                  <li>Properly cite and attribute sources</li>
                  <li>Use clear licensing for your content</li>
                  <li>Respect copyright and intellectual property rights</li>
                  <li>Provide context for shared materials</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2 text-red-800">✗ Don't:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload copyrighted materials without permission</li>
                  <li>Plagiarize or misrepresent others' work as your own</li>
                  <li>Share exam answers or assignment solutions</li>
                  <li>Facilitate academic dishonesty or cheating</li>
                  <li>Remove attribution from existing works</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">1.2 Educational Purpose</h3>
              <p className="mb-4">
                All shared content should serve educational, research, or academic purposes. Materials should help others learn, understand concepts, or conduct legitimate research.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Content Quality Standards</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.1 High-Quality Submissions</h3>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li><strong>Clear and Readable:</strong> Ensure documents are legible and well-formatted</li>
                <li><strong>Accurate Information:</strong> Verify the correctness of shared content</li>
                <li><strong>Relevant Metadata:</strong> Include descriptive titles, tags, and subject categories</li>
                <li><strong>Complete Materials:</strong> Share complete documents rather than fragments</li>
                <li><strong>Updated Content:</strong> Ensure information is current and relevant</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.2 Content Organization</h3>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Best Practices:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use descriptive titles that clearly indicate content</li>
                  <li>Add relevant tags for discoverability</li>
                  <li>Choose appropriate subject categories</li>
                  <li>Include brief descriptions or summaries</li>
                  <li>Specify academic level (undergraduate, graduate, etc.)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Community Interaction</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">3.1 Respectful Communication</h3>
              <p className="mb-4">
                UniNotesHub is a diverse academic community. We expect all interactions to be respectful, constructive, and professional.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-800">Encouraged Behavior</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Constructive feedback and suggestions</li>
                    <li>Helpful comments and clarifications</li>
                    <li>Collaborative discussions</li>
                    <li>Sharing additional resources</li>
                    <li>Acknowledging others' contributions</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-red-800">Prohibited Behavior</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Personal attacks or harassment</li>
                    <li>Discriminatory language or behavior</li>
                    <li>Spam or irrelevant content</li>
                    <li>Offensive or inappropriate material</li>
                    <li>Commercial advertising</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">3.2 Reviews and Ratings</h3>
              <p className="mb-4">
                When reviewing shared content, provide honest, constructive feedback that helps other users and content creators:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Focus on content quality and usefulness</li>
                <li>Provide specific, actionable feedback</li>
                <li>Be fair and objective in ratings</li>
                <li>Explain your reasoning for ratings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Privacy and Safety</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.1 Personal Information</h3>
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">⚠️ Important:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Never share personal information (addresses, phone numbers, etc.)</li>
                  <li>Be cautious about sharing email addresses publicly</li>
                  <li>Don't include personal details in uploaded documents</li>
                  <li>Report any inappropriate requests for personal information</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.2 Safe Content Sharing</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Remove any personal information from documents before uploading</li>
                <li>Be mindful of institutional policies when sharing materials</li>
                <li>Don't share content that could compromise security or privacy</li>
                <li>Report suspicious or inappropriate content immediately</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Prohibited Content</h2>
              
              <p className="mb-4">The following types of content are strictly prohibited on UniNotesHub:</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Academic Violations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Exam questions and answers</li>
                    <li>Assignment solutions for active courses</li>
                    <li>Copyrighted textbooks and materials</li>
                    <li>Plagiarized content</li>
                    <li>Materials that violate academic integrity</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Inappropriate Content</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Offensive, hateful, or discriminatory material</li>
                    <li>Spam or commercial advertising</li>
                    <li>Malicious files or software</li>
                    <li>Content unrelated to education or research</li>
                    <li>Personal attacks or harassment</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Moderation and Enforcement</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">6.1 Content Review Process</h3>
              <p className="mb-4">
                All uploaded content goes through a moderation process to ensure compliance with our guidelines:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Automated screening for prohibited content</li>
                  <li>Community flagging and reporting system</li>
                  <li>Manual review by moderation team</li>
                  <li>Academic integrity verification</li>
                  <li>Final approval or rejection decision</li>
                </ol>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">6.2 Violations and Consequences</h3>
              <p className="mb-4">
                Violations of these guidelines may result in various actions depending on severity:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li><strong>Warning:</strong> First-time minor violations</li>
                <li><strong>Content Removal:</strong> Deletion of problematic content</li>
                <li><strong>Account Restriction:</strong> Limited access to certain features</li>
                <li><strong>Temporary Suspension:</strong> Short-term account suspension</li>
                <li><strong>Permanent Ban:</strong> Permanent removal from the platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Reporting and Support</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">7.1 How to Report Violations</h3>
              <p className="mb-4">
                If you encounter content or behavior that violates these guidelines:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Reporting Options:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Report Button:</strong> Use the report button on any content or profile</li>
                  <li><strong>Email:</strong> Send details to moderation@uninoteshub.com</li>
                  <li><strong>Contact Form:</strong> Use our support contact form</li>
                  <li><strong>Emergency:</strong> For urgent safety concerns, contact us immediately</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">7.2 What to Include in Reports</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Specific details about the violation</li>
                <li>Links to problematic content</li>
                <li>Screenshots if relevant</li>
                <li>Context or background information</li>
                <li>Your contact information for follow-up</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Best Practices for Success</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">8.1 Building a Strong Profile</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Complete your academic profile with relevant information</li>
                <li>Upload a professional profile picture</li>
                <li>Verify your academic affiliation when possible</li>
                <li>Maintain a consistent, professional presence</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">8.2 Engaging with the Community</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Share high-quality, original content regularly</li>
                <li>Provide helpful reviews and feedback</li>
                <li>Participate in academic discussions</li>
                <li>Help newcomers understand the platform</li>
                <li>Collaborate respectfully with other users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Updates and Changes</h2>
              <p className="mb-4">
                These guidelines may be updated periodically to reflect changes in our community, policies, or legal requirements. We will notify users of significant changes through:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Platform announcements</li>
                <li>Email notifications</li>
                <li>Updated "Last modified" date</li>
                <li>Highlighted changes in the guidelines</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact and Support</h2>
              <p className="mb-4">
                If you have questions about these guidelines or need clarification on any policies, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="mb-2"><strong>Community Team:</strong> community@uninoteshub.com</p>
                <p className="mb-2"><strong>Moderation Team:</strong> moderation@uninoteshub.com</p>
                <p className="mb-2"><strong>Academic Integrity:</strong> integrity@uninoteshub.com</p>
                <p className="mb-2"><strong>General Support:</strong> support@uninoteshub.com</p>
                <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">🎓 Remember</h3>
                <p className="text-sm text-gray-700">
                  UniNotesHub exists to support your academic journey and foster collaborative learning. 
                  By following these guidelines, you help create a positive environment where everyone can 
                  learn, share knowledge, and succeed together. Thank you for being part of our academic community!
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                These guidelines work together with our <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-800">Terms of Service</Link> and <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link> to create a comprehensive framework for using UniNotesHub.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guidelines;
