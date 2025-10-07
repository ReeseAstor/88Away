import { test, expect, Page } from '@playwright/test';
import { chromium, Browser, BrowserContext } from '@playwright/test';

// Test utilities for romance publishing workflow
class RomancePublishingWorkflow {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async login(email: string = 'test@example.com') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid=\"email-input\"]', email);
    await this.page.fill('[data-testid=\"password-input\"]', 'password123');
    await this.page.click('[data-testid=\"login-button\"]');
    await this.page.waitForURL('/dashboard');
  }
  
  async createRomanceProject(title: string, genre: string = 'contemporary') {
    await this.page.click('[data-testid=\"create-project-button\"]');
    await this.page.fill('[data-testid=\"project-title\"]', title);
    await this.page.selectOption('[data-testid=\"project-genre\"]', 'romance');
    await this.page.selectOption('[data-testid=\"romance-subgenre\"]', genre);
    await this.page.click('[data-testid=\"create-project-submit\"]');
    await this.page.waitForURL(`/projects/${title.toLowerCase().replace(/\\s+/g, '-')}`);
  }
  
  async setupRomanceSeries(seriesTitle: string, totalBooks: number) {
    await this.page.click('[data-testid=\"series-tab\"]');
    await this.page.click('[data-testid=\"create-series-button\"]');
    
    await this.page.fill('[data-testid=\"series-title\"]', seriesTitle);
    await this.page.fill('[data-testid=\"series-total-books\"]', totalBooks.toString());
    await this.page.selectOption('[data-testid=\"series-heat-level\"]', 'steamy');
    
    // Add tropes
    await this.page.click('[data-testid=\"add-trope-button\"]');
    await this.page.click('[data-testid=\"trope-enemies-to-lovers\"]');
    await this.page.click('[data-testid=\"trope-second-chance\"]');
    
    await this.page.click('[data-testid=\"save-series-button\"]');
    await expect(this.page.locator(`text=${seriesTitle}`)).toBeVisible();
  }
  
  async addCharacters() {
    await this.page.click('[data-testid=\"characters-tab\"]');
    
    // Add protagonist
    await this.page.click('[data-testid=\"add-character-button\"]');
    await this.page.fill('[data-testid=\"character-name\"]', 'Emma');
    await this.page.selectOption('[data-testid=\"character-role\"]', 'protagonist');
    await this.page.fill('[data-testid=\"character-description\"]', 'Strong-willed marketing executive');
    await this.page.fill('[data-testid=\"character-backstory\"]', 'Recently divorced, focusing on her career');
    await this.page.click('[data-testid=\"save-character-button\"]');
    
    // Add love interest
    await this.page.click('[data-testid=\"add-character-button\"]');
    await this.page.fill('[data-testid=\"character-name\"]', 'Jake');
    await this.page.selectOption('[data-testid=\"character-role\"]', 'love_interest');
    await this.page.fill('[data-testid=\"character-description\"]', 'Charming restaurant owner');
    await this.page.fill('[data-testid=\"character-backstory\"]', 'Lost his previous restaurant in a divorce settlement');
    await this.page.click('[data-testid=\"save-character-button\"]');
    
    await expect(this.page.locator('text=Emma')).toBeVisible();
    await expect(this.page.locator('text=Jake')).toBeVisible();
  }
  
  async setupCharacterRelationships() {
    await this.page.click('[data-testid=\"relationships-tab\"]');
    await this.page.click('[data-testid=\"add-relationship-button\"]');
    
    await this.page.selectOption('[data-testid=\"character1-select\"]', 'Emma');
    await this.page.selectOption('[data-testid=\"character2-select\"]', 'Jake');
    await this.page.selectOption('[data-testid=\"relationship-type\"]', 'romantic');
    
    // Set relationship development
    await this.page.selectOption('[data-testid=\"relationship-stage\"]', 'building-tension');
    await this.page.fill('[data-testid=\"relationship-intensity\"]', '7');
    
    // Add conflicts
    await this.page.click('[data-testid=\"add-conflict-button\"]');
    await this.page.selectOption('[data-testid=\"conflict-type\"]', 'trust-issues');
    
    await this.page.click('[data-testid=\"save-relationship-button\"]');
    await expect(this.page.locator('[data-testid=\"relationship-graph\"]')).toBeVisible();
  }
  
  async writeWithAI() {
    await this.page.click('[data-testid=\"documents-tab\"]');
    await this.page.click('[data-testid=\"create-document-button\"]');
    await this.page.fill('[data-testid=\"document-title\"]', 'Chapter 1');
    await this.page.click('[data-testid=\"create-document-submit\"]');
    
    // Use Romance Muse AI
    await this.page.click('[data-testid=\"ai-assistant-button\"]');
    await this.page.selectOption('[data-testid=\"ai-persona-select\"]', 'romance_muse');
    
    await this.page.fill(
      '[data-testid=\"ai-prompt-input\"]',
      'Write an opening scene where Emma and Jake meet for the first time in a coffee shop collision'
    );
    
    await this.page.click('[data-testid=\"generate-ai-content\"]');
    await expect(this.page.locator('[data-testid=\"ai-response\"]')).toBeVisible({ timeout: 30000 });
    
    // Insert AI content
    await this.page.click('[data-testid=\"insert-ai-content\"]');
    await expect(this.page.locator('[data-testid=\"document-editor\"]')).toContainText('Emma');
  }
  
  async enhanceWithDialogueCoach() {
    // Select some dialogue text
    await this.page.locator('[data-testid=\"document-editor\"]').click();
    await this.page.keyboard.press('Control+A');
    
    await this.page.click('[data-testid=\"ai-assistant-button\"]');
    await this.page.selectOption('[data-testid=\"ai-persona-select\"]', 'dialogue_coach');
    
    await this.page.fill(
      '[data-testid=\"ai-prompt-input\"]',
      'Improve the dialogue to sound more natural and character-specific'
    );
    
    await this.page.click('[data-testid=\"analyze-selection\"]');
    await expect(this.page.locator('[data-testid=\"ai-response\"]')).toBeVisible({ timeout: 30000 });
    
    await this.page.click('[data-testid=\"apply-suggestions\"]');
  }
  
  async analyzeTension() {
    await this.page.click('[data-testid=\"ai-assistant-button\"]');
    await this.page.selectOption('[data-testid=\"ai-persona-select\"]', 'tension_builder');
    
    await this.page.fill(
      '[data-testid=\"ai-prompt-input\"]',
      'Analyze the romantic tension in this scene and suggest improvements'
    );
    
    await this.page.click('[data-testid=\"analyze-content\"]');
    await expect(this.page.locator('[data-testid=\"tension-analysis\"]')).toBeVisible({ timeout: 30000 });
    
    // Check tension score
    await expect(this.page.locator('[data-testid=\"tension-score\"]')).toContainText(/[0-9]+/);
  }
  
  async validateHeatLevel() {
    await this.page.click('[data-testid=\"heat-level-tab\"]');
    
    // Set expected heat level
    await this.page.selectOption('[data-testid=\"target-heat-level\"]', 'steamy');
    
    // Run consistency check
    await this.page.click('[data-testid=\"check-heat-consistency\"]');
    await expect(this.page.locator('[data-testid=\"heat-analysis-results\"]')).toBeVisible({ timeout: 30000 });
    
    // Verify no major inconsistencies
    const inconsistencies = await this.page.locator('[data-testid=\"heat-inconsistency\"]').count();
    expect(inconsistencies).toBeLessThan(3);
  }
  
  async editWithRomanceEditor() {
    await this.page.click('[data-testid=\"ai-assistant-button\"]');
    await this.page.selectOption('[data-testid=\"ai-persona-select\"]', 'romance_editor');
    
    await this.page.fill(
      '[data-testid=\"ai-prompt-input\"]',
      'Review this chapter for romance genre conventions, pacing, and trope execution'
    );
    
    await this.page.click('[data-testid=\"full-edit-review\"]');
    await expect(this.page.locator('[data-testid=\"editor-feedback\"]')).toBeVisible({ timeout: 45000 });
    
    // Check for improvement suggestions
    await expect(this.page.locator('[data-testid=\"romance-improvements\"]')).toBeVisible();
    await expect(this.page.locator('[data-testid=\"trope-analysis\"]')).toBeVisible();
  }
  
  async designBookCover() {
    await this.page.click('[data-testid=\"publishing-tab\"]');
    await this.page.click('[data-testid=\"cover-design-studio\"]');
    
    // Select romance template
    await this.page.click('[data-testid=\"romance-template-steamy\"]');
    
    // Customize cover
    await this.page.fill('[data-testid=\"cover-title\"]', 'Collision Course');
    await this.page.fill('[data-testid=\"cover-author\"]', 'Test Author');
    
    // Upload couple image
    await this.page.setInputFiles(
      '[data-testid=\"cover-image-upload\"]',
      'tests/fixtures/romance-couple.jpg'
    );
    
    // Generate cover
    await this.page.click('[data-testid=\"generate-cover\"]');
    await expect(this.page.locator('[data-testid=\"cover-preview\"]')).toBeVisible({ timeout: 30000 });
    
    await this.page.click('[data-testid=\"save-cover\"]');
  }
  
  async generateBlurb() {
    await this.page.click('[data-testid=\"blurb-generator\"]');
    
    // AI-generated blurb
    await this.page.click('[data-testid=\"ai-generate-blurb\"]');
    await expect(this.page.locator('[data-testid=\"generated-blurb\"]')).toBeVisible({ timeout: 30000 });
    
    // Customize blurb
    const blurbText = await this.page.locator('[data-testid=\"blurb-text\"]').inputValue();
    await this.page.fill('[data-testid=\"blurb-text\"]', blurbText + ' A steamy enemies-to-lovers romance.');
    
    await this.page.click('[data-testid=\"save-blurb\"]');
  }
  
  async optimizeMetadata() {
    await this.page.click('[data-testid=\"metadata-optimizer\"]');
    
    // Generate optimized keywords
    await this.page.click('[data-testid=\"optimize-keywords\"]');
    await expect(this.page.locator('[data-testid=\"optimized-keywords\"]')).toBeVisible({ timeout: 30000 });
    
    // Select categories
    await this.page.click('[data-testid=\"category-contemporary-romance\"]');
    await this.page.click('[data-testid=\"category-romantic-comedy\"]');
    
    // Set pricing
    await this.page.fill('[data-testid=\"book-price\"]', '4.99');
    
    await this.page.click('[data-testid=\"save-metadata\"]');
  }
  
  async publishToKDP() {
    await this.page.click('[data-testid=\"kdp-publisher\"]');
    
    // Validate KDP credentials
    await this.page.click('[data-testid=\"validate-kdp-credentials\"]');
    await expect(this.page.locator('[data-testid=\"credentials-valid\"]')).toBeVisible();
    
    // Upload manuscript
    await this.page.setInputFiles(
      '[data-testid=\"manuscript-upload\"]',
      'tests/fixtures/romance-manuscript.pdf'
    );
    
    // Upload cover
    await this.page.setInputFiles(
      '[data-testid=\"kdp-cover-upload\"]',
      'tests/fixtures/romance-cover.jpg'
    );
    
    // Set territories and pricing
    await this.page.click('[data-testid=\"territory-us\"]');
    await this.page.click('[data-testid=\"territory-uk\"]');
    await this.page.fill('[data-testid=\"us-price\"]', '4.99');
    await this.page.fill('[data-testid=\"uk-price\"]', '3.99');
    
    // Preview before publishing
    await this.page.click('[data-testid=\"preview-kdp-listing\"]');
    await expect(this.page.locator('[data-testid=\"kdp-preview\"]')).toBeVisible();
    
    // Submit for review
    await this.page.click('[data-testid=\"submit-to-kdp\"]');
    await expect(this.page.locator('[data-testid=\"kdp-submission-success\"]')).toBeVisible();
  }
  
  async setupMarketplace() {
    await this.page.click('[data-testid=\"marketplace-tab\"]');
    
    // Connect Stripe account
    await this.page.click('[data-testid=\"connect-stripe\"]');
    // Note: In real test, this would redirect to Stripe Connect
    await expect(this.page.locator('[data-testid=\"stripe-onboarding\"]')).toBeVisible();
    
    // Mock successful Stripe connection
    await this.page.evaluate(() => {
      window.postMessage({ type: 'STRIPE_CONNECT_SUCCESS', accountId: 'acct_test123' }, '*');
    });
    
    await expect(this.page.locator('[data-testid=\"stripe-connected\"]')).toBeVisible();
  }
  
  async createMarketplaceProduct() {
    await this.page.click('[data-testid=\"create-marketplace-product\"]');
    
    await this.page.fill('[data-testid=\"product-name\"]', 'Collision Course - Steamy Romance');
    await this.page.fill('[data-testid=\"product-price\"]', '699'); // $6.99
    
    // Set romance metadata
    await this.page.selectOption('[data-testid=\"product-genre\"]', 'contemporary');
    await this.page.selectOption('[data-testid=\"product-heat-level\"]', 'steamy');
    
    // Add tropes
    await this.page.click('[data-testid=\"product-trope-enemies-to-lovers\"]');
    await this.page.click('[data-testid=\"product-trope-second-chance\"]');
    
    await this.page.click('[data-testid=\"create-product\"]');
    await expect(this.page.locator('[data-testid=\"product-created\"]')).toBeVisible();
  }
  
  async viewAnalytics() {
    await this.page.click('[data-testid=\"analytics-tab\"]');
    
    // Romance-specific analytics
    await this.page.click('[data-testid=\"romance-analytics-subtab\"]');
    
    // Verify key metrics are displayed
    await expect(this.page.locator('[data-testid=\"trope-performance\"]')).toBeVisible();
    await expect(this.page.locator('[data-testid=\"heat-level-analysis\"]')).toBeVisible();
    await expect(this.page.locator('[data-testid=\"character-development-arc\"]')).toBeVisible();
    
    // Check ROI calculator
    await this.page.click('[data-testid=\"roi-calculator\"]');
    await expect(this.page.locator('[data-testid=\"profitability-chart\"]')).toBeVisible();
    
    // Market trends
    await this.page.click('[data-testid=\"market-trends\"]');
    await expect(this.page.locator('[data-testid=\"genre-trends\"]')).toBeVisible();
  }
}

