import { WaveIcon } from '../components/WaveIcon';

export function LegalPage() {
  return (
    <div className="bg-white relative min-h-screen">
      <header className="bg-blue-200 border-b">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-blue-300/50"
            aria-label="Go to map"
          >
            <WaveIcon className="size-8 text-blue-700 shrink-0" />
            <h1 className="shrink-0 whitespace-nowrap font-['Arimo',_sans-serif] text-[20px] leading-[28px] text-neutral-950">
              Waterways Observation System
            </h1>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <div className="bg-[rgba(255,255,255,0.95)] relative rounded-[14px] p-6 sm:p-8 lg:p-10">
          <div
            aria-hidden="true"
            className="absolute border-[0.8px] border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
          />

          <div className="relative space-y-10">
            <div>
              <h1 className="font-['Arimo',_sans-serif] font-normal leading-[40px] text-[34px] text-neutral-950 border-b border-[#e5e5e5] pb-4">
                Legal Information
              </h1>
            </div>

            {/* Terms Section */}
            <section id="terms" className="scroll-mt-24">
              <h2 className="font-['Arimo',_sans-serif] font-normal leading-[32px] text-[28px] text-neutral-950 mb-4">
                Terms of Use and Privacy Policy
              </h2>
              <div className="space-y-5 text-[#717182] font-['Arimo',_sans-serif] text-[16px] leading-[24px]">
                <p className="italic text-sm">Effective Date: 4/15/2026</p>
                <p>
                  <strong>App Name:</strong> HeyWade App
                </p>
                <p>
                  <strong>Operated by:</strong> WaterWays SEM, L3C
                </p>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    1. Overview and Purpose
                  </h3>
                  <p>
                    HeyWade App (the “App”) is designed to support conservation by enabling users to
                    collect, record, and share environmental observations during outdoor activities.
                    These observations may include text, audio, photographs, video, and location
                    data, and may be used for conservation, research, education, and public
                    awareness. By using the App, you agree to these Terms of Use and Privacy Policy
                    (“Terms”). If you do not agree, you may not use the App.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    2. Multimedia Data Collection (Photos, Video, and Audio)
                  </h3>
                  <p>The App enables users to capture and upload:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Photographs</li>
                    <li>Video recordings (which may include audio)</li>
                    <li>Audio recordings (e.g., verbal observations)</li>
                  </ul>
                  <p className="text-[18px] text-neutral-950 mt-4">Recording and Consent</p>
                  <p>By using these features, you agree that:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>You have the legal right to record and share all submitted content</li>
                    <li>
                      You will comply with all applicable laws, including recording and privacy laws
                    </li>
                    <li>You will obtain consent from individuals where required</li>
                  </ul>
                  <p>
                    The App may include features such as voice activation or wake-word detection
                    (e.g., “Wade”). Audio recording and transcription may occur when such features
                    are engaged.
                  </p>
                  <p className="text-[18px] text-neutral-950 mt-4">Processing</p>
                  <p>Multimedia content may be:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Stored on secure cloud systems</li>
                    <li>Transcribed using automated tools (which may produce errors)</li>
                    <li>Tagged with time, date, and GPS location</li>
                    <li>Displayed within the App or on web-based maps</li>
                    <li>Used for conservation, research, education, and outreach</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    3. User Accounts
                  </h3>
                  <p>To use the App, you must:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Create an account with accurate and complete information</li>
                    <li>Maintain the confidentiality of your login credentials</li>
                    <li>Be responsible for all activity under your account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    4. Public Visibility of Data
                  </h3>
                  <p>
                    Observations you submit may be displayed publicly, including on maps, websites,
                    or shared platforms. In many cases, observation data-including location, photos,
                    videos, and descriptions-will be visible to other users or the public.
                  </p>
                  <p>
                    If you submit observations anonymously, your identity may not be displayed, but
                    the content itself may still be public.
                  </p>
                  <p>You should not submit content you are not comfortable sharing publicly.</p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    5. User-Generated Content and License
                  </h3>
                  <p>You retain ownership of your content (“User Content”), including:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Text observations</li>
                    <li>Audio recordings and transcriptions</li>
                    <li>Photos and videos</li>
                    <li>Associated metadata (location, time, categories)</li>
                  </ul>
                  <p>
                    By submitting content, you grant WaterWays SEM, L3C a non-exclusive, worldwide,
                    royalty-free license to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Store, process, display, reproduce, and analyze content</li>
                    <li>Use content for conservation, research, education, and outreach</li>
                    <li>Share aggregated or anonymized data with partners</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    6. Acceptable Use
                  </h3>
                  <p>
                    You agree to use the App in a manner consistent with conservation objectives.
                  </p>
                  <p>You agree NOT to:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Submit false or misleading information</li>
                    <li>Upload illegal, offensive, or harmful content</li>
                    <li>Harass individuals or misuse the App for surveillance</li>
                    <li>Use the App to exploit natural resources or sensitive locations</li>
                    <li>Interfere with or misuse the App&apos;s functionality</li>
                  </ul>
                  <p className="text-[18px] text-neutral-950 mt-4">Ecological Protection</p>
                  <p>
                    You agree not to submit or share information in a manner that could reasonably
                    be expected to harm:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Sensitive ecosystems</li>
                    <li>Endangered or protected species</li>
                    <li>Cultural or historical resources</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    7. Enforcement and Right to Remove Content
                  </h3>
                  <p>
                    WaterWays SEM, L3C reserves the right, at its sole discretion and without prior
                    notice, to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Remove, modify, or restrict access to any content</li>
                    <li>Limit visibility of observations</li>
                    <li>Suspend or permanently terminate user accounts</li>
                  </ul>
                  <p>This includes content or behavior that:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Violates these Terms</li>
                    <li>Is inconsistent with conservation objectives</li>
                    <li>Is misleading, harmful, inappropriate, or unlawful</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    8. Information We Collect
                  </h3>
                  <p className="ml-4 mt-4 text-[15px] text-neutral-950">
                    A. Information You Provide
                  </p>
                  <ul className="ml-4 mt-2 list-disc space-y-1 pl-8">
                    <li>Account information (name, email, username)</li>
                    <li>Observations (text, audio, photos, videos)</li>
                    <li>Uploaded content and comments</li>
                  </ul>
                  <p className="ml-4 mt-4 text-[15px] text-neutral-950">
                    B. Automatically Collected Information
                  </p>
                  <ul className="ml-4 mt-2 list-disc space-y-1 pl-8">
                    <li>GPS location (latitude/longitude)</li>
                    <li>Date and time of observations</li>
                    <li>Basic device and system information</li>
                  </ul>
                  <p className="ml-4 mt-4 text-[15px] text-neutral-950">C. Derived Data</p>
                  <ul className="ml-4 mt-2 list-disc space-y-1 pl-8">
                    <li>Transcriptions of audio and video</li>
                    <li>Categorized observations</li>
                    <li>Aggregated datasets and analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    9. How We Use Information
                  </h3>
                  <p>We use your information to:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Operate core App features (recording, transcription, mapping, export)</li>
                    <li>Support conservation, research, and environmental management</li>
                    <li>Improve App functionality and performance</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    10. Data Sharing
                  </h3>
                  <p>WaterWays SEM, L3C does not sell personal data.</p>
                  <p>We may share data:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>With conservation organizations, researchers, and government agencies</li>
                    <li>With service providers (e.g., cloud hosting, transcription services)</li>
                    <li>When required by law</li>
                  </ul>
                  <p>Shared data may be aggregated or anonymized where appropriate.</p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    11. Sensitive Environmental Data Protection
                  </h3>
                  <p>To protect ecosystems, we may:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Obscure or generalize location data</li>
                    <li>Restrict access to certain observations</li>
                    <li>Remove data that could cause harm</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    12. Public Data and Government Use
                  </h3>
                  <p>Data collected through the App may:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Be used to support publicly funded conservation programs</li>
                    <li>Be shared with agencies and partners</li>
                    <li>Be subject to applicable public records laws</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    13. Data Accuracy Disclaimer
                  </h3>
                  <p>The App contains user-generated data that may be incomplete or inaccurate.</p>
                  <p>
                    The App is provided for informational and educational purposes only and should
                    not be relied upon for:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Navigation</li>
                    <li>Safety decisions</li>
                    <li>Legal determinations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    14. Data Retention
                  </h3>
                  <p>We retain data:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>While your account is active</li>
                    <li>As needed for conservation, research, and program purposes</li>
                    <li>As required by law or funding agreements</li>
                  </ul>
                  <p>Anonymized or aggregated data may be retained indefinitely.</p>
                  <p className="text-[18px] text-neutral-950 mt-4">Account Deletion</p>
                  <p>
                    Deleting your account does not automatically remove previously submitted
                    observations. These may remain visible unless separately requested and approved
                    for removal.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    15. Your Rights
                  </h3>
                  <p>You may:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Access and update your account information</li>
                    <li>Request account deletion</li>
                    <li>
                      Request deletion of observations (subject to review and conservation
                      considerations)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    16. Data Security
                  </h3>
                  <p>
                    We implement reasonable safeguards to protect your data. However, no system is
                    completely secure.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    17. Intellectual Property
                  </h3>
                  <p>
                    All App software, design, and functionality are owned by WaterWays SEM, L3C or
                    its licensors and are protected by law.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    18. Disclaimers
                  </h3>
                  <p>The App is provided “as is” without warranties of any kind.</p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    19. Limitation of Liability
                  </h3>
                  <p>
                    To the fullest extent permitted by law, WaterWays SEM, L3C is not liable for
                    damages resulting from:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Use of the App</li>
                    <li>Reliance on App data</li>
                    <li>Loss of data or access</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    20. Children&apos;s Privacy
                  </h3>
                  <p>The App is not intended for users under 13 years of age.</p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    21. Changes to These Terms
                  </h3>
                  <p>
                    WaterWays SEM, L3C may update these Terms at any time. Continued use of the App
                    constitutes acceptance of updates.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    22. Governing Law
                  </h3>
                  <p>These Terms are governed by the laws of the State of Michigan.</p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    23. Contact
                  </h3>
                  <p>WaterWays SEM, L3C</p>
                  <p>dmclaughlin@waterways-sem.com</p>
                  <p>Marcellus, Michigan</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
