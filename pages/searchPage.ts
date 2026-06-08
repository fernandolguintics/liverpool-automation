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
  await this.page.waitForTimeout(3000);
  
  const colorFilter = this.page.locator(`a#variants-normalizedColor-${color}`);
  await colorFilter.waitFor({ timeout: 15000 });
  await colorFilter.scrollIntoViewIfNeeded();
  await colorFilter.click();
  await this.page.waitForLoadState('domcontentloaded');
  await this.page.waitForTimeout(2000);
}

async sortByPriceAsc() {
  await this.page.waitForTimeout(2000);

  // Abrir dropdown y hacer click via JS directo
  await this.page.evaluate(() => {
    const btn = document.querySelector('a#sortby') as HTMLElement;
    if (btn) btn.click();
  });
  await this.page.waitForTimeout(1000);

  await this.page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button.dropdown-item'));
    const menor = buttons.find(b => b.textContent?.includes('Menor precio')) as HTMLElement;
    if (menor) menor.click();
  });

  await this.page.waitForTimeout(3000);
}

 async getFirstNProducts(n: number): Promise<Product[]> {
  await this.page.waitForTimeout(3000);

  const products: Product[] = [];
  const productCards = this.page.locator('li.m-product__card');

  await productCards.first().waitFor({ timeout: 15000 });
  const count = await productCards.count();
  console.log(`📦 Tarjetas encontradas: ${count}`);

  for (let i = 0; i < Math.min(n, count); i++) {
    const card = productCards.nth(i);
    const name = await card.locator('h3.card-title.a-card-description').innerText({ timeout: 5000 });
    const priceMain = await card.locator('p.a-card-discount').innerText({ timeout: 5000 });
    const priceCents = await card.locator('p.a-card-discount sup').innerText({ timeout: 5000 }).catch(() => '00');
    const price = `${priceMain.replace(priceCents, '').trim()}.${priceCents}`;
    products.push({ name: name.trim(), price: price.trim() });
  }

  return products;
  }
}