// Test Suite
test.describe('Romance Publishing Platform E2E Workflow', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;
  let workflow: RomancePublishingWorkflow;
  
  test.beforeAll(async () => {
    browser = await chromium.launch();
  });
  
  test.beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
    workflow = new RomancePublishingWorkflow(page);
  });
  
  test.afterEach(async () => {
    await context.close();
  });
  
  test.afterAll(async () => {
    await browser.close();
  });

  test('Complete Romance Publishing Workflow', async () => {
    // Step 1: Login and project setup
    await workflow.login();
    await workflow.createRomanceProject('Collision Course', 'contemporary');
    
    // Step 2: Series and character setup
    await workflow.setupRomanceSeries('Downtown Hearts', 3);
    await workflow.addCharacters();
    await workflow.setupCharacterRelationships();
    
    // Step 3: Content creation with AI
    await workflow.writeWithAI();
    await workflow.enhanceWithDialogueCoach();
    await workflow.analyzeTension();
    
    // Step 4: Quality assurance
    await workflow.validateHeatLevel();
    await workflow.editWithRomanceEditor();
    
    // Step 5: Publishing pipeline
    await workflow.designBookCover();
    await workflow.generateBlurb();
    await workflow.optimizeMetadata();
    
    // Step 6: Distribution
    await workflow.publishToKDP();
    await workflow.setupMarketplace();
    await workflow.createMarketplaceProduct();
    
    // Step 7: Analytics and insights
    await workflow.viewAnalytics();
  });
  
  test('AI-Assisted Scene Development Workflow', async () => {
    await workflow.login();
    await workflow.createRomanceProject('Test Romance', 'paranormal');
    await workflow.addCharacters();
    
    // Romance Coach: Plan the scene
    await page.click('[data-testid=\"ai-assistant-button\"]');
    await page.selectOption('[data-testid=\"ai-persona-select\"]', 'romance_coach');
    await page.fill('[data-testid=\"ai-prompt-input\"]', 'Plan a first kiss scene for enemies-to-lovers');
    await page.click('[data-testid=\"generate-ai-content\"]');
    await expect(page.locator('[data-testid=\"coach-plan\"]')).toBeVisible();
    
    // Romance Muse: Write the scene
    await page.selectOption('[data-testid=\"ai-persona-select\"]', 'romance_muse');
    await page.fill('[data-testid=\"ai-prompt-input\"]', 'Write the first kiss scene following the plan');
    await page.click('[data-testid=\"generate-ai-content\"]');
    await page.click('[data-testid=\"insert-ai-content\"]');
    
    // Tension Builder: Analyze and enhance
    await workflow.analyzeTension();
    
    // Dialogue Coach: Refine dialogue
    await workflow.enhanceWithDialogueCoach();
    
    // Romance Editor: Final review
    await workflow.editWithRomanceEditor();
    
    // Verify the scene meets romance standards
    await expect(page.locator('[data-testid=\"document-editor\"]')).toContainText('kiss');
    await expect(page.locator('[data-testid=\"tension-score\"]')).toContainText(/[7-9][0-9]*/);
  });
  
  test('Trope Consistency Validation', async () => {
    await workflow.login();
    await workflow.createRomanceProject('Trope Test', 'contemporary');
    
    // Add conflicting tropes
    await page.click('[data-testid=\"tropes-tab\"]');
    await page.click('[data-testid=\"add-trope-button\"]');
    await page.click('[data-testid=\"trope-enemies-to-lovers\"]');
    await page.click('[data-testid=\"trope-instalove\"]'); // Conflicting trope
    
    // System should detect conflict
    await expect(page.locator('[data-testid=\"trope-conflict-warning\"]')).toBeVisible();
    await expect(page.locator('[data-testid=\"conflict-explanation\"]')).toContainText('enemies-to-lovers');
    
    // Remove conflicting trope
    await page.click('[data-testid=\"remove-trope-instalove\"]');
    await expect(page.locator('[data-testid=\"trope-conflict-warning\"]')).not.toBeVisible();
    
    // Add compatible trope
    await page.click('[data-testid=\"trope-slow-burn\"]');
    await expect(page.locator('[data-testid=\"trope-compatibility-good\"]')).toBeVisible();
  });
  
  test('Heat Level Consistency Check', async () => {
    await workflow.login();
    await workflow.createRomanceProject('Heat Test', 'erotic');
    
    // Set target heat level
    await page.click('[data-testid=\"heat-level-tab\"]');
    await page.selectOption('[data-testid=\"target-heat-level\"]', 'sweet');
    
    // Write content with higher heat level
    await page.click('[data-testid=\"documents-tab\"]');
    await page.click('[data-testid=\"create-document-button\"]');
    await page.fill('[data-testid=\"document-title\"]', 'Test Scene');
    await page.click('[data-testid=\"create-document-submit\"]');
    
    // Add explicit content
    await page.fill(
      '[data-testid=\"document-editor\"]', 
      'They passionately embraced, their bodies pressed together in heated desire...'
    );
    
    // Run heat level analysis
    await page.click('[data-testid=\"heat-level-tab\"]');
    await page.click('[data-testid=\"analyze-heat-level\"]');
    
    // Should detect inconsistency
    await expect(page.locator('[data-testid=\"heat-inconsistency\"]')).toBeVisible();
    await expect(page.locator('[data-testid=\"detected-level\"]')).toContainText('steamy');
    await expect(page.locator('[data-testid=\"target-level\"]')).toContainText('sweet');
  });
  
  test('Publishing Pipeline Integration', async () => {
    await workflow.login();
    await workflow.createRomanceProject('Pipeline Test', 'contemporary');
    
    // Complete content creation
    await workflow.addCharacters();
    await workflow.writeWithAI();
    
    // Design and generate cover
    await workflow.designBookCover();
    
    // Generate marketing copy
    await workflow.generateBlurb();
    
    // Optimize for discovery
    await workflow.optimizeMetadata();
    
    // Export for publishing
    await page.click('[data-testid=\"export-tab\"]');
    await page.click('[data-testid=\"export-kdp-ready\"]');
    
    // Verify all components are included
    await expect(page.locator('[data-testid=\"export-manuscript\"]')).toBeVisible();
    await expect(page.locator('[data-testid=\"export-cover\"]')).toBeVisible();
    await expect(page.locator('[data-testid=\"export-metadata\"]')).toBeVisible();
    await expect(page.locator('[data-testid=\"export-blurb\"]')).toBeVisible();
    
    // Download export package
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid=\"download-export\"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('Pipeline_Test_KDP_Package');
  });
  
  test('Marketplace Transaction Flow', async () => {
    await workflow.login();
    await workflow.createRomanceProject('Marketplace Test', 'paranormal');
    
    // Setup seller account
    await workflow.setupMarketplace();
    await workflow.createMarketplaceProduct();
    
    // Simulate buyer journey (in real test, this would be a separate user)
    await page.goto('/marketplace');
    
    // Browse romance products
    await page.click('[data-testid=\"filter-genre-paranormal\"]');
    await page.click('[data-testid=\"filter-heat-steamy\"]');
    
    // Find and view product
    await page.click('[data-testid=\"product-marketplace-test\"]');
    await expect(page.locator('[data-testid=\"product-details\"]')).toBeVisible();
    await expect(page.locator('[data-testid=\"trope-tags\"]')).toBeVisible();
    
    // Add to cart and checkout
    await page.click('[data-testid=\"add-to-cart\"]');
    await page.click('[data-testid=\"checkout-button\"]');
    
    // Verify Stripe checkout integration
    await expect(page.locator('[data-testid=\"stripe-checkout\"]')).toBeVisible();
    
    // Mock successful payment
    await page.evaluate(() => {
      window.postMessage({ type: 'PAYMENT_SUCCESS', sessionId: 'cs_test123' }, '*');
    });
    
    await expect(page.locator('[data-testid=\"purchase-success\"]')).toBeVisible();
  });
  
  test('Analytics and ROI Tracking', async () => {
    await workflow.login();
    await workflow.createRomanceProject('Analytics Test', 'contemporary');
    
    // Setup complete project
    await workflow.addCharacters();
    await workflow.writeWithAI();
    await workflow.createMarketplaceProduct();
    
    // View comprehensive analytics
    await workflow.viewAnalytics();
    
    // Test ROI calculator
    await page.click('[data-testid=\"roi-calculator\"]');
    await page.fill('[data-testid=\"production-cost\"]', '2000');
    await page.fill('[data-testid=\"marketing-cost\"]', '500');
    await page.fill('[data-testid=\"book-price\"]', '4.99');
    await page.fill('[data-testid=\"expected-sales\"]', '1000');
    
    await page.click('[data-testid=\"calculate-roi\"]');
    
    // Verify ROI calculations
    await expect(page.locator('[data-testid=\"total-revenue\"]')).toContainText('4,990');
    await expect(page.locator('[data-testid=\"total-costs\"]')).toContainText('2,500');
    await expect(page.locator('[data-testid=\"net-profit\"]')).toContainText('2,490');
    await expect(page.locator('[data-testid=\"roi-percentage\"]')).toContainText('99.6%');
    
    // Test market trends analysis
    await page.click('[data-testid=\"market-trends\"]');
    await expect(page.locator('[data-testid=\"trending-tropes\"]')).toBeVisible();
    await expect(page.locator('[data-testid=\"genre-performance\"]')).toBeVisible();
    await expect(page.locator('[data-testid=\"seasonal-trends\"]')).toBeVisible();
  });
});"