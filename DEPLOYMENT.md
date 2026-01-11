# Deployment & GitHub Guide

## 1. GitHub Setup (Source Control)

To save your project to GitHub, follow these commands in your **Terminal**. I have already created a `.gitignore` file to keep it clean.

### **Step 1: Initialize Git**
Run these commands in your project folder:
```bash
git init
git add .
git commit -m "Initial commit: AI Interview Prep Extension"
```

### **Step 2: Push to GitHub**
1. Go to [github.com/new](https://github.com/new).
2. Create a repository named `ai-interview-prep-extension`.
3. Copy the URL (e.g., `https://github.com/username/ai-interview-prep-extension.git`).
4. Run:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-interview-prep-extension.git
git push -u origin main
```

---

## 2. Chrome Web Store Deployment

To publish your extension for the world to use:

### **Step 1: Prepare the Package**
1. **Open `manifest.json`**: Ensure the `version` (currently `1.0.0`) is correct.
2. **Create Zip**: Select all files in your folder (excluding `.git`, `node_modules`) and compress them into a `.zip` file.
   - **Mac**: Select files -> Right Click -> "Compress"
   - **Terminal**: `zip -r extension.zip . -x "*.git*" "*.DS_Store*"`

### **Step 2: Developer Dashboard**
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/dev/dashboard).
2. Pay the **$5 one-time developer fee** (if you haven't already).
3. Click **"New Item"** -> Upload your `extension.zip`.

### **Step 3: Store Listing**
Fill in the required fields:
- **Description**: "AI-powered resume optimizer and interview prep tool..."
- **Screenshots**: Take 1-2 screenshots of the popup in action. 1280x800 is best.
- **Category**: "Productivity" or "Search Tools".
- **Privacy Policy**: since we don't collect data seamlessly, you can state that "Data is processed locally or sent directly to the user's chosen AI provider."

### **Step 4: Publish**
- Click **"Submit for Review"**.
- Review usually takes **24-48 hours**.

---

## monetization Tips (Optional)
If you marked it as "Paid" or "In-App Purchases":
1. You successfully implemented the **BYOK (Bring Your Own Key)** model. 
2. This allows you to publish it as a **Free Tool** that offers **Premium Power** to those with keys.
3. This is the safest way to launch without managing payment backends immediately.
