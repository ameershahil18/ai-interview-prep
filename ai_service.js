/**
 * AI Service Abstraction
 * Currently uses high-fidelity mock data.
 * Ready for API integration (OpenAI/Gemini).
 */

class AIService {
    constructor() {
        this.apiKey = "";
        this.provider = "gemini"; // 'gemini', 'openai', 'custom'
        this.customBaseUrl = "";
        this.customModel = "";
    }

    async callAI(systemPrompt, userPrompt) {
        // Validation: API Key is required ONLY for Cloud Providers
        if (this.provider === 'gemini' || this.provider === 'openai') {
            if (!this.apiKey) throw new Error("API Key is missing. Please check settings.");
        }

        if (this.provider === 'gemini') {
            return this.callGemini(systemPrompt, userPrompt);
        } else if (this.provider === 'openai' || this.provider === 'custom' || this.provider === 'ollama') {
            return this.callOpenAICompatible(systemPrompt, userPrompt);
        } else {
            throw new Error(`Unknown provider: ${this.provider}`);
        }
    }

    async callOpenAICompatible(systemPrompt, userPrompt) {
        let url = "https://api.openai.com/v1/chat/completions";
        let model = "gpt-3.5-turbo";

        if (this.provider === 'custom' || this.provider === 'ollama') {
            // Default to Ollama URL if not set
            const baseUrl = this.customBaseUrl || "http://localhost:11434/v1";

            // Normalize URL
            if (baseUrl.endsWith('/chat/completions')) {
                url = baseUrl;
            } else if (baseUrl.endsWith('/')) {
                url = `${baseUrl}chat/completions`;
            } else {
                url = `${baseUrl}/chat/completions`;
            }

            model = this.customModel || "llama3";
        }

        const headers = {
            "Content-Type": "application/json"
        };
        // Only attach Authorization if an API Key exists (Ollama doesn't need it)
        if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`AI Error (${response.status}): ${errBody}`);
            }

            const data = await response.json();
            // Handle different response structures if needed, but Ollama simulates OpenAI
            return data.choices[0].message.content;
        } catch (error) {
            if (this.provider === 'ollama' && error.message.includes('Failed to fetch')) {
                throw new Error("Could not connect to Ollama. Make sure it's running and 'OLLAMA_ORIGIN=\"*\"' is set.");
            }
            throw error;
        }
    }

    async callGemini(systemPrompt, userPrompt) {
        if (!this.apiKey) {
            throw new Error("API Key is missing. Please set it in the extension settings.");
        }

        try {
            // Using Gemini 1.5 Flash (Free Tier friendly)
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

            const payload = {
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nUser Request: ${userPrompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    response_mime_type: "application/json"
                }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Gemini Request Failed');
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            return text;
        } catch (e) {
            console.error("Gemini Call Failed:", e);
            throw e;
        }
    }

    async analyzeJob(jobText) {
        const safeText = jobText.substring(0, 12000);
        const prompt = `Analyze this job description. Return JSON with:
        {
            "summary": "Brief 2-3 sentence summary",
            "expectations": "Key expectations",
            "techStack": ["Tech 1", "Tech 2"]
        }`;

        const jsonStr = await this.callAI(prompt, safeText);
        return this.cleanJson(jsonStr);
    }

    async generateQuestions(jobText) {
        const safeText = jobText.substring(0, 12000);
        const prompt = `Generate 5 technical interview questions based on this job description. Return JSON array:
        [
            { "category": "Topic", "question": "Question text" }
        ]`;

        const jsonStr = await this.callAI(prompt, safeText);
        return this.cleanJson(jsonStr);
    }

    async generateStarAnswers(jobText) {
        const safeText = jobText.substring(0, 12000);
        const prompt = `Generate 2 STAR method examples relevant to this job. Return JSON array:
        [
            { "situation": "Situation...", "task": "Task...", "action": "Action...", "result": "Result..." }
        ]`;

        const jsonStr = await this.callAI(prompt, safeText);
        return this.cleanJson(jsonStr);
    }

    async checkSkills(jobText, userResume) {
        const safeText = jobText.substring(0, 8000);
        const safeResume = userResume ? userResume.substring(0, 4000) : "No resume provided.";

        const systemPrompt = `You are a strict ATS (Applicant Tracking System) Auditor. Compare the resume against the job description using rigorous keyword matching logic.
        
        Methodology:
        1. Calculate Match % based on exact keyword presence from the JD in the Resume.
        2. ATS Score (0-100) is a weighted calculation:
           - 40% Key Hard Skills (e.g. React, Python)
           - 30% Experience/Role Match
           - 20% Formatting/Section Headers (Standard headers like 'Experience', 'Education' are required)
           - 10% Soft Skills
        
        Return JSON exactly:
        {
            "matchPercentage": 0-100,
            "missingSkills": ["Specific missing keyword 1", "Specific missing keyword 2"],
            "suggestions": ["Actionable advice to improve content"],
            "atsScore": 0-100,
            "atsFeedback": [
                "CRITICAL: Missing standard section 'Experience'", 
                "WARNING: Use standard bullet points", 
                "Identify specific missing keywords"
            ]
        }`;

        return await this.callAI(systemPrompt, `Job Description:\n${safeText}\n\nUser Resume Context:\n${safeResume}`);
    }

    cleanJson(text) {
        try {
            // Remove markdown code block if present
            if (text.startsWith('```json') && text.endsWith('```')) {
                text = text.substring(7, text.length - 3).trim();
            } else if (text.startsWith('```') && text.endsWith('```')) {
                text = text.substring(3, text.length - 3).trim();
            }
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON:", text, e);
            throw new Error("AI response was not valid JSON.");
        }
    }
}

// Export
window.AIService = AIService;
