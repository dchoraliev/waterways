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
                Terms and Conditions
              </h2>
              <div className="space-y-5 text-[#717182] font-['Arimo',_sans-serif] text-[16px] leading-[24px]">
                <p className="italic text-sm">Last updated: 4/1/2026</p>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    1. About This App
                  </h3>
                  <p>
                    Watershed Delta Escalator is operated by WaterWays|SEM, L3C. The app allows
                    users to submit observations about waterways, including text, audio, photos,
                    videos, and location data for conservation, research, and public awareness.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    2. User Submissions
                  </h3>
                  <p>
                    You keep ownership of your content. However, you grant us a non-exclusive,
                    worldwide, royalty-free license to use, store, display, and share it for
                    conservation and public purposes, including displaying submissions on public
                    maps or websites.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    3. Public Visibility
                  </h3>
                  <p>
                    Observations and location information will be publicly displayed. Even if you
                    submit anonymously, the content remains public. Do not submit anything you are
                    not comfortable sharing.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    4. Voice Recording Feature
                  </h3>
                  <p>
                    The app listens for the wake word &quot;Wade&quot; and records audio to
                    transcribe observations. By using this feature, you consent to recording and are
                    responsible for ensuring you have permission to record in your environment.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    5. Accuracy &amp; Liability
                  </h3>
                  <p>
                    We do not guarantee the accuracy of user-submitted data. The app is for
                    informational purposes only and should not be used for navigation or safety
                    decisions. Watershed Delta Escalator is not responsible for damages resulting
                    from use of the app.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-[#e5e5e5]" />

            {/* Privacy Section */}
            <section id="privacy" className="scroll-mt-24">
              <h2 className="font-['Arimo',_sans-serif] font-normal leading-[32px] text-[28px] text-neutral-950 mb-4">
                Privacy Policy
              </h2>
              <div className="space-y-5 text-[#717182] font-['Arimo',_sans-serif] text-[16px] leading-[24px]">
                <p className="italic text-sm">Last updated: 4/1/2026</p>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    1. What We Collect
                  </h3>
                  <p>
                    We collect observations (media and text), location data, and account information
                    (name/email). We also collect audio recordings and transcriptions triggered by
                    the wake word &quot;Wade.&quot;
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    2. Data Sharing &amp; Usage
                  </h3>
                  <p>
                    We do not sell your personal data. We share data with researchers, partners, or
                    the public for conservation purposes, and with service providers necessary to
                    operate the app.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    3. Your Choices
                  </h3>
                  <p>
                    You may submit observations anonymously or delete your account. While you can
                    request deletion of observations by contacting us, please note that observations
                    typically remain visible on the public map even after account deletion.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    4. Children&apos;s Privacy
                  </h3>
                  <p>
                    This app is not intended for children under 13, and we do not knowingly collect
                    their data.
                  </p>
                </div>

                <div>
                  <h3 className="text-[18px] font-normal text-neutral-950 mb-2 mt-6">
                    5. Contact Us
                  </h3>
                  <p>
                    For questions or data requests, please contact:{' '}
                    <strong>dmclaughlin@waterways-sem.com</strong>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
