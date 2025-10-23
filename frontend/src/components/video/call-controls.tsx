import { useState, useCallback } from "react";
import {
  BaseCallControls,
  MicrophoneControl,
  CameraControl,
  type CallControlsRenderProps,
} from "@vidbloq/react";

type CallControlsProps = {
  onDisconnect?: () => void;
  onChatToggle?: () => void;
  onReactionsToggle?: () => void;
};

/**
 * Minimal CallControls with just 5 buttons
 * Uses BaseCallControls and SDK control components for proper functionality
 */
const CallControls = ({
  onDisconnect,
  onChatToggle,
  onReactionsToggle,
}: CallControlsProps) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleReactionsToggle = useCallback(() => {
    setShowReactions(!showReactions);
    onReactionsToggle?.();
  }, [showReactions, onReactionsToggle]);

  const handleChatToggle = useCallback(() => {
    setShowChat(!showChat);
    onChatToggle?.();
  }, [showChat, onChatToggle]);

  return (
    <BaseCallControls
      onDisconnect={onDisconnect}
      render={(props: CallControlsRenderProps) => {
        const {
          handleDisconnectClick,
          toggleMic,
          toggleCamera,
          canAccessMediaControls,
        } = props;

        return (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none">
            <div className="flex items-center justify-center pointer-events-auto">
              {/* Control bar with brand styling */}
              <div className="bg-[#1a1a2e]/95 backdrop-blur-lg rounded-full px-1.5 sm:px-2 py-1.5 sm:py-2 
                shadow-2xl border border-gray-800/50 flex items-center gap-1 sm:gap-2">
                
                {/* Microphone button using SDK component */}
                {canAccessMediaControls && toggleMic && (
                  <div className="microphone-control-wrapper">
                    <MicrophoneControl 
                      showLabel={false}
                      className="!bg-transparent"
                    />
                  </div>
                )}

                {/* Camera button using SDK component */}
                {canAccessMediaControls && toggleCamera && (
                  <div className="camera-control-wrapper">
                    <CameraControl 
                      showLabel={false}
                      className="!bg-transparent"
                      onError={(error) => console.error("Camera error:", error)}
                    />
                  </div>
                )}

                {/* Divider */}
                <div className="w-px h-6 sm:h-8 bg-gray-700/50 mx-0.5 sm:mx-1" />

                {/* Reactions button */}
                <button
                  onClick={handleReactionsToggle}
                  className={`p-3 sm:p-4 rounded-full transition-all duration-300 group
                    ${showReactions 
                      ? 'bg-[#FF6B35]/20 scale-110' 
                      : 'bg-gray-800/60 hover:bg-gray-700/60 hover:scale-105'}`}
                  title="Show reactions"
                >
                  <span className="text-xl sm:text-2xl">😊</span>
                </button>

                {/* Chat button */}
                <button
                  onClick={handleChatToggle}
                  className={`relative p-3 sm:p-4 rounded-full transition-all duration-300 group
                    ${showChat 
                      ? 'bg-[#FF6B35]/20' 
                      : 'bg-gray-800/60 hover:bg-gray-700/60'}`}
                  title="Open chat"
                >
                  <svg 
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      showChat ? 'text-[#FF6B35]' : 'text-white group-hover:text-[#FF6B35]'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  
                  {/* Active indicator dot */}
                  {showChat && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse" />
                  )}
                </button>

                {/* Divider */}
                <div className="w-px h-6 sm:h-8 bg-gray-700/50 mx-0.5 sm:mx-1" />

                {/* End call button */}
                {handleDisconnectClick && (
                  <button
                    onClick={handleDisconnectClick}
                    className="p-3 sm:p-4 bg-red-500 hover:bg-red-600 text-white rounded-full 
                      shadow-lg hover:shadow-xl transition-all duration-300 group ml-1 sm:ml-2"
                    title="End call"
                  >
                    <svg 
                      className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

export default CallControls;