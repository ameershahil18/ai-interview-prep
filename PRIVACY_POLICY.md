# Privacy Policy for AI Interview Prep Overlay

**Last Updated: January 11, 2026**

## 1. Data Collection
The "AI Interview Prep Overlay" extension **does not collect, store, or transmit** any of your personal data to the developer or any third-party analytics services. 

## 2. Local Processing
*   **Resume Data**: When you upload a resume, it is parsed locally within your browser using JavaScript libraries (pdf.js / mammoth.js). Your resume file and its contents never leave your device unless you explicitly trigger an AI analysis.
*   **Job Descriptions**: The extension reads the text of the webpage you are viewing (via `activeTab` or `scripting` permissions) solely to extract job descriptions for analysis.

## 3. AI Features & Third-Party Services (BYOK)
This extension operates on a **"Bring Your Own Key" (BYOK)** model. 
*   If you choose to use AI features (e.g., Google Gemini, OpenAI), the extension sends the job description and your resume text directly from your browser to the API of the provider you selected.
*   This data exchange happens directly between **You** and **The AI Provider**.
*   The developer of this extension does not have access to this data.
*   Please refer to the privacy policies of the AI provider you choose:
    *   [Google Gemini API Privacy](https://ai.google.dev/)
    *   [OpenAI Privacy Policy](https://openai.com/privacy)

## 4. Data Storage
*   Your API keys and parsed resume text are stored locally in your browser's `chrome.storage.local` api.
*   This data remains on your device and is removed if you uninstall the extension or clear your browser data.

## 5. Contact
If you have questions about this policy, please contact us via the support link on the Chrome Web Store.
