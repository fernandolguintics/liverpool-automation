import { Page } from '@playwright/test';
import { Product } from '../pages/SearchPage';

export interface InterceptedProduct {
  name: string;
  price: number;
}

export async function setupInterceptor(page: Page): Promise<() => Promise<InterceptedProduct[]>> {
  const captured: InterceptedProduct[] = [];

  page.on('response', async (response) => {
  try {
    const url = response.url();
    if (url.includes('getPlpFilter')) {
      console.log('🌐 Interceptada URL:', url.substring(0, 80));
      if (response.status() === 200) {
        const json = await response.json();
        const records = json?.mainContent?.records || [];
        console.log(`📦 Productos en respuesta: ${records.length}`);
        // ... resto del código
      }
    }
  } catch (e) {
    console.warn('Error interceptando:', e);
  }
});

  return async () => captured;
}

export function crossValidate(
  uiProducts: Product[],
  interceptedProducts: InterceptedProduct[]
): void {
  console.log('\n📊 Cross-validación UI vs Red:');
  console.log('================================');

  let matches = 0;

  for (const uiProduct of uiProducts) {
    const uiPrice = parseFloat(uiProduct.price.replace(/[^0-9.]/g, ''));
    const uiName = uiProduct.name.toLowerCase();

    const match = interceptedProducts.find((ip) => {
      const nameSimilar = ip.name.toLowerCase().includes(uiName.substring(0, 20)) ||
                          uiName.includes(ip.name.toLowerCase().substring(0, 20));
      const priceSimilar = Math.abs(ip.price - uiPrice) < 10;
      return nameSimilar || priceSimilar;
    });

    if (match) {
      matches++;
      console.log(`✅ Match: "${uiProduct.name}" | UI: $${uiPrice} | Red: $${match.price}`);
    } else {
      console.warn(`❌ Sin match: "${uiProduct.name}" | UI: $${uiPrice}`);
    }
  }

  console.log(`\n📈 Resultado: ${matches}/5 productos validados contra la red`);
  console.log('================================\n');
}