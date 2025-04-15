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
                container.innerHTML = formatReport(data);
                break;
            case 'detailed':
                container.innerHTML = formatDetailedReport(data);
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

    function formatDetailedReport(data) {
        return `
            <div class="report-section">
                <h3>${data.title}</h3>
                <div class="report-content">${data.content}</div>
                
                <h4 class="section-title">Key Metrics</h4>
                ${data.metrics ? formatMetrics(data.metrics) : ''}
                
                ${data.marketAnalysis ? formatMarketAnalysis(data.marketAnalysis) : ''}
            </div>
        `;
    }

    function formatMarketAnalysis(marketAnalysis) {
        return `
            <h4 class="section-title">Market Analysis</h4>
            <div class="market-analysis">
                <div class="market-section">
                    <h5>Relevant Industries</h5>
                    <ul class="industry-list">
                        ${Array.isArray(marketAnalysis.Industries) ? 
                          marketAnalysis.Industries.map(industry => `
                            <li class="industry-item">${industry}</li>
                          `).join('') : 
                          '<li>No industry data available</li>'}
                    </ul>
                </div>
                
                <div class="market-section">
                    <h5>Competing Domains</h5>
                    <ul class="competing-domains">
                        ${Array.isArray(marketAnalysis.CompetingDomains) ? 
                          marketAnalysis.CompetingDomains.map(domain => `
                            <li class="competing-domain">${domain}</li>
                          `).join('') : 
                          '<li>No competing domains data available</li>'}
                    </ul>
                </div>
                
                <div class="market-metrics">
                    <div class="market-metric">
                        <div class="metric-label">Growth Trend</div>
                        <div class="metric-value">${marketAnalysis.GrowthTrend || 'N/A'}</div>
                    </div>
                    <div class="market-metric">
                        <div class="metric-label">Global Appeal</div>
                        <div class="metric-value">${marketAnalysis.GlobalAppeal || 'N/A'}</div>
                    </div>
                    <div class="market-metric">
                        <div class="metric-label">Digital Marketing Value</div>
                        <div class="metric-value">${marketAnalysis.DigitalMarketingValue || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function formatSalesHistory(data) {
        if (!data.sales || data.sales.length === 0) {
            return `
                <div class="sales-history">
                    <h3>Sales History</h3>
                    <p class="no-data-message">No sales history found for this domain.</p>
                </div>
            `;
        }
        
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
        if (!data.domains || data.domains.length === 0) {
            return `
                <div class="similar-domains">
                    <h3>Similar Domains</h3>
                    <p class="no-data-message">No similar domains found.</p>
                </div>
            `;
        }
        
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
        const domain = currentDomain;
        const basicData = currentReports.basic;
        const detailedData = currentReports.detailed;
        const salesData = currentReports.sales;
        const similarData = currentReports.similar;
        
        let report = `
            <html>
            <head>
                <title>Domain Analysis Report - ${domain}</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; color: #333; }
                    h1, h2, h3, h4 { color: #4F46E5; }
                    h1 { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
                    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                    .metric-item { background-color: #f9fafb; padding: 15px; border-radius: 8px; }
                    .metric-label { font-weight: 600; margin-bottom: 5px; }
                    .metric-value { font-size: 1.2em; color: #10B981; }
                    .sales-list, .domain-list { list-style: none; padding: 0; }
                    .sale-item, .domain-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
                    .report-content { line-height: 1.6; white-space: pre-line; }
                    .market-analysis { margin-top: 20px; }
                    .market-section { margin-bottom: 15px; }
                    .market-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                    .market-metric { background-color: #f0f9ff; padding: 15px; border-radius: 8px; }
                    footer { text-align: center; margin-top: 50px; color: #6B7280; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <h1>Domain Analysis Report: ${domain}</h1>
                
                <div class="section">
                    <h2>Overview</h2>
                    ${basicData ? `<div class="report-content">${basicData.content}</div>` : '<p>No basic data available</p>'}
                    ${basicData && basicData.metrics ? `
                        <h3>Key Metrics</h3>
                        <div class="metrics-grid">
                            ${Object.entries(basicData.metrics).map(([key, value]) => `
                                <div class="metric-item">
                                    <div class="metric-label">${key}</div>
                                    <div class="metric-value">${value}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                ${detailedData ? `
                    <div class="section">
                        <h2>Detailed Analysis</h2>
                        <div class="report-content">${detailedData.content}</div>
                        
                        ${detailedData.metrics ? `
                            <h3>Performance Metrics</h3>
                            <div class="metrics-grid">
                                ${Object.entries(detailedData.metrics).map(([key, value]) => `
                                    <div class="metric-item">
                                        <div class="metric-label">${key}</div>
                                        <div class="metric-value">${value}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${detailedData.marketAnalysis ? `
                            <h3>Market Analysis</h3>
                            <div class="market-analysis">
                                ${detailedData.marketAnalysis.Industries ? `
                                    <div class="market-section">
                                        <h4>Relevant Industries</h4>
                                        <ul>
                                            ${detailedData.marketAnalysis.Industries.map(industry => `
                                                <li>${industry}</li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${detailedData.marketAnalysis.CompetingDomains ? `
                                    <div class="market-section">
                                        <h4>Competing Domains</h4>
                                        <ul>
                                            ${detailedData.marketAnalysis.CompetingDomains.map(domain => `
                                                <li>${domain}</li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                <div class="market-metrics">
                                    <div class="market-metric">
                                        <div class="metric-label">Growth Trend</div>
                                        <div class="metric-value">${detailedData.marketAnalysis.GrowthTrend || 'N/A'}</div>
                                    </div>
                                    <div class="market-metric">
                                        <div class="metric-label">Global Appeal</div>
                                        <div class="metric-value">${detailedData.marketAnalysis.GlobalAppeal || 'N/A'}</div>
                                    </div>
                                    <div class="market-metric">
                                        <div class="metric-label">Digital Marketing Value</div>
                                        <div class="metric-value">${detailedData.marketAnalysis.DigitalMarketingValue || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${salesData && salesData.sales && salesData.sales.length > 0 ? `
                    <div class="section">
                        <h2>Sales History</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f3f4f6;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Date</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${salesData.sales.map(sale => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${sale.date}</td>
                                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${sale.price.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                ${similarData && similarData.domains && similarData.domains.length > 0 ? `
                    <div class="section">
                        <h2>Similar Domains</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f3f4f6;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Domain</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Estimated Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${similarData.domains.map(domain => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${domain.name}</td>
                                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${domain.price.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                <footer>
                    <p>Report generated by Doughmain on ${new Date().toLocaleDateString()}</p>
                </footer>
            </body>
            </html>
        `;
        
        return report;
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