import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, Page } from 'playwright';
import { RecommendedProduct, ScrapingResult } from '../common/interfaces/product.interface';

export interface ScraperOptions {
  url?: string;
  username?: string;
  password?: string;
  maxProducts?: number;
  timeout?: number;
  headless?: boolean;
  useCache?: boolean;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private browser: Browser | null = null;

  constructor(private readonly configService: ConfigService) {}

  async scrapeRecommendedProducts(options: ScraperOptions = {}): Promise<ScrapingResult> {
    const startTime = Date.now();
    const {
      url = this.configService.get('EMARSYS_URL') || 'https://extend.emarsys.com',
      username = this.configService.get('EMARSYS_USERNAME'),
      password = this.configService.get('EMARSYS_PASSWORD'),
      maxProducts = 100,
      timeout = parseInt(this.configService.get('SCRAPING_TIMEOUT') || '60000'),
      headless = true,
    } = options;

    this.logger.log(`Starting scraping session for URL: ${url}`);

    try {
      await this.initBrowser(headless);
      if (!this.browser) {
        throw new Error('Failed to initialize browser');
      }
      const page = await this.browser.newPage();

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.setDefaultTimeout(timeout);

      if (username && password) {
        await this.login(page, url, username, password);
      }

      const products = await this.extractProducts(page, url, maxProducts);

      await page.close();

      const duration = Date.now() - startTime;
      this.logger.log(`Scraping completed successfully. Found ${products.length} products in ${duration}ms`);

      return {
        success: true,
        products,
        totalProducts: products.length,
        scrapedAt: new Date(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Scraping failed: ${error.message}`, error.stack);

      return {
        success: false,
        products: [],
        totalProducts: 0,
        scrapedAt: new Date(),
        duration,
        error: error.message,
      };
    }
  }

  private async initBrowser(headless: boolean): Promise<void> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('Launching browser...');
      this.browser = await chromium.launch({
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
    }
  }

  private async login(page: Page, url: string, username: string, password: string): Promise<void> {
    this.logger.log('Attempting to login...');

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      const loginSelectors = {
        username: ['input[name="username"]', 'input[type="email"]', '#username', '#email'],
        password: ['input[name="password"]', 'input[type="password"]', '#password'],
        submit: ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Login")', 'button:has-text("Sign in")'],
      };

      for (const selector of loginSelectors.username) {
        if (await page.locator(selector).count() > 0) {
          await page.fill(selector, username);
          break;
        }
      }

      for (const selector of loginSelectors.password) {
        if (await page.locator(selector).count() > 0) {
          await page.fill(selector, password);
          break;
        }
      }

      for (const selector of loginSelectors.submit) {
        if (await page.locator(selector).count() > 0) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            page.click(selector),
          ]);
          break;
        }
      }

      this.logger.log('Login successful');
    } catch (error) {
      this.logger.error('Login failed', error.stack);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  private async extractProducts(page: Page, url: string, maxProducts: number): Promise<RecommendedProduct[]> {
    this.logger.log('Extracting products...');

    try {
      if (!url.includes('login')) {
        await page.goto(url, { waitUntil: 'networkidle' });
      }

      await page.waitForTimeout(2000);

      const productSelectors = [
        '.product-card',
        '.product-item',
        '[data-testid="product"]',
        '.recommended-product',
        'article.product',
        '.product',
      ];

      let productElements: string | null = null;
      for (const selector of productSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          productElements = selector;
          this.logger.log(`Found ${count} products using selector: ${selector}`);
          break;
        }
      }

      if (!productElements) {
        this.logger.warn('No products found with common selectors, trying custom extraction');
        return await this.customExtraction(page);
      }

      const products: RecommendedProduct[] = [];
      const productCount = Math.min(await page.locator(productElements).count(), maxProducts);

      for (let i = 0; i < productCount; i++) {
        try {
          const element = page.locator(productElements).nth(i);

          const product: RecommendedProduct = {
            id: await this.safeGetAttribute(element, '[data-product-id]', 'data-product-id') || `product-${i}`,
            name: await this.safeGetText(element, '.product-name, .title, h2, h3') || `Product ${i + 1}`,
            description: await this.safeGetText(element, '.description, .product-description, p'),
            price: await this.extractPrice(element),
            currency: await this.extractCurrency(element),
            imageUrl: await this.safeGetAttribute(element, 'img', 'src'),
            url: await this.safeGetAttribute(element, 'a', 'href'),
            category: await this.safeGetText(element, '.category, .product-category'),
            brand: await this.safeGetText(element, '.brand, .product-brand'),
            sku: await this.safeGetAttribute(element, '[data-sku]', 'data-sku'),
            inStock: await this.checkInStock(element),
            rating: await this.extractRating(element),
            reviewCount: await this.extractReviewCount(element),
            scrapedAt: new Date(),
          };

          products.push(product);
        } catch (error) {
          this.logger.warn(`Failed to extract product ${i}: ${error.message}`);
        }
      }

      return products;
    } catch (error) {
      this.logger.error('Product extraction failed', error.stack);
      throw new Error(`Product extraction failed: ${error.message}`);
    }
  }

  private async customExtraction(page: Page): Promise<RecommendedProduct[]> {
    this.logger.log('Attempting custom extraction strategy...');

    const products = await page.evaluate(() => {
      const extractedProducts: Array<{
        id: string;
        name: string;
        imageUrl: string | null;
        url: string | null;
      }> = [];

      const findProductContainers = () => {
        const possibleContainers = document.querySelectorAll('div[class*="product"], div[class*="item"], article');
        return Array.from(possibleContainers).filter(el => {
          const text = el.textContent.toLowerCase();
          return text.length > 50 && (
            el.querySelector('img') !== null ||
            text.includes('price') ||
            text.includes('$') ||
            text.includes('€')
          );
        });
      };

      const containers = findProductContainers().slice(0, 50);

      containers.forEach((container, index) => {
        const getText = (selectors: string[]) => {
          for (const selector of selectors) {
            const el = container.querySelector(selector);
            if (el) return el.textContent.trim();
          }
          return '';
        };

        const getAttr = (selectors: string[], attr: string) => {
          for (const selector of selectors) {
            const el = container.querySelector(selector);
            if (el) return el.getAttribute(attr);
          }
          return null;
        };

        extractedProducts.push({
          id: getAttr(['[data-id]', '[data-product-id]'], 'data-id') || `product-${index}`,
          name: getText(['h1', 'h2', 'h3', 'h4', '.title', '.name']),
          imageUrl: getAttr(['img'], 'src'),
          url: getAttr(['a'], 'href'),
        });
      });

      return extractedProducts;
    });

    return products.map((p: any, index: number) => ({
      ...p,
      scrapedAt: new Date(),
      name: p.name || `Product ${index + 1}`,
    }));
  }

  private async safeGetText(parent: any, selector: string): Promise<string | undefined> {
    try {
      const element = parent.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        return await element.textContent();
      }
    } catch (error) {
      // Silent fail
    }
    return undefined;
  }

  private async safeGetAttribute(parent: any, selector: string, attribute: string): Promise<string | undefined> {
    try {
      const element = parent.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        return await element.getAttribute(attribute);
      }
    } catch (error) {
      // Silent fail
    }
    return undefined;
  }

  private async extractPrice(element: any): Promise<number | undefined> {
    const priceText = await this.safeGetText(element, '.price, .product-price, [data-price]');
    if (!priceText) return undefined;

    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : undefined;
  }

  private async extractCurrency(element: any): Promise<string | undefined> {
    const priceText = await this.safeGetText(element, '.price, .product-price, [data-price]');
    if (!priceText) return undefined;

    if (priceText.includes('$')) return 'USD';
    if (priceText.includes('€')) return 'EUR';
    if (priceText.includes('£')) return 'GBP';
    return undefined;
  }

  private async checkInStock(element: any): Promise<boolean | undefined> {
    const stockText = await this.safeGetText(element, '.stock, .availability, [data-stock]');
    if (!stockText) return undefined;

    const text = stockText.toLowerCase();
    if (text.includes('in stock') || text.includes('available')) return true;
    if (text.includes('out of stock') || text.includes('unavailable')) return false;
    return undefined;
  }

  private async extractRating(element: any): Promise<number | undefined> {
    const ratingText = await this.safeGetText(element, '.rating, .stars, [data-rating]');
    if (!ratingText) return undefined;

    const match = ratingText.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : undefined;
  }

  private async extractReviewCount(element: any): Promise<number | undefined> {
    const reviewText = await this.safeGetText(element, '.reviews, .review-count, [data-reviews]');
    if (!reviewText) return undefined;

    const match = reviewText.match(/\d+/);
    return match ? parseInt(match[0]) : undefined;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }
}
