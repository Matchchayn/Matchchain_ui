import { useState, useCallback } from "react";
import {
  VideoTrack,
  AudioTrack,
  useStreamRoom,
  ParticipantSortStrategy,
} from "@vidbloq/react";

export default function MeetingRoom() {
  const meeting = useStreamRoom({
    defaultSortStrategy: ParticipantSortStrategy.DEFAULT,
    enableSpeakerEvents: true,
    autoPromoteActiveSpeakers: false,
  });

  const [hoveredParticipant, setHoveredParticipant] = useState(null);

  // Get participants (max 3)
  const participants = meeting.participants.all.slice(0, 3);
  const localParticipant = meeting.participants.local;

  // Get tracks for a participant
  const getParticipantTracks = useCallback((participant: any) => {
    if (!participant) return { video: null, audio: null };

    const tracks = meeting.getParticipantTracks(participant.identity);
    const videoTrack = tracks.find(t =>
      t.source === "camera" || t.source === "Camera"
    );
    const audioTrack = tracks.find(t =>
      t.source === "microphone" || t.source === "Microphone"
    );

    return { video: videoTrack, audio: audioTrack };
  }, [meeting]);

  // Parse participant metadata
  const getParticipantInfo = (participant: any) => {
    if (!participant) return { name: "Unknown", initials: "?" };

    try {
      const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};
      const name = metadata.userName || participant.identity || "Unknown";
      const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
      return {
        name,
        initials,
        avatarUrl: metadata.avatarUrl
      };
    } catch {
      return { name: participant.identity || "Unknown", initials: "?" };
    }
  };

  // Render single participant frame
  const renderParticipantFrame = (participant: any, layoutStyle = {}) => {
    if (!participant) return null;
    
    const { video, audio } = getParticipantTracks(participant);
    const info = getParticipantInfo(participant);
    const isLocal = participant.identity === localParticipant?.identity;
    const isSpeaking = meeting.isParticipantSpeaking(participant.identity);
    const isVideoOn = video?.publication && !video.publication.isMuted;
    const isHovered = hoveredParticipant === participant.identity;
    
    return (
      <div
        className="relative h-full w-full transition-all duration-500"
        style={layoutStyle}
        onMouseEnter={() => setHoveredParticipant(participant.identity)}
        onMouseLeave={() => setHoveredParticipant(null)}
      >
        {/* Frame with brand color border when speaking */}
        <div className={`relative w-full h-full rounded-2xl overflow-hidden
          ${isSpeaking ? 'ring-4 ring-[#FF6B35]' : 'ring-1 ring-gray-700'}
          ${isHovered ? 'scale-[1.02]' : ''}
          transition-all duration-300`}>
          
          {/* Video or avatar background */}
          <div className="absolute inset-0 bg-[#1a1a2e]">
            {isVideoOn && video ? (
              <VideoTrack
                trackRef={video}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {/* Avatar with brand color accent */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] 
                    flex items-center justify-center shadow-2xl">
                    {info.avatarUrl ? (
                      <img 
                        src={info.avatarUrl} 
                        alt={info.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white text-5xl font-bold">{info.initials}</span>
                    )}
                  </div>
                  {/* Camera off indicator */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full 
                    bg-gray-800 border-2 border-[#1a1a2e] flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Audio track */}
          {audio && <AudioTrack trackRef={audio} />}
          
          {/* Name overlay with brand styling */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-lg">{info.name}</span>
                {isLocal && (
                  <span className="text-xs text-[#FF6B35] bg-[#FF6B35]/20 px-2 py-1 rounded-full">
                    You
                  </span>
                )}
              </div>
              
              {/* Audio indicator */}
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-3 bg-[#FF6B35] rounded-full animate-pulse" />
                  <div className="w-1 h-4 bg-[#FF6B35] rounded-full animate-pulse animation-delay-100" />
                  <div className="w-1 h-3 bg-[#FF6B35] rounded-full animate-pulse animation-delay-200" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Layout logic based on participant count
  const renderLayout = () => {
    const count = participants.length;
    
    if (count === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] 
              flex items-center justify-center mx-auto mb-4">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a6 6 0 00-6 6v0a1 1 0 001 1h10a1 1 0 001-1v0a6 6 0 00-6-6z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">Waiting for participants to join...</p>
          </div>
        </div>
      );
    } else if (count === 1) {
      // Single participant - full screen with padding
      return (
        <div className="h-full w-full p-8">
          {renderParticipantFrame(participants[0])}
        </div>
      );
    } else if (count === 2) {
      // Two participants - responsive layout
      return (
        <div className="h-full w-full p-4 sm:!p-6 flex flex-col sm:!flex-row gap-4 sm:!gap-6">
          <div className="flex-1 h-1/2 sm:!h-full">
            {renderParticipantFrame(participants[0])}
          </div>
          <div className="flex-1 h-1/2 sm:!h-full">
            {renderParticipantFrame(participants[1])}
          </div>
        </div>
      );
    } else if (count === 3) {
      // Three participants - responsive grid
      return (
        <div className="h-full w-full p-4 sm:p-6">
          <div className="h-full flex flex-col gap-4 sm:gap-6">
            {/* Mobile: stack all three vertically */}
            {/* Desktop: one on top, two on bottom */}
            <div className="flex-1 sm:flex-[2]">
              {renderParticipantFrame(participants[0])}
            </div>
            <div className="flex-1 sm:flex-[1] flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex-1 h-1/2 sm:h-full">
                {renderParticipantFrame(participants[1])}
              </div>
              <div className="flex-1 h-1/2 sm:h-full">
                {renderParticipantFrame(participants[2])}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="relative h-full w-full bg-[#0f0f1e] overflow-hidden">
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-transparent to-[#FF6B35]/5 pointer-events-none" />
      
      {/* Main content */}
      <div className="relative z-10 h-full">
        {renderLayout()}
      </div>

    </div>
  );
}