# MatchChayn

**Relax. Connect. Match.**

MatchChayn is a Web3-enabled social dating and networking platform built on the Solana blockchain. It combines traditional dating app mechanics (swiping, matching) with modern Web3 features (wallet login, token-gating potential) and real-time communication tools (chat and video).

## 🚀 Features

### Core Social Experience

  * **Discovery & Matching**: Swipe-based interface to like or pass on profiles based on compatibility algorithms (Age, Distance, Gender).
  * **Real-time Chat**: Instant messaging with matched users, including read receipts and online status indicators.
  * **Multimedia Sharing**: Send images and attachments within chats.
  * **Video Calling**: Integrated high-quality video calls using Vidbloq/LiveKit.
  * **Ghost Mode**: Privacy feature allowing users to browse without being visible in the discovery stack.

### Onboarding & Profile

  * **Comprehensive Onboarding**: Guided flow for profile creation, interest selection, and preference settings.
  * **Rich Media Profiles**: Users can upload intro videos and photo galleries.
  * **Advanced Preferences**: Filter matches by distance, age range, height, and relationship goals.

### Web3 Integration

  * **Solana Wallet Adapter**: Connect using Phantom, Solflare, and other Solana wallets.
  * **On-Chain Identity**: Leverage wallet addresses for authentication and identity verification.

## 🛠️ Tech Stack

  * **Frontend Framework**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
  * **Build Tool**: [Vite](https://vitejs.dev/)
  * **Styling**: [Tailwind CSS](https://tailwindcss.com/)
  * **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
  * **Blockchain**: [Solana Web3.js](https://www.google.com/search?q=https://solana-labs.github.io/solana-web3.js/) & Wallet Adapter
  * **Video Infrastructure**: [Vidbloq](https://www.google.com/search?q=https://vidbloq.com/) / LiveKit
  * **Icons**: Lucide React

## 📦 Prerequisites

  * Node.js (v18 or higher)
  * npm or yarn
  * A Supabase project
  * A Vidbloq API Key

## cd Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/matchchayn.git
    cd matchchayn
    ```

2.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

3.  **Install dependencies:**

    ```bash
    npm install
    ```

4.  **Environment Setup:**
    Create a `.env` file in the `frontend` directory based on the following template:

    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_KEY=your_supabase_anon_key

    # Optional: Custom RPC for better performance
    VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR-API-KEY
    ```

## 🗄️ Database Setup (Supabase)

To run this app, your Supabase project requires specific tables. You can run the following SQL in your Supabase SQL Editor:

### Core Tables

  * `Profile`: Stores user details (bio, demographics, ghost mode status).
  * `user_interests`: Links users to specific interest tags.
  * `user_preferences`: Stores matching criteria (age range, distance, etc).
  * `user_media`: Stores photos and intro videos.
  * `user_likes`: Tracks swipes and likes.
  * `matches`: Stores mutual connections.

### Chat System

  * `conversations`: Tracks active chat rooms between two users.
  * `messages`: Stores individual chat messages.
  * `user_presence`: Tracks online/offline status.

### Storage Buckets

Ensure the following public buckets exist in Supabase Storage:

  * `avatars`
  * `user-videos`
  * `message_attachments`

## 🏃‍♂️ Running the App

**Development Server:**

```bash
npm run dev
```

Open [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173) to view it in the browser.

**Production Build:**

```bash
npm run build
```

## 👻 Ghost Mode

Ghost Mode allows users to become invisible to others while retaining the ability to browse and interact with the app.

  * **To Enable:** Go to **Settings \> Profile Settings**, scroll to the bottom, and toggle "Ghost Mode".
  * **Behavior:** When enabled, your profile is excluded from other users' discovery stacks (`fetchMatchingProfiles`), but you can still swipe on others and chat with existing matches.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

