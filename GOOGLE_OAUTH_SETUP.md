# Google OAuth Setup for Matchchayn

To enable Google Login, you need to configure your Google Cloud Console and add your Client ID to the project.

### 1. Google Cloud Console Configuration
Go to the [Google Cloud Console](https://console.cloud.google.com/) and follow these steps:

1.  **Create a New Project** (or select an existing one).
2.  Navigate to **APIs & Services > Credentials**.
3.  Click **Create Credentials > OAuth client ID**.
4.  If prompted, configure the **OAuth consent screen** (Internal or External).
5.  Set **Application type** to `Web application`.
6.  Add the following to **Authorized JavaScript origins**:
    - `http://localhost:5173`
7.  Add the following to **Authorized redirect URIs**:
    - `http://localhost:5173`
8.  Click **Create**. You will receive a **Client ID** and **Client Secret**.

### 2. Environment Variables
Add your Client ID to the following files:

#### Frontend (`frontend/.env`)
Create this file if it doesn't exist and add:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

#### Backend (`backend/.env`)
Add your Client ID to your existing `.env` file:
```env
GOOGLE_CLIENT_ID=your_client_id_here
```

### 3. Usage
Once you provide the Client ID in the `.env` files, the "Continue with Google" button will become functional.
