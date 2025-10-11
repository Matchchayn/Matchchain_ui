interface StoriesProps {
  layout?: 'sidebar' | 'banner' | 'mobile'
}

export default function Stories({ layout = 'mobile' }: StoriesProps) {
  const stories = [
    { id: 'create', name: 'Create', avatar: null, isCreate: true },
    { id: '1', name: 'Heri', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Bethel', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', name: 'Glory', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', name: 'Solace', avatar: 'https://i.pravatar.cc/150?img=4' },
  ]

  // Mobile Layout
  if (layout === 'mobile') {
    return (
      <div className="bg-[#0a0a1f] py-4">
        {/* Stories/Avatars Section */}
        <div className="overflow-x-scroll scrollbar-hide mb-4 -mx-4 px-4 py-2" style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <div className="flex gap-3 sm:gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer min-w-[70px]"
              >
                {story.isCreate ? (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0a0a1f]"></div>
                    <img
                      src={story.avatar || ''}
                      alt={story.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                )}
                <span className="text-white text-[10px] sm:text-xs font-medium whitespace-nowrap text-center max-w-[70px] overflow-hidden text-ellipsis">{story.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promotional Banner */}
        <div className="px-4">
          <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-4 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-white text-base font-bold mb-1.5">
                Unlock the Future of Finance
              </h3>
              <p className="text-white/90 text-xs mb-3 leading-snug">
                Join live minds in crypto, blockchain, and Web3 for a day of insight, innovation, and
                real-world connection.
              </p>
              <button className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
                Register for event
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sidebar Layout (Stories List)
  if (layout === 'sidebar') {
    return (
      <div className="bg-[#1a1a2e] rounded-xl p-3">
        <h4 className="text-white font-semibold text-xs mb-2">Stories</h4>
        <div className="flex flex-col gap-2">
          {stories.map((story) => (
            <div
              key={story.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-[#0a0a1f] p-1.5 rounded-lg transition-colors"
            >
              {story.isCreate ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full ring-2 ring-purple-500 overflow-hidden flex-shrink-0">
                  <img
                    src={story.avatar || ''}
                    alt={story.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="text-white text-xs font-medium">{story.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Banner Layout (Promotional Banner Only)
  if (layout === 'banner') {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl p-3 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-white text-sm font-bold mb-1">
            Unlock the Future of Finance
          </h3>
          <p className="text-white/90 text-xs mb-2 leading-snug">
            Join live minds in crypto, blockchain, and Web3 for a day of insight.
          </p>
          <button className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs w-full">
            Register for event
          </button>
        </div>
      </div>
    )
  }

  return null
}

