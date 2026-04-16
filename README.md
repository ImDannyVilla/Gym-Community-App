# Gym Community App

Workout tracking and gym community platform for Iron Arms Gym

The website is made for gym owners to access, view, and manage customer information quickly and efficiently.

The app is made for gym customers who wish to access their barcode digitally, with added features that allow for customer interactions. 

## Backend Setup
```bash
cd backend
uv sync
cp .env.example .env   # Then fill in real values
uv run uvicorn app.app:app --reload
```

API Docs: http://localhost:8000/docs

## Frontend Setup

### Package Requirements
Java Development Kit: Version 17  
React: 19.1.0  
React Native: 0.81.5   
Expo: 54.0.33  
Package Manager: npm (Node Package Manager)  
Emulator: Android Studio  

### Running the App

1. Open Android Studio
2. Click the "Device Manager" icon on the right
3. Click the "+" -> "Create Virtual Device"
4. Choose Phone Model
5. Finish

## Setting up Environment Variables
# Windows 
1. **Locate your Android SDK Platform-Tools folder.**
   * By default, Android Studio installs this at: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk\platform-tools`
   * *(Note: `AppData` is a hidden folder. You can type `%LOCALAPPDATA%\Android\Sdk\platform-tools` directly into the File Explorer address bar to find it).*
2. **Open Environment Variables.**
   * Press the **Windows Key**, type `Environment Variables`, and select **Edit the system environment variables**.
3. **Edit the Path variable.**
   * In the System Properties window, click the **Environment Variables...** button at the bottom.
   * Under the "User variables for [YourName]" section, find and select the variable named `Path`, then click **Edit...**.
4. **Add the new path.**
   * Click **New**, and paste the full path to your `platform-tools` folder (e.g., `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk\platform-tools`).
5. **Save and Apply.**
   * Click **OK** on all three windows to save your changes.
6. **Restart your terminal.**
   * Close any open Command Prompt, PowerShell, or VS Code terminals and open a new one. Type `adb devices` to verify it works.

# Linux
1. **Locate your Android SDK Platform-Tools folder.**
   * By default, Android Studio installs this at: `~/Android/Sdk/platform-tools`
2. **Open your shell profile file.**
   * Depending on your shell, this will usually be `~/.bashrc` or `~/.zshrc`.
   * Open your terminal and use a text editor to open the file, for example: `nano ~/.bashrc`
3. **Add the export path command.**
   * Scroll to the very bottom of the file and add the following line:
     ```bash
     export PATH=$PATH:~/Android/Sdk/platform-tools
     ```
4. **Save the file.**
5. **Apply the changes.**
   * To make the changes take effect immediately in your current terminal, run:
     ```bash
     source ~/.bashrc
     ```
     *(Replace `.bashrc` with `.zshrc` if you are using Zsh).*
6. **Verify.**
   * Type `adb devices` in your terminal to ensure the command is recognized.


--- 

```bash
cd Frontend-For-APP
npm install
npx expo start
```

## Team

- Backend: Danny, Omar
- Frontend: Mariano, Omar, Still Ben
- UI/Design: Mariano
- DevOps: Alberto
- PM: Angel
