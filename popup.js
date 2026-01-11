// Popup Logic
let atsService = null;
let aiService = null;

// DOM Helpers
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Popup Initialized - Hybrid Mode");

    // Initialize Services
    if (window.ATSService) atsService = new window.ATSService();
    else console.error("ATSService not found");

    if (window.AIService) aiService = new window.AIService();
    else console.error("AIService not found");

    // Bind all events
    bindEvents();

    // Check for theme preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }

    // Load saved settings
    try {
        const data = await chrome.storage.local.get([
            'userResumeSummary',
            'userResumeName',
            'userApiKey',
            'aiProvider',
            'customBaseUrl',
            'customModel'
        ]);

        // 1. Load Resume
        if (data.userResumeSummary) {
            const resumeInput = $('#resume-input');
            const resumeStatus = $('#resume-status');
            if (resumeInput && resumeStatus) {
                resumeInput.value = data.userResumeSummary;
                resumeStatus.textContent = `Resume Loaded: ${data.userResumeName || 'Saved Resume'}`;
                resumeStatus.style.display = 'block';
            }
        }

        // 2. Load AI Config
        if (aiService) {
            if (data.userApiKey) aiService.apiKey = data.userApiKey;
            if (data.aiProvider) aiService.provider = data.aiProvider;
            if (data.customBaseUrl) aiService.customBaseUrl = data.customBaseUrl;
            if (data.customModel) aiService.customModel = data.customModel;

            // UI: Fill Settings Fields
            const apiKeyInput = $('#api-key-input');
            const providerSelect = $('#ai-provider-select');

            if (apiKeyInput && data.userApiKey) apiKeyInput.value = data.userApiKey;
            if (providerSelect && data.aiProvider) {
                providerSelect.value = data.aiProvider;
                updateAIStatus(data.aiProvider);
            }
        }
    } catch (e) {
        console.error("Error loading settings:", e);
    }
});

function bindEvents() {
    // 1. Theme Toggle
    const themeBtn = $('#theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const panel = $('#ai-overlay-panel');
            const isDark = panel.classList.toggle('dark-mode');
            themeBtn.textContent = isDark ? '☀️' : '🌙';
        });
    }

    // 2. Resume File Input
    const fileInput = $('#resume-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const updateText = (text, name) => {
                const resumeInput = $('#resume-input');
                const resumeStatus = $('#resume-status');

                resumeInput.value = text.substring(0, 50000); // Limit size
                resumeStatus.textContent = `Resume Loaded: ${name}`;
                resumeStatus.style.display = 'block';

                chrome.storage.local.set({
                    userResumeSummary: text,
                    userResumeName: name
                });
            };

            $('#resume-status').style.display = 'block';
            $('#resume-status').textContent = "Parsing file...";

            try {
                if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    if (window.pdfjsLib) {
                        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('libs/pdf.worker.min.js');
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                        let text = "";
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map(item => item.str).join(' ') + "\n";
                        }
                        updateText(text, file.name);
                    } else {
                        $('#resume-status').textContent = "Error: PDF Library not loaded.";
                    }
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
                    if (window.mammoth) {
                        const arrayBuffer = await file.arrayBuffer();
                        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                        updateText(result.value, file.name);
                    } else {
                        $('#resume-status').textContent = "Error: DOCX Library not loaded.";
                    }
                } else {
                    const reader = new FileReader();
                    reader.onload = (event) => updateText(event.target.result, file.name);
                    reader.readAsText(file);
                }
            } catch (err) {
                console.error("File parse error:", err);
                $('#resume-status').textContent = "Error parsing file.";
            }
        });
    }

    // 3. Analyze Button
    const analyzeBtn = $('#analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const resumeText = $('#resume-input').value;
            const jobText = $('#manual-job-input').value;

            if (!resumeText) {
                alert("Please upload your resume first.");
                return;
            }
            if (!jobText || jobText.length < 50) {
                alert("Please paste a valid Job Description.");
                return;
            }

            // 3a. Offline Analysis
            if (atsService) {
                const results = atsService.analyze(jobText, resumeText);
                renderResults(results);
            }

            // Show Results View
            switchView('results-area');

            // Hide AI Tabs initially
            const aiTabs = $('#ai-tabs');
            if (aiTabs) aiTabs.classList.add('hidden');

            // 3b. AI Analysis (Optional)
            if (aiService) {
                const canRunAI = (aiService.apiKey || aiService.provider === 'ollama');
                if (canRunAI) {
                    if (aiTabs) aiTabs.classList.remove('hidden');
                    updateTabStatus('summary', 'Generating Summary...');
                    updateTabStatus('questions', 'Generating Questions...');

                    try {
                        const [summary, questions] = await Promise.all([
                            aiService.analyzeJob(jobText).catch(e => ({ summary: "Unavailable" })),
                            aiService.generateQuestions(jobText).catch(e => [])
                        ]);
                        renderAISummary(summary);
                        renderQuestions(questions);
                    } catch (err) {
                        console.error("AI Error:", err);
                    }
                }
            }
        });
    }

    // 4. Reset Button
    const resetBtn = $('#reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            $('#manual-job-input').value = "";
            switchView('input-view');
        });
    }

    // 5. Settings & Tabs
    bindSettingsEvents();
    bindTabEvents();
}

