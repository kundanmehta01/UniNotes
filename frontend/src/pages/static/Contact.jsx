import React from 'react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-8">
              We'd love to hear from you! Get in touch with the UniNotesHub team using any of the methods below.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">General Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Email</h3>
                    <p className="text-gray-600">
                      <strong>General Inquiries:</strong> info@uninoteshub.com<br />
                      <strong>Support:</strong> support@uninoteshub.com<br />
                      <strong>Privacy:</strong> privacy@uninoteshub.com
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Response Time</h3>
                    <p className="text-gray-600">
                      We typically respond to all inquiries within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Support Categories</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Technical Support</h3>
                    <p className="text-gray-600 text-sm">
                      Issues with uploading, downloading, or accessing content
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Content Moderation</h3>
                    <p className="text-gray-600 text-sm">
                      Report inappropriate content or academic integrity violations
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Account Issues</h3>
                    <p className="text-gray-600 text-sm">
                      Account access, profile updates, or deletion requests
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Partnerships</h3>
                    <p className="text-gray-600 text-sm">
                      University partnerships and institutional collaborations
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">How do I report inappropriate content?</h3>
                  <p className="text-gray-600">
                    You can report content by clicking the "Report" button on any paper or note page, 
                    or by emailing us at support@uninoteshub.com with the content URL and reason for reporting.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">How can I contribute to UniNotesHub?</h3>
                  <p className="text-gray-600">
                    You can contribute by uploading your own academic work, providing feedback on existing content, 
                    or helping moderate the platform. All contributions should follow our community guidelines.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">Is there a mobile app available?</h3>
                  <p className="text-gray-600">
                    Currently, UniNotesHub is accessible through web browsers on all devices. 
                    A dedicated mobile app is in development for future release.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">How do I delete my account?</h3>
                  <p className="text-gray-600">
                    You can request account deletion by emailing privacy@uninoteshub.com. 
                    Please note that some content may remain for academic integrity purposes as outlined in our privacy policy.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-12 bg-blue-50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Community Guidelines</h2>
              <p className="mb-4">
                Before reaching out, please review our <a href="/guidelines" className="text-blue-600 hover:text-blue-800">Community Guidelines</a> 
                and <a href="/terms-of-service" className="text-blue-600 hover:text-blue-800">Terms of Service</a> as they may answer your questions.
              </p>
              <p>
                For privacy-related inquiries, please refer to our <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
