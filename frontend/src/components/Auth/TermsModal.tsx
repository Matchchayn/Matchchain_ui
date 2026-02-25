import { createPortal } from 'react-dom';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-[#1a1a2e] border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-purple-500/20 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Terms and Conditions</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6 text-gray-300 text-sm leading-relaxed">
                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h3>
                        <p>By accessing and using Matchchayn, you confirm that you are at least 18 years old and legally permitted to enter into this agreement. Matchchayn is a blockchain-based dating platform designed to foster meaningful connections.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">2. User Conduct & Safety</h3>
                        <p>You agree to interact respectfully with other members. Harassment, abuse, hate speech, explicit unsolicited content, and fraudulent behavior are strictly prohibited and will result in immediate termination of your account. You are solely responsible for your interactions with other users.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">3. Data Privacy & Blockchain</h3>
                        <p>We respect your privacy. All traditional data adheres to our Privacy Policy. However, note that interactions explicitly marked as "on-chain" or utilizing cryptocurrency wallets permanently interact with public ledgers. You are responsible for safeguarding your wallet credentials and seed phrases.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">4. Content Ownership</h3>
                        <p>You retain ownership of the content you post. However, by uploading content (photos, videos, bios), you grant Matchchayn a worldwide, royalty-free license to use, display, and distribute said content strictly for the operational purposes of the platform.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">5. Matches & Premium Features</h3>
                        <p>Certain features may require the use of tokens (e.g., SOL or internal platform assets). All on-chain transactions are final and non-refundable. Matchchayn makes no guarantees regarding the frequency or quality of matches.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">6. Limitation of Liability</h3>
                        <p>Matchchayn is not responsible for the conduct of any user on or off the platform. We do not conduct criminal background checks. You agree to use caution in all interactions with other users, particularly if deciding to meet offline.</p>
                    </section>
                </div>

                <div className="p-6 border-t border-purple-500/20 bg-[#0a0a1f] flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-full text-gray-300 hover:bg-white/5 font-medium transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => {
                            onAccept();
                            onClose();
                        }}
                        className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-lg shadow-purple-500/25 active:scale-95"
                    >
                        I Accept
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
