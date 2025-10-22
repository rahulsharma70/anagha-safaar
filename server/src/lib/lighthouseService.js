// Lighthouse performance testing and optimization
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class LighthousePerformanceService {
  constructor() {
    this.defaultConfig = {
      extends: 'lighthouse:default',
      settings: {
        onlyAudits: [
          'first-contentful-paint',
          'largest-contentful-paint',
          'first-meaningful-paint',
          'speed-index',
          'cumulative-layout-shift',
          'total-blocking-time',
          'interactive',
          'server-response-time',
          'render-blocking-resources',
          'unused-css-rules',
          'unused-javascript',
          'efficient-animated-content',
          'preload-lcp-image',
          'uses-optimized-images',
          'uses-webp-images',
          'uses-text-compression',
          'uses-rel-preconnect',
          'uses-rel-preload',
          'critical-request-chains',
          'user-timings',
          'bootup-time',
          'mainthread-work-breakdown',
          'dom-size',
          'redirects',
          'uses-http2',
          'uses-long-cache-ttl',
          'total-byte-weight',
          'offscreen-images',
          'unminified-css',
          'unminified-javascript',
          'legacy-javascript',
          'modern-image-formats',
          'uses-responsive-images',
          'efficient-animated-content',
          'duplicated-javascript',
          'no-document-write',
          'no-vulnerable-libraries',
          'no-unload-listeners',
          'csp-xss',
          'external-anchors-use-rel-noopener',
          'geolocation-on-start',
          'notification-on-start',
          'camera-on-start',
          'microphone-on-start',
          'is-on-https',
          'uses-passive-event-listeners',
          'no-mixed-content',
          'object-alt',
          'image-alt',
          'label',
          'title',
          'link-text',
          'button-name',
          'html-has-lang',
          'html-lang-valid',
          'meta-description',
          'canonical',
          'robots-txt',
          'hreflang',
          'plugins',
          'deprecations',
          'console-errors',
          'errors-in-console',
          'image-aspect-ratio',
          'color-contrast',
          'heading-order',
          'bypass',
          'focus-traps',
          'focusable-controls',
          'interactive-element-affordance',
          'logical-tab-order',
          'managed-focus',
          'offscreen-content-hidden',
          'use-landmarks',
          'visual-order-follows-dom',
          'duplicate-id',
          'th-has-data-cells',
          'valid-lang',
          'meta-viewport',
          'accesskeys',
          'tabindex',
          'td-headers-attr',
          'th-has-data-cells',
          'valid-lang',
          'meta-viewport',
          'accesskeys',
          'tabindex',
          'td-headers-attr'
        ]
      }
    };
    
    this.performanceThresholds = {
      performance: 90,
      accessibility: 95,
      bestPractices: 90,
      seo: 90,
      pwa: 80
    };
  }
  
  // Run Lighthouse audit
  async runAudit(url, options = {}) {
    const config = { ...this.defaultConfig, ...options.config };
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    
    try {
      logger.info('Starting Lighthouse audit', { url, options });
      
      const result = await lighthouse(url, {
        port: chrome.port,
        output: 'json',
        logLevel: 'info'
      }, config);
      
      logger.info('Lighthouse audit completed', {
        url,
        performance: result.lhr.categories.performance.score * 100,
        accessibility: result.lhr.categories.accessibility.score * 100,
        bestPractices: result.lhr.categories['best-practices'].score * 100,
        seo: result.lhr.categories.seo.score * 100
      });
      
      return result;
    } catch (error) {
      logger.error('Lighthouse audit failed', { url, error: error.message });
      throw error;
    } finally {
      await chrome.kill();
    }
  }
  
  // Run comprehensive performance audit
  async runComprehensiveAudit(baseUrl, pages = []) {
    const results = {
      baseUrl,
      timestamp: new Date().toISOString(),
      pages: [],
      summary: {
        averagePerformance: 0,
        averageAccessibility: 0,
        averageBestPractices: 0,
        averageSeo: 0,
        totalPages: 0,
        passedThresholds: 0
      }
    };
    
    const defaultPages = [
      '/',
      '/hotels',
      '/flights',
      '/tours',
      '/auth',
      '/dashboard'
    ];
    
    const pagesToAudit = pages.length > 0 ? pages : defaultPages;
    
    logger.info('Starting comprehensive Lighthouse audit', {
      baseUrl,
      pageCount: pagesToAudit.length
    });
    
    for (const page of pagesToAudit) {
      try {
        const url = `${baseUrl}${page}`;
        const result = await this.runAudit(url);
        
        const pageResult = {
          url,
          page,
          scores: {
            performance: Math.round(result.lhr.categories.performance.score * 100),
            accessibility: Math.round(result.lhr.categories.accessibility.score * 100),
            bestPractices: Math.round(result.lhr.categories['best-practices'].score * 100),
            seo: Math.round(result.lhr.categories.seo.score * 100)
          },
          metrics: this.extractMetrics(result.lhr),
          opportunities: this.extractOpportunities(result.lhr),
          diagnostics: this.extractDiagnostics(result.lhr),
          passedThresholds: this.checkThresholds(result.lhr)
        };
        
        results.pages.push(pageResult);
        
        logger.info('Page audit completed', {
          page,
          performance: pageResult.scores.performance,
          accessibility: pageResult.scores.accessibility,
          passedThresholds: pageResult.passedThresholds
        });
        
        // Add delay between audits to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        logger.error('Page audit failed', { page, error: error.message });
        
        results.pages.push({
          url: `${baseUrl}${page}`,
          page,
          error: error.message,
          scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
          passedThresholds: 0
        });
      }
    }
    
    // Calculate summary
    const successfulAudits = results.pages.filter(p => !p.error);
    if (successfulAudits.length > 0) {
      results.summary.averagePerformance = Math.round(
        successfulAudits.reduce((sum, p) => sum + p.scores.performance, 0) / successfulAudits.length
      );
      results.summary.averageAccessibility = Math.round(
        successfulAudits.reduce((sum, p) => sum + p.scores.accessibility, 0) / successfulAudits.length
      );
      results.summary.averageBestPractices = Math.round(
        successfulAudits.reduce((sum, p) => sum + p.scores.bestPractices, 0) / successfulAudits.length
      );
      results.summary.averageSeo = Math.round(
        successfulAudits.reduce((sum, p) => sum + p.scores.seo, 0) / successfulAudits.length
      );
      results.summary.totalPages = successfulAudits.length;
      results.summary.passedThresholds = successfulAudits.reduce((sum, p) => sum + p.passedThresholds, 0);
    }
    
    logger.info('Comprehensive audit completed', {
      totalPages: results.pages.length,
      successfulAudits: successfulAudits.length,
      averagePerformance: results.summary.averagePerformance,
      averageAccessibility: results.summary.averageAccessibility
    });
    
    return results;
  }
  
  // Extract key performance metrics
  extractMetrics(lhr) {
    const audits = lhr.audits;
    
    return {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue,
      firstMeaningfulPaint: audits['first-meaningful-paint']?.numericValue,
      speedIndex: audits['speed-index']?.numericValue,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue,
      totalBlockingTime: audits['total-blocking-time']?.numericValue,
      interactive: audits['interactive']?.numericValue,
      serverResponseTime: audits['server-response-time']?.numericValue
    };
  }
  
  // Extract optimization opportunities
  extractOpportunities(lhr) {
    const audits = lhr.audits;
    const opportunities = [];
    
    const opportunityAudits = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'efficient-animated-content',
      'preload-lcp-image',
      'uses-optimized-images',
      'uses-webp-images',
      'uses-text-compression',
      'uses-rel-preconnect',
      'uses-rel-preload',
      'offscreen-images',
      'unminified-css',
      'unminified-javascript',
      'legacy-javascript',
      'modern-image-formats',
      'uses-responsive-images',
      'duplicated-javascript'
    ];
    
    opportunityAudits.forEach(auditId => {
      const audit = audits[auditId];
      if (audit && audit.score < 0.9) {
        opportunities.push({
          id: auditId,
          title: audit.title,
          description: audit.description,
          score: Math.round(audit.score * 100),
          savings: audit.details?.overallSavingsMs || 0,
          warnings: audit.warnings || []
        });
      }
    });
    
    return opportunities.sort((a, b) => b.savings - a.savings);
  }
  
  // Extract diagnostic information
  extractDiagnostics(lhr) {
    const audits = lhr.audits;
    const diagnostics = [];
    
    const diagnosticAudits = [
      'critical-request-chains',
      'user-timings',
      'bootup-time',
      'mainthread-work-breakdown',
      'dom-size',
      'redirects',
      'uses-http2',
      'uses-long-cache-ttl',
      'total-byte-weight'
    ];
    
    diagnosticAudits.forEach(auditId => {
      const audit = audits[auditId];
      if (audit) {
        diagnostics.push({
          id: auditId,
          title: audit.title,
          description: audit.description,
          score: Math.round(audit.score * 100),
          details: audit.details || null
        });
      }
    });
    
    return diagnostics;
  }
  
  // Check if scores meet thresholds
  checkThresholds(lhr) {
    let passedCount = 0;
    const totalCategories = 4;
    
    if (lhr.categories.performance.score * 100 >= this.performanceThresholds.performance) {
      passedCount++;
    }
    if (lhr.categories.accessibility.score * 100 >= this.performanceThresholds.accessibility) {
      passedCount++;
    }
    if (lhr.categories['best-practices'].score * 100 >= this.performanceThresholds.bestPractices) {
      passedCount++;
    }
    if (lhr.categories.seo.score * 100 >= this.performanceThresholds.seo) {
      passedCount++;
    }
    
    return passedCount;
  }
  
  // Generate performance report
  generateReport(auditResults, outputPath) {
    const report = {
      ...auditResults,
      generatedAt: new Date().toISOString(),
      thresholds: this.performanceThresholds,
      recommendations: this.generateRecommendations(auditResults)
    };
    
    // Save JSON report
    const jsonPath = path.join(outputPath, 'lighthouse-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(report);
    const htmlPath = path.join(outputPath, 'lighthouse-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    logger.info('Performance report generated', {
      jsonPath,
      htmlPath,
      averagePerformance: report.summary.averagePerformance
    });
    
    return { jsonPath, htmlPath };
  }
  
  // Generate recommendations based on audit results
  generateRecommendations(auditResults) {
    const recommendations = [];
    
    // Performance recommendations
    if (auditResults.summary.averagePerformance < this.performanceThresholds.performance) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        title: 'Improve Core Web Vitals',
        description: 'Focus on improving First Contentful Paint, Largest Contentful Paint, and Cumulative Layout Shift',
        actions: [
          'Optimize images and use modern formats (WebP, AVIF)',
          'Implement lazy loading for images',
          'Minimize render-blocking resources',
          'Use CDN for static assets',
          'Enable compression (gzip/brotli)',
          'Implement caching strategies'
        ]
      });
    }
    
    // Accessibility recommendations
    if (auditResults.summary.averageAccessibility < this.performanceThresholds.accessibility) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'High',
        title: 'Improve Accessibility',
        description: 'Ensure the application is accessible to users with disabilities',
        actions: [
          'Add alt text to images',
          'Ensure proper heading hierarchy',
          'Improve color contrast ratios',
          'Add keyboard navigation support',
          'Implement ARIA labels',
          'Test with screen readers'
        ]
      });
    }
    
    // SEO recommendations
    if (auditResults.summary.averageSeo < this.performanceThresholds.seo) {
      recommendations.push({
        category: 'SEO',
        priority: 'Medium',
        title: 'Improve Search Engine Optimization',
        description: 'Optimize the application for search engines',
        actions: [
          'Add meta descriptions',
          'Implement structured data',
          'Optimize page titles',
          'Add canonical URLs',
          'Create XML sitemap',
          'Improve internal linking'
        ]
      });
    }
    
    return recommendations;
  }
  
  // Generate HTML report
  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; }
        .score-excellent { color: #4CAF50; }
        .score-good { color: #8BC34A; }
        .score-needs-improvement { color: #FF9800; }
        .score-poor { color: #F44336; }
        .pages { margin-bottom: 30px; }
        .page-result { background: #f8f9fa; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
        .page-url { font-weight: bold; margin-bottom: 10px; }
        .page-scores { display: flex; gap: 20px; }
        .page-score { text-align: center; }
        .recommendations { margin-top: 30px; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
        .recommendation-title { font-weight: bold; margin-bottom: 10px; }
        .recommendation-actions { margin-top: 10px; }
        .recommendation-actions ul { margin: 0; padding-left: 20px; }
        .timestamp { text-align: center; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Lighthouse Performance Report</h1>
            <p>Generated for: ${report.baseUrl}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value score-${this.getScoreClass(report.summary.averagePerformance)}">${report.summary.averagePerformance}</div>
                <div class="metric-label">Performance</div>
            </div>
            <div class="metric">
                <div class="metric-value score-${this.getScoreClass(report.summary.averageAccessibility)}">${report.summary.averageAccessibility}</div>
                <div class="metric-label">Accessibility</div>
            </div>
            <div class="metric">
                <div class="metric-value score-${this.getScoreClass(report.summary.averageBestPractices)}">${report.summary.averageBestPractices}</div>
                <div class="metric-label">Best Practices</div>
            </div>
            <div class="metric">
                <div class="metric-value score-${this.getScoreClass(report.summary.averageSeo)}">${report.summary.averageSeo}</div>
                <div class="metric-label">SEO</div>
            </div>
        </div>
        
        <div class="pages">
            <h2>Page Results</h2>
            ${report.pages.map(page => `
                <div class="page-result">
                    <div class="page-url">${page.page}</div>
                    <div class="page-scores">
                        <div class="page-score">
                            <div class="metric-value score-${this.getScoreClass(page.scores.performance)}">${page.scores.performance}</div>
                            <div class="metric-label">Performance</div>
                        </div>
                        <div class="page-score">
                            <div class="metric-value score-${this.getScoreClass(page.scores.accessibility)}">${page.scores.accessibility}</div>
                            <div class="metric-label">Accessibility</div>
                        </div>
                        <div class="page-score">
                            <div class="metric-value score-${this.getScoreClass(page.scores.bestPractices)}">${page.scores.bestPractices}</div>
                            <div class="metric-label">Best Practices</div>
                        </div>
                        <div class="page-score">
                            <div class="metric-value score-${this.getScoreClass(page.scores.seo)}">${page.scores.seo}</div>
                            <div class="metric-label">SEO</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="recommendations">
            <h2>Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation">
                    <div class="recommendation-title">${rec.title} (${rec.priority} Priority)</div>
                    <div>${rec.description}</div>
                    <div class="recommendation-actions">
                        <strong>Actions:</strong>
                        <ul>
                            ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Generated on: ${report.generatedAt}
        </div>
    </div>
</body>
</html>
    `;
  }
  
  // Get score class for styling
  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'needs-improvement';
    return 'poor';
  }
  
  // Run performance test for specific environment
  async runEnvironmentTest(environment = 'development') {
    const environments = {
      development: 'http://localhost:3000',
      staging: 'https://staging.yourdomain.com',
      production: 'https://yourdomain.com'
    };
    
    const baseUrl = environments[environment];
    if (!baseUrl) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    
    logger.info('Starting environment performance test', { environment, baseUrl });
    
    const results = await this.runComprehensiveAudit(baseUrl);
    
    // Generate report
    const outputDir = path.join(process.cwd(), 'reports', 'lighthouse');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const reportPath = path.join(outputDir, `lighthouse-${environment}-${Date.now()}`);
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const reportFiles = this.generateReport(results, reportPath);
    
    return {
      environment,
      results,
      reportFiles
    };
  }
}

module.exports = LighthousePerformanceService;
