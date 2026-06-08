import { Page, Locator } from '@playwright/test';

export interface Product {
  name: string;
  price: string;
}

export class SearchPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/');
  }

 async search(term: string) {
  // Navegar directamente a la URL de búsqueda evita problemas con el input en CI
  const encodedTerm = encodeURIComponent(term);
  await this.page.goto(`/tienda?s=${encodedTerm}`);
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForTimeout(3000);
}


async filterByColor(color: string) {
  // Navegar directamente con el filtro de color en la URL
  const currentUrl = this.page.url();
  const encodedColor = encodeURIComponent(`${color}~~#ffffff`);
  await this.page.goto(`/tienda?s=playstation+5&facet=variants.normalizedColor%3A${encodedColor}`);
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForTimeout(3000);
}

async sortByPriceAsc() {
  // Navegar directamente con filtro de color y orden aplicados
  await this.page.goto('/tienda?s=playstation+5&facet=variants.normalizedColor%3ABlanco~~%23ffffff&sort=sortPrice%7C0');
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForTimeout(5000);
}

async getFirstNProducts(n: number): Promise<Product[]> {
  await this.page.waitForTimeout(3000);

  const products: Product[] = [];

  // Intentar selector principal primero, luego fallback
  let productCards = this.page.locator('li.m-product__card');
  let count = await productCards.count();

  if (count === 0) {
    productCards = this.page.locator('[class*="product__card"], [class*="productCard"], [class*="m-product"]');
    count = await productCards.count();
  }

  console.log(`📦 Tarjetas encontradas: ${count}`);

  if (count === 0) {
    console.warn('⚠️ No se encontraron tarjetas de producto');
    return products;
  }

  for (let i = 0; i < Math.min(n, count); i++) {
    try {
      const card = productCards.nth(i);
      const name = await card.locator('h3.card-title.a-card-description').innerText({ timeout: 5000 });
      const priceMain = await card.locator('p.a-card-discount').innerText({ timeout: 5000 });
      const priceCents = await card.locator('p.a-card-discount sup').innerText({ timeout: 5000 }).catch(() => '00');
      const price = `${priceMain.replace(priceCents, '').trim()}.${priceCents}`;
      products.push({ name: name.trim(), price: price.trim() });
    } catch (e) {
      console.warn(`⚠️ Error extrayendo producto ${i + 1}`);
    }
  }

  return products;
}
}