function bindSettingsEvents() {
    const configBtn = $('#ai-config-btn');
    const modal = $('#ai-config-modal');
    const closeModalBtn = $('#close-modal-btn');
    const saveConfigBtn = $('#save-config-btn');
    const providerSelect = $('#ai-provider-select');

    // Open Modal
    if (configBtn) {
        configBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('hidden');
        });
    }

    // Close Modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modal) modal.classList.add('hidden');
        });
    }

    if (providerSelect) {
        providerSelect.addEventListener('change', () => updateAIStatus(providerSelect.value));
    }

    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', async () => {
            const apiKey = $('#api-key-input').value;
            const provider = $('#ai-provider-select').value;
            const customUrl = $('#custom-base-url').value;
            const customModel = $('#custom-model-name').value;

            await chrome.storage.local.set({
                userApiKey: apiKey,
                aiProvider: provider,
                customBaseUrl: customUrl,
                customModel: customModel
            });

            if (aiService) {
                aiService.apiKey = apiKey;
                aiService.provider = provider;
                aiService.customBaseUrl = customUrl;
                aiService.customModel = customModel;
            }

            alert("AI Configuration Saved!");
            if (modal) modal.classList.add('hidden');
        });
    }
}

function bindTabEvents() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Remove active class from all panes
            const panes = document.querySelectorAll('.tab-pane');
            panes.forEach(p => p.classList.remove('active'));

            // Activate clicked tab
            tab.classList.add('active');

            // Activate corresponding pane
            const targetId = tab.getAttribute('data-tab');
            const targetPane = $(`#tab-${targetId}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });
}

function updateAIStatus(provider) {
    const customFields = $('#custom-ai-fields');
    const apiKeyInput = $('#api-key-input');
    const apiKeyGroup = $('#api-key-group');

    // Hints
    const geminiHint = $('#gemini-hint');
    const openaiHint = $('#openai-hint');
    const ollamaHint = $('#ollama-hint');

    if (!customFields) return;

    customFields.classList.add('hidden');
    if (geminiHint) geminiHint.style.display = 'none';
    if (openaiHint) openaiHint.style.display = 'none';
    if (ollamaHint) ollamaHint.style.display = 'none';

    if (apiKeyGroup) apiKeyGroup.style.display = 'block';

    if (provider === 'custom') {
        customFields.classList.remove('hidden');
    } else if (provider === 'gemini') {
        if (geminiHint) geminiHint.style.display = 'block';
    } else if (provider === 'openai') {
        if (openaiHint) openaiHint.style.display = 'block';
    } else if (provider === 'ollama') {
        // Hide custom fields for simplicity (defaults used)
        customFields.classList.add('hidden');
        if (apiKeyGroup) apiKeyGroup.style.display = 'none';
        if (apiKeyInput) apiKeyInput.value = "ollama-local"; // Dummy value to pass check
        if (ollamaHint) ollamaHint.style.display = 'block';
    }
}

function switchView(viewId) {
    const views = ['input-view', 'results-area']; // Settings view removed

    // Hide all
    views.forEach(id => {
        const el = $(`#${id}`);
        if (el) el.classList.add('hidden');
    });

    // Show target
    const target = $(`#${viewId}`);
    if (target) target.classList.remove('hidden');

    // Toggle Analyze Button visibility (only for input view)
    const analyzeBtn = $('#analyze-btn');
    if (analyzeBtn) {
        if (viewId === 'input-view') analyzeBtn.classList.remove('hidden');
        else analyzeBtn.classList.add('hidden');
    }
}

function renderResults(data) {
    const scoreEl = $('#score-display');
    const missingEl = $('#missing-skills-list');
    const suggEl = $('#suggestions-list');

    if (scoreEl) {
        scoreEl.textContent = `${data.matchPercentage}%`;
        if (data.matchPercentage >= 75) scoreEl.style.color = '#10b981';
        else if (data.matchPercentage >= 50) scoreEl.style.color = '#f59e0b';
        else scoreEl.style.color = '#ef4444';
    }

    if (missingEl) {
        if (data.missingSkills.length === 0) {
            missingEl.innerHTML = '<li style="color:#10b981">Match found! No major keywords missing.</li>';
        } else {
            missingEl.innerHTML = data.missingSkills.map(s => `<li>${s}</li>`).join('');
        }
    }

    if (suggEl) {
        suggEl.innerHTML = data.suggestions.map(s => `<li>${s}</li>`).join('');
    }
}

function renderAISummary(data) {
    const container = $('#tab-summary');
    if (container) {
        container.innerHTML = `
            <div class="qa-card">
                <div class="section-title">Job Summary</div>
                <p>${data.summary || "No summary available."}</p>
            </div>
            <div class="qa-card">
                <div class="section-title">Key Expectations</div>
                <p>${data.expectations || "N/A"}</p>
            </div>
        `;
    }
}

function renderQuestions(list) {
    const container = $('#tab-questions');
    if (container) {
        if (!list || list.length === 0) {
            container.innerHTML = "<p>No questions generated.</p>";
            return;
        }
        container.innerHTML = list.map(q => `
            <div class="qa-card">
                <div class="qa-category">${q.category}</div>
                <div class="qa-question">${q.question}</div>
            </div>
        `).join('');
    }
}

function updateTabStatus(tabId, text) {
    const container = $(`#tab-${tabId}`);
    if (container) container.innerHTML = `<div class="placeholder-text">${text}</div>`;
}

function setTheme(mode) {
    const panel = $('#ai-overlay-panel');
    const themeBtn = $('#theme-toggle');
    if (panel && themeBtn) {
        if (mode === 'dark') {
            panel.classList.add('dark-mode');
            themeBtn.textContent = '☀️';
        } else {
            panel.classList.remove('dark-mode');
            themeBtn.textContent = '🌙';
        }
    }
}
