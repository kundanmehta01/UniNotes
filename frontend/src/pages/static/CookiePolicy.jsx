import { Link } from 'react-router-dom';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners to make their websites work more efficiently and to provide information to the owners of the website.
              </p>
              <p className="mb-4">
                This Cookie Policy explains how UniNotesHub ("we," "us," or "our") uses cookies and similar technologies on our website and platform. This policy should be read alongside our <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link> and <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.1 Essential Cookies</h3>
              <p className="mb-4">
                These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you, such as logging in, setting privacy preferences, or filling in forms.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Examples:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Authentication cookies to keep you logged in</li>
                  <li>Security cookies to prevent fraud</li>
                  <li>Session cookies to maintain your preferences</li>
                  <li>Load balancing cookies to ensure optimal performance</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.2 Performance and Analytics Cookies</h3>
              <p className="mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information. All information collected is aggregated and anonymous.
              </p>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Examples:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Google Analytics cookies to track website usage</li>
                  <li>Performance monitoring cookies</li>
                  <li>Error tracking cookies</li>
                  <li>Page load time measurement cookies</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.3 Functionality Cookies</h3>
              <p className="mb-4">
                These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
              </p>
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Examples:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Language preference cookies</li>
                  <li>Theme and display preference cookies</li>
                  <li>Search filter and sorting preferences</li>
                  <li>Recently viewed content tracking</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">2.4 Targeting and Advertising Cookies</h3>
              <p className="mb-4">
                These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant content and advertisements on other sites.
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Examples:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Social media integration cookies</li>
                  <li>Content recommendation cookies</li>
                  <li>Academic interest profiling cookies</li>
                  <li>Cross-platform tracking cookies (if applicable)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Specific Cookies Used</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Cookie Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Purpose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">access_token</td>
                      <td className="border border-gray-300 px-4 py-2">User authentication</td>
                      <td className="border border-gray-300 px-4 py-2">15 minutes</td>
                      <td className="border border-gray-300 px-4 py-2">Essential</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">refresh_token</td>
                      <td className="border border-gray-300 px-4 py-2">Session management</td>
                      <td className="border border-gray-300 px-4 py-2">30 days</td>
                      <td className="border border-gray-300 px-4 py-2">Essential</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">user_preferences</td>
                      <td className="border border-gray-300 px-4 py-2">Theme and display settings</td>
                      <td className="border border-gray-300 px-4 py-2">1 year</td>
                      <td className="border border-gray-300 px-4 py-2">Functionality</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">_ga</td>
                      <td className="border border-gray-300 px-4 py-2">Google Analytics tracking</td>
                      <td className="border border-gray-300 px-4 py-2">2 years</td>
                      <td className="border border-gray-300 px-4 py-2">Analytics</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">search_history</td>
                      <td className="border border-gray-300 px-4 py-2">Recent search suggestions</td>
                      <td className="border border-gray-300 px-4 py-2">30 days</td>
                      <td className="border border-gray-300 px-4 py-2">Functionality</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="mb-4">
                Some cookies are placed by third-party services that appear on our pages. We have no control over these cookies, and you should check the relevant third party's website for more information about these cookies.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.1 Analytics Services</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li><strong>Google Analytics:</strong> Helps us analyze website traffic and user behavior</li>
                <li><strong>Hotjar:</strong> Provides heatmaps and user session recordings (if applicable)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.2 Social Media Integration</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li><strong>Social sharing buttons:</strong> May set cookies when you share content</li>
                <li><strong>Embedded content:</strong> Third-party content may include their own cookies</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">4.3 Content Delivery Networks</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li><strong>CDN services:</strong> May use cookies to optimize content delivery</li>
                <li><strong>Font services:</strong> External font providers may set cookies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3">5.1 Browser Settings</h3>
              <p className="mb-4">
                Most web browsers allow you to control cookies through their settings preferences. You can set your browser to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Accept all cookies</li>
                <li>Reject all cookies</li>
                <li>Accept only first-party cookies</li>
                <li>Prompt you before accepting cookies</li>
                <li>Delete existing cookies</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">5.2 Platform Settings</h3>
              <p className="mb-4">
                When you're logged into UniNotesHub, you can manage some cookie preferences through your account settings:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="mb-2"><strong>To access cookie settings:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Log into your UniNotesHub account</li>
                  <li>Go to Profile → Privacy Settings</li>
                  <li>Select "Cookie Preferences"</li>
                  <li>Adjust your preferences for non-essential cookies</li>
                </ol>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">5.3 Opt-Out Links</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
                <li><strong>Network Advertising Initiative:</strong> <a href="https://www.networkadvertising.org/choices/" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">NAI Consumer Opt-out</a></li>
                <li><strong>Digital Advertising Alliance:</strong> <a href="https://www.aboutads.info/choices/" className="text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">DAA WebChoices Tool</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Impact of Disabling Cookies</h2>
              <p className="mb-4">
                While you can disable cookies, please note that this may affect your experience on UniNotesHub:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-red-800">Disabling Essential Cookies</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You may not be able to log in</li>
                    <li>Security features may not work</li>
                    <li>Forms may not submit properly</li>
                    <li>Some features may be inaccessible</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-orange-800">Disabling Optional Cookies</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Preferences may not be remembered</li>
                    <li>Content recommendations may be less relevant</li>
                    <li>Analytics tracking will be disabled</li>
                    <li>Some personalization features may not work</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookie Consent</h2>
              <p className="mb-4">
                When you first visit UniNotesHub, you will see a cookie consent banner that allows you to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Accept all cookies</li>
                <li>Accept only essential cookies</li>
                <li>Customize your cookie preferences</li>
                <li>Learn more about our cookie practices</li>
              </ul>
              <p className="mb-4">
                You can change your cookie preferences at any time by clicking the "Cookie Settings" link in our website footer or through your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Storage and Security</h2>
              <p className="mb-4">
                Cookie data is stored securely and is subject to the same security measures as other user data on our platform. We implement appropriate technical and organizational measures to protect cookie data from unauthorized access, alteration, or deletion.
              </p>
              <p className="mb-4">
                For more information about our data security practices, please refer to our <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Updates to This Policy</h2>
              <p className="mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Posting the updated policy on our website</li>
                <li>Updating the "Last updated" date at the top of this policy</li>
                <li>Providing notice through our platform or via email (for material changes)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="mb-4">
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="mb-2"><strong>Email:</strong> privacy@uninoteshub.com</p>
                <p className="mb-2"><strong>Subject Line:</strong> Cookie Policy Inquiry</p>
                <p className="mb-2"><strong>Address:</strong> UniNotesHub Privacy Team</p>
                <p className="mb-2">123 Academic Way, Education City, EC 12345</p>
                <p><strong>Response Time:</strong> We will respond within 30 days</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                This Cookie Policy is part of our <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-800">Terms of Service</Link> and <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>. 
                By using UniNotesHub, you consent to our use of cookies as described in this policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
