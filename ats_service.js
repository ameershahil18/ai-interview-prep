/**
 * Offline ATS Service
 * Provides deterministic ATS scoring and keyword analysis without AI.
 */
class ATSService {
    constructor() {
        this.stopWords = new Set([
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
            "will", "would", "shall", "should", "can", "could", "may", "might", "must",
            "this", "that", "these", "those", "it", "its", "we", "us", "our", "you", "your", "they", "them", "their",
            "i", "me", "my", "he", "him", "his", "she", "her", "hers",
            "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
            "as", "if", "than", "so", "because", "while", "until", "unless", "since",
            "about", "against", "between", "into", "through", "during", "before", "after", "above", "below",
            "from", "up", "down", "out", "off", "over", "under", "again", "further", "then", "once",
            "here", "there", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
            "no", "nor", "not", "only", "own", "same", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
            "experience", "work", "job", "role", "position", "candidate", "team", "skills", "requirements", "responsibilities" // Common JD words
        ]);

        this.hardSkillsDB = new Set([
            "javascript", "python", "java", "c++", "c#", "ruby", "go", "swift", "kotlin", "php", "typescript", "rust",
            "react", "angular", "vue", "node.js", "django", "flask", "spring", "asp.net", "laravel", "rails",
            "html", "css", "sql", "nosql", "mongodb", "postgresql", "mysql", "oracle", "redis", "firebase",
            "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "github", "gitlab", "jira",
            "agile", "scrum", "kanban", "devops", "ci/cd", "machine learning", "ai", "data science", "nlp"
        ]);
    }

    analyze(jobText, resumeText) {
        if (!jobText || !resumeText) {
            return {
                matchPercentage: 0,
                atsScore: 0,
                missingSkills: [],
                suggestions: ["Please provide both Job Description and Resume."],
                atsFeedback: []
            };
        }

        const jdKeywords = this.extractKeywords(jobText);
        const resumeLower = resumeText.toLowerCase();

        // 1. Keyword Match Score (50%)
        const missingKeywords = [];
        let matchedCount = 0;
        let totalSignificant = 0;

        // Sort by frequency
        const sortedKeywords = Array.from(jdKeywords.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20); // Top 20 relevant keywords

        sortedKeywords.forEach(([word, freq]) => {
            totalSignificant++;
            if (resumeLower.includes(word)) {
                matchedCount++;
            } else {
                missingKeywords.push(word);
            }
        });

        const keywordScore = totalSignificant > 0 ? (matchedCount / totalSignificant) * 100 : 0;

        // 2. Formatting & Structure Score (30%)
        const formatChecks = this.checkFormatting(resumeText);
        const formatScore = formatChecks.score;

        // 3. Length & Readability (20%)
        const wordCount = resumeText.split(/\s+/).length;
        let lengthScore = 100;
        if (wordCount < 200) lengthScore = 50;
        if (wordCount > 2000) lengthScore = 80; // Too long

        // Total Weighted Score
        const totalScore = Math.round((keywordScore * 0.5) + (formatScore * 0.3) + (lengthScore * 0.2));

        return {
            matchPercentage: Math.round(keywordScore), // Strict keyword match for "Match %" badge
            atsScore: totalScore,
            missingSkills: missingKeywords.slice(0, 10), // Show top 10 missing
            suggestions: this.generateSuggestions(missingKeywords, formatChecks.issues),
            atsFeedback: formatChecks.issues
        };
    }

    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s\+\#]/g, '') // Remove punctuation but keep C++, C#, etc
            .split(/\s+/);

        const freqMap = new Map();

        words.forEach(word => {
            if (word.length > 2 && !this.stopWords.has(word)) {
                // Boost known technical skills
                const boost = this.hardSkillsDB.has(word) ? 2 : 1;
                freqMap.set(word, (freqMap.get(word) || 0) + boost);
            }
        });

        return freqMap;
    }

    checkFormatting(text) {
        let score = 100;
        const issues = [];
        const lower = text.toLowerCase();

        // Check Sections
        const sections = ["experience", "education", "skills"];
        sections.forEach(sec => {
            if (!lower.includes(sec)) {
                score -= 10;
                issues.push(`CRITICAL: Missing '${sec.charAt(0).toUpperCase() + sec.slice(1)}' section.`);
            }
        });

        // Check Contact Info (Heuristic)
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        if (!emailRegex.test(text)) {
            score -= 10;
            issues.push("WARNING: No email address detected.");
        }

        // Bullet points heuristic (looking for common markers)
        if (!text.includes("•") && !text.includes("- ") && !text.includes("* ")) {
            score -= 10;
            issues.push("TIP: Use standard bullet points (•, -) for readability.");
        }

        return { score: Math.max(0, score), issues };
    }

    generateSuggestions(missing, issues) {
        const suggestions = [];
        if (missing.length > 0) {
            suggestions.push(`Add these high-value keywords: ${missing.slice(0, 5).join(", ")}`);
        }
        if (issues.length > 0) {
            suggestions.push(...issues);
        }
        if (suggestions.length === 0) {
            suggestions.push("Great job! Your resume looks well-optimized.");
        }
        return suggestions;
    }
}

// Export for usage
window.ATSService = ATSService;
