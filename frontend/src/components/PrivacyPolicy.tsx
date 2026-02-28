import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    const sections = [
        {
            icon: '🔒',
            title: '1. Information We Collect',
            content: [
                {
                    subtitle: 'Personal Information',
                    text: 'When you create a Matchchayn account, we collect your name, email address, date of birth, gender, city, country, and relationship status. We also collect photos, videos, and biographical information you choose to share on your profile.'
                },
                {
                    subtitle: 'Usage Data',
                    text: 'We automatically collect information about how you interact with our platform, including your IP address, device type, browser type, pages visited, features used, timestamps, and interaction patterns such as likes, matches, and messages.'
                },
                {
                    subtitle: 'Blockchain Data',
                    text: 'If you connect a cryptocurrency wallet, we may collect your public wallet address. Please note that blockchain transactions are publicly visible and immutable. We do not store your private keys or seed phrases.'
                }
            ]
        },
        {
            icon: '📊',
            title: '2. How We Use Your Information',
            content: [
                {
                    subtitle: 'Core Service Delivery',
                    text: 'We use your data to create and manage your account, generate matches based on your preferences and interests, enable communication between matched users, and deliver notifications about matches, likes, and messages.'
                },
                {
                    subtitle: 'Platform Improvement',
                    text: 'We analyze aggregated and anonymized usage data to improve our matching algorithms, enhance user experience, identify and fix technical issues, and develop new features.'
                },
                {
                    subtitle: 'Safety & Security',
                    text: 'We use your information to verify accounts via email OTP, detect and prevent fraudulent activity, enforce our Terms of Service and community guidelines, and protect the safety of our users.'
                }
            ]
        },
        {
            icon: '🤝',
            title: '3. Information Sharing',
            content: [
                {
                    subtitle: 'With Other Users',
                    text: 'Your profile information (name, photos, bio, interests, city) is visible to other Matchchayn users. Your exact email address and account settings are never shared with other users.'
                },
                {
                    subtitle: 'With Service Providers',
                    text: 'We work with trusted third-party providers for cloud storage (Cloudflare R2), email delivery (Resend), database hosting (MongoDB Atlas), and authentication services. These providers only access data necessary to perform their services and are bound by confidentiality agreements.'
                },
                {
                    subtitle: 'Legal Requirements',
                    text: 'We may disclose your information if required by law, subpoena, or court order, or if we believe in good faith that disclosure is necessary to protect the safety of our users or the public.'
                }
            ]
        },
        {
            icon: '🛡️',
            title: '4. Data Security',
            content: [
                {
                    subtitle: 'Encryption & Storage',
                    text: 'All passwords are hashed using bcrypt before storage. Data transmitted between your device and our servers is encrypted using TLS/SSL. We implement industry-standard security measures including JWT-based authentication with automatic token expiration.'
                },
                {
                    subtitle: 'Access Controls',
                    text: 'Access to user data is strictly limited to authorized personnel. We conduct regular security reviews and implement rate limiting on sensitive endpoints such as OTP requests and password resets to prevent abuse.'
                }
            ]
        },
        {
            icon: '⛓️',
            title: '5. Blockchain & Web3 Considerations',
            content: [
                {
                    subtitle: 'On-Chain Transactions',
                    text: 'Certain features may involve interactions with public blockchain networks (e.g., Solana). All blockchain transactions are permanent, publicly viewable, and cannot be deleted or modified by Matchchayn or any other party.'
                },
                {
                    subtitle: 'Wallet Responsibility',
                    text: 'You are solely responsible for the security of your cryptocurrency wallet, including your private keys and seed phrases. Matchchayn will never ask for your private keys. Lost wallet credentials cannot be recovered by Matchchayn.'
                }
            ]
        },
        {
            icon: '🍪',
            title: '6. Cookies & Local Storage',
            content: [
                {
                    subtitle: 'What We Store',
                    text: 'We use browser local storage to maintain your authentication session (JWT token), remember your preferences, and cache your profile data for a seamless experience. We do not use third-party tracking cookies.'
                },
                {
                    subtitle: 'Your Control',
                    text: 'You can clear your local storage at any time through your browser settings. Doing so will log you out of Matchchayn and require you to sign in again.'
                }
            ]
        },
        {
            icon: '✨',
            title: '7. Your Rights & Choices',
            content: [
                {
                    subtitle: 'Access & Correction',
                    text: 'You can view and update your personal information at any time through your Profile Settings page. This includes your name, photos, bio, interests, and preferences.'
                },
                {
                    subtitle: 'Account Deletion',
                    text: 'You may request complete deletion of your account and associated data by contacting us at support@matchchayn.com. Upon deletion, your profile, messages, and matches will be permanently removed. Note: Blockchain transactions cannot be reversed.'
                },
                {
                    subtitle: 'Communication Preferences',
                    text: 'You can manage your notification preferences within the app. You may opt out of non-essential communications at any time, though we may still send critical security and account-related notifications.'
                }
            ]
        },
        {
            icon: '👶',
            title: '8. Age Requirements',
            content: [
                {
                    subtitle: 'Minimum Age',
                    text: 'Matchchayn is strictly for users aged 18 and older. We do not knowingly collect or solicit personal information from anyone under the age of 18. If we learn that we have collected data from a minor, we will delete that information immediately.'
                }
            ]
        },
        {
            icon: '🌍',
            title: '9. International Data Transfers',
            content: [
                {
                    subtitle: 'Global Operations',
                    text: 'Matchchayn operates globally and your data may be processed in countries outside your country of residence. We implement appropriate safeguards to ensure your data receives adequate protection regardless of where it is processed.'
                }
            ]
        },
        {
            icon: '📝',
            title: '10. Changes to This Policy',
            content: [
                {
                    subtitle: 'Updates',
                    text: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting an in-app notification or sending an email to the address associated with your account. Your continued use of Matchchayn after any changes indicates your acceptance of the updated policy.'
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#090a1e] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-[80px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
                >
                    <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">Back</span>
                </button>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 mb-6">
                        <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                        Privacy <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">&amp; Policy</span>
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
                        Your privacy matters to us. This policy explains how Matchchayn collects, uses, protects, and shares your personal information.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Last Updated: February 28, 2026</span>
                    </div>
                </div>

                {/* Quick Summary Card */}
                <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-2xl p-5 sm:p-6 mb-10">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-1">Quick Summary</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                We collect only what's needed to provide our dating platform. Your data is encrypted, never sold, and you can delete your account at any time. Blockchain interactions are public and permanent by nature.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Policy Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className="bg-[#12132b]/80 border border-purple-500/10 rounded-2xl overflow-hidden hover:border-purple-500/25 transition-all duration-300"
                        >
                            {/* Section Header */}
                            <div className="flex items-center gap-3 p-5 sm:p-6 pb-3 sm:pb-4">
                                <span className="text-2xl" role="img">{section.icon}</span>
                                <h2 className="text-lg sm:text-xl font-bold text-white">{section.title}</h2>
                            </div>

                            {/* Section Content */}
                            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
                                {section.content.map((item, itemIndex) => (
                                    <div key={itemIndex} className="relative pl-4 border-l-2 border-purple-500/20">
                                        <h3 className="text-sm font-semibold text-purple-300 mb-1">{item.subtitle}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Section */}
                <div className="mt-10 bg-gradient-to-br from-[#1a1a2e] to-[#12132b] border border-purple-500/20 rounded-2xl p-6 sm:p-8 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/20 mb-4">
                        <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Questions or Concerns?</h3>
                    <p className="text-gray-400 text-sm mb-5 max-w-md mx-auto">
                        If you have any questions about this Privacy Policy or how we handle your data, don't hesitate to reach out.
                    </p>
                    <a
                        href="mailto:support@matchchayn.com"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/25 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        support@matchchayn.com
                    </a>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-gray-600">
                    <p>© {new Date().getFullYear()} Matchchayn. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
