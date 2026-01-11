/**
 * Utility Functions for AI Interview Prep Overlay
 */

const Utils = {
    /**
     * Debounce function to limit rate of execution
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Clean text extracted from HTML
     * Removes extra whitespace, newlines, etc.
     */
    cleanText: (text) => {
        if (!text) return '';
        return text
            .replace(/<[^>]*>/g, ' ') // data sanitization basics
            .replace(/\s+/g, ' ')
            .trim();
    },

    /**
     * Detect if the current URL is a likely job page
     */
    isJobPage: (url) => {
        const jobPatterns = [
            /linkedin\.com\/jobs\/view/,
            /linkedin\.com\/.*\/jobs/,
            /indeed\.*\/viewjob/,
            /indeed\.*\/.*vjk=/,
            /glassdoor\.com\/job-listing/,
            /careers/,
            /jobs/
        ];
        return jobPatterns.some(pattern => pattern.test(url));
    },

    /**
     * Simple keyword detection in page content
     */
    hasJobKeywords: (documentBody) => {
        const keywords = ['Responsibilities', 'Qualifications', 'Requirements', 'Job Description', 'About the role'];
        const content = documentBody.innerText;
        // Check if at least 2 keywords exist to reduce false positives
        const matchCount = keywords.filter(k => content.includes(k)).length;
        return matchCount >= 2;
    }
};

// Export (attached to window for injection script usage)
window.Utils = Utils;
