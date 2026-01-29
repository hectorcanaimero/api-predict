import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, Page } from 'playwright';
import { RecommendedProduct, ScrapingResult } from '../common/interfaces/product.interface';

export interface ScarabScraperOptions {
  cpf: string;
  url?: string;
  scarabId?: string;
  recommendLogic?: string;
  limit?: number;
  includeCategories?: string[];
  excludeItems?: string[];
  username?: string;
  password?: string;
  timeout?: number;
  headless?: boolean;
  useCache?: boolean;
}

@Injectable()
export class ScarabScraperService {
  private readonly logger = new Logger(ScarabScraperService.name);
  private browser: Browser | null = null;

  constructor(private readonly configService: ConfigService) {}

  async scrapeRecommendationsByCpf(options: ScarabScraperOptions): Promise<ScrapingResult> {
    const startTime = Date.now();
    const {
      cpf,
      url = this.configService.get('EMARSYS_URL') || 'https://extend.emarsys.com',
      scarabId = this.configService.get('EMARSYS_SCARAB_ID') || '',
      recommendLogic = 'PERSONAL',
      limit = 10,
      includeCategories = [],
      excludeItems = [],
      username = this.configService.get('EMARSYS_USERNAME'),
      password = this.configService.get('EMARSYS_PASSWORD'),
      timeout = parseInt(this.configService.get('SCRAPING_TIMEOUT') || '60000'),
      headless = true,
    } = options;

    this.logger.log(`Starting Scarab scraping for CPF: ${this.maskCpf(cpf)}`);

    try {
      await this.initBrowser(headless);
      if (!this.browser) {
        throw new Error('Failed to initialize browser');
      }
      const page = await this.browser.newPage();

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.setDefaultTimeout(timeout);

      // Login si es necesario
      if (username && password) {
        await this.login(page, url, username, password);
      } else {
        await page.goto(url, { waitUntil: 'networkidle' });
      }

      // Ejecutar scraping con Scarab
      const products = await this.executeScarabCommands(
        page,
        cpf,
        scarabId,
        recommendLogic,
        limit,
        includeCategories,
        excludeItems,
      );

      await page.close();

      const duration = Date.now() - startTime;
      this.logger.log(
        `Scraping completed successfully. Found ${products.length} products in ${duration}ms`,
      );

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

  private async executeScarabCommands(
    page: Page,
    cpf: string,
    scarabId: string,
    logic: string,
    limit: number,
    includeCategories: string[],
    excludeItems: string[],
  ): Promise<RecommendedProduct[]> {
    this.logger.log('Executing Scarab commands...');

    try {
      // Inyectar Scarab si no está presente
      if (scarabId) {
        await this.injectScarabScript(page, scarabId);
      }

      // Esperar a que Scarab esté disponible
      await page.waitForFunction(() => typeof window['ScarabQueue'] !== 'undefined', {
        timeout: 10000,
      });

      // Limpiar el CPF (remover puntos y guiones)
      const cleanCpf = cpf.replace(/[.-]/g, '');

      // Ejecutar comandos Scarab
      const products = await page.evaluate(
        async ({ cpfValue, logicValue, limitValue, includeCategories, excludeItems }) => {
          return new Promise<any[]>((resolve, reject) => {
            const ScarabQueue = (window as any)['ScarabQueue'] || [];
            const containerDivId = 'scarab-recommendations-' + Date.now();

            // Crear contenedor temporal para las recomendaciones
            const containerDiv = document.createElement('div');
            containerDiv.id = containerDivId;
            containerDiv.style.display = 'none';
            document.body.appendChild(containerDiv);

            // Crear template para capturar los productos
            const template = `
              <script type="text/html" id="scarab-tmpl-${containerDivId}">
                <![CDATA[
                  {{ for (var i=0; i < SC.page.products.length; i++) { }}
                    {{ var p = SC.page.products[i]; }}
                    <div data-scarab-product='{{= JSON.stringify(p) }}'></div>
                  {{ } }}
                ]]>
              </script>
            `;

            const templateEl = document.createElement('div');
            templateEl.innerHTML = template;
            document.body.appendChild(templateEl);

            // Aplicar filtros de exclusión
            if (excludeItems && excludeItems.length > 0) {
              ScarabQueue.push(['exclude', 'item', 'in', excludeItems]);
            }

            // Aplicar filtros de inclusión por categoría
            if (includeCategories && includeCategories.length > 0) {
              includeCategories.forEach((category: string) => {
                ScarabQueue.push(['include', 'category', 'has', category]);
              });
            }

            // Setear el customer ID (CPF)
            ScarabQueue.push(['setCustomerId', cpfValue]);

            // Solicitar recomendaciones
            const templateElement = document.getElementById(`scarab-tmpl-${containerDivId}`);
            if (!templateElement) {
              reject(new Error('Template element not found'));
              return;
            }

            ScarabQueue.push([
              'recommend',
              logicValue,
              containerDivId,
              limitValue,
              templateElement.innerHTML,
            ]);

            // Ejecutar comandos
            ScarabQueue.push(['go']);

            // Esperar y extraer resultados
            setTimeout(() => {
              try {
                const productElements = containerDiv.querySelectorAll('[data-scarab-product]');
                const extractedProducts: any[] = [];

                productElements.forEach((el) => {
                  try {
                    const attrValue = el.getAttribute('data-scarab-product');
                    if (attrValue) {
                      const productData = JSON.parse(attrValue);
                      extractedProducts.push(productData);
                    }
                  } catch (e) {
                    console.error('Error parsing product:', e);
                  }
                });

                resolve(extractedProducts);
              } catch (error) {
                reject(error);
              }
            }, 5000); // Esperar 5 segundos para que Scarab procese
          });
        },
        {
          cpfValue: cleanCpf,
          logicValue: logic,
          limitValue: limit,
          includeCategories,
          excludeItems,
        },
      );

      // Convertir a nuestro formato
      return products.map((p: any, index: number) => ({
        id: p.id || p.item || `product-${index}`,
        name: p.title || p.name || `Product ${index + 1}`,
        description: p.description || p.desc || undefined,
        price: p.price ? parseFloat(p.price) : undefined,
        currency: p.currency || undefined,
        imageUrl: p.image || p.imageUrl || p.img || undefined,
        url: p.link || p.url || undefined,
        category: p.category || undefined,
        brand: p.brand || undefined,
        sku: p.sku || undefined,
        inStock: p.available !== undefined ? p.available : undefined,
        rating: p.rating ? parseFloat(p.rating) : undefined,
        reviewCount: p.reviewCount ? parseInt(p.reviewCount) : undefined,
        metadata: p,
        scrapedAt: new Date(),
      }));
    } catch (error) {
      this.logger.error('Scarab command execution failed', error.stack);
      throw new Error(`Scarab execution failed: ${error.message}`);
    }
  }

  private async injectScarabScript(page: Page, scarabId: string): Promise<void> {
    this.logger.log(`Injecting Scarab script with ID: ${scarabId}`);

    await page.addScriptTag({
      content: `
        var ScarabQueue = ScarabQueue || [];
        (function(id) {
          if (document.getElementById('scarab-js-api')) return;
          var js = document.createElement('script');
          js.id = 'scarab-js-api';
          js.src = '//cdn.scarabresearch.com/js/${scarabId}/scarab-v2.js';
          var fs = document.getElementsByTagName('script')[0];
          fs.parentNode.insertBefore(js, fs);
        })('scarab-js-api');
      `,
    });

    // Esperar a que el script se cargue
    await page.waitForTimeout(2000);
  }

  private async login(page: Page, url: string, username: string, password: string): Promise<void> {
    this.logger.log('Attempting to login...');

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      const loginSelectors = {
        username: ['input[name="username"]', 'input[type="email"]', '#username', '#email'],
        password: ['input[name="password"]', 'input[type="password"]', '#password'],
        submit: [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("Login")',
          'button:has-text("Sign in")',
        ],
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

  private maskCpf(cpf: string): string {
    const cleaned = cpf.replace(/[.-]/g, '');
    return `***.***.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
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
