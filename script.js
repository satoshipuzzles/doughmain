document.addEventListener('DOMContentLoaded', () => {
    const domainForm = document.getElementById('domainForm');
    const domainInput = document.getElementById('domainInput');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const downloadReport = document.getElementById('downloadReport');
    const downloadTemplate = document.getElementById('downloadTemplate');
    const tabs = document.querySelectorAll('.tab-button');
    let currentDomain = '';
    let currentReports = {};

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            switchTab(targetTab);
        });
    });

    function switchTab(tabId) {
        // Update tab buttons
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === tabId);
        });

        // Load content if needed
        if (currentDomain && !currentReports[tabId]) {
            loadTabContent(tabId, currentDomain);
        }
    }

    // Form submission handler
    domainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const domain = domainInput.value.trim();
        if (!domain) return;

        currentDomain = domain;
        currentReports = {};
        resetUI();
        await loadTabContent('basic', domain);
        switchTab('basic');
    });

    async function loadTabContent(tabId, domain) {
        showLoading(true);
        try {
            let data;
            switch (tabId) {
                case 'basic':
                    data = await fetchAPI('/api/generateBasicReport', { domain });
                    break;
                case 'detailed':
                    data = await fetchAPI('/api/generateDetailedReport', { domain });
                    break;
                case 'sales':
                    data = await fetchAPI('/api/checkSalesHistory', { domain });
                    break;
                case 'similar':
                    data = await fetchAPI('/api/getSimilarDomains', { domain });
                    break;
                case 'branding':
                    data = await fetchAPI('/api/generateImage', { domain });
                    break;
            }
            
            currentReports[tabId] = data;
            updateTabContent(tabId, data);
            enableDownloadButtons();
        } catch (error) {
            showError(tabId, error.message);
        } finally {
            showLoading(false);
        }
    }

    async function fetchAPI(endpoint, data) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        return response.json();
    }

    function updateTabContent(tabId, data) {
        const panel = document.getElementById(tabId);
        const container = panel.querySelector('.report-container, .logo-container');
        
        switch (tabId) {
            case 'basic':
            case 'detailed':
                container.innerHTML = formatReport(data);
                break;
            case 'sales':
                container.innerHTML = formatSalesHistory(data);
                break;
            case 'similar':
                container.innerHTML = formatSimilarDomains(data);
                break;
            case 'branding':
                container.innerHTML = `<img src="${data.imageUrl}" alt="Generated logo" class="generated-logo">`;
                break;
        }
    }

    function formatReport(data) {
        return `
            <div class="report-section">
                <h3>${data.title}</h3>
                <div class="report-content">${data.content}</div>
                ${data.metrics ? formatMetrics(data.metrics) : ''}
            </div>
        `;
    }

    function formatSalesHistory(data) {
        return `
            <div class="sales-history">
                <h3>Sales History</h3>
                <ul class="sales-list">
                    ${data.sales.map(sale => `
                        <li class="sale-item">
                            <span class="sale-date">${sale.date}</span>
                            <span class="sale-price">$${sale.price.toLocaleString()}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    function formatSimilarDomains(data) {
        return `
            <div class="similar-domains">
                <h3>Similar Domains</h3>
                <ul class="domain-list">
                    ${data.domains.map(domain => `
                        <li class="domain-item">
                            <span class="domain-name">${domain.name}</span>
                            <span class="domain-price">$${domain.price.toLocaleString()}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    function formatMetrics(metrics) {
        return `
            <div class="metrics-grid">
                ${Object.entries(metrics).map(([key, value]) => `
                    <div class="metric-item">
                        <div class="metric-label">${key}</div>
                        <div class="metric-value">${value}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function showLoading(show) {
        loadingOverlay.classList.toggle('hidden', !show);
    }

    function showError(tabId, message) {
        const panel = document.getElementById(tabId);
        const container = panel.querySelector('.report-container, .logo-container');
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }

    function resetUI() {
        document.querySelectorAll('.report-container, .logo-container').forEach(container => {
            container.innerHTML = '';
        });
        downloadReport.disabled = true;
        downloadTemplate.disabled = true;
    }

    function enableDownloadButtons() {
        downloadReport.disabled = false;
        downloadTemplate.disabled = false;
    }

    // Download handlers
    downloadReport.addEventListener('click', () => {
        if (!currentReports.basic) return;
        
        const reportContent = generateFullReport();
        downloadFile('domain-analysis.html', reportContent, 'text/html');
    });

    downloadTemplate.addEventListener('click', () => {
        if (!currentReports.basic) return;
        
        const templateContent = generateLandingTemplate();
        downloadFile('landing-template.html', templateContent, 'text/html');
    });

    function generateFullReport() {
        // Generate a formatted HTML report combining all available data
        const reports = Object.entries(currentReports)
            .map(([type, data]) => {
                return `
                    <section class="report-section">
                        <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Analysis</h2>
                        ${formatReport(data)}
                    </section>
                `;
            })
            .join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Domain Analysis Report - ${currentDomain}</title>
                <style>
                    /* Add report styling here */
                </style>
            </head>
            <body>
                <h1>Domain Analysis Report</h1>
                <h2>${currentDomain}</h2>
                ${reports}
            </body>
            </html>
        `;
    }

    function generateLandingTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${currentDomain}</title>
                <style>
                    /* Add landing page styling here */
                </style>
            </head>
            <body>
                <header>
                    <h1>${currentDomain}</h1>
                </header>
                <main>
                    <!-- Add landing page content here -->
                </main>
            </body>
            </html>
        `;
    }

    function downloadFile(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
});