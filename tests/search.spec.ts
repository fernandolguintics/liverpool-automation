import { test, expect } from '@playwright/test';
import { SearchPage } from '../pages/searchPage';
import { crossValidate } from '../utils/interceptor';

test.describe('Liverpool - Búsqueda PS5', () => {

  test('Buscar PS5, filtrar por blanco, ordenar por precio y validar resultados', async ({ page }) => {
    const searchPage = new SearchPage(page);

    console.log('\n🚀 Iniciando flujo E2E en Liverpool...');

    await searchPage.navigate();
    console.log('✅ Navegó a Liverpool');

    await searchPage.search('playstation 5');
    console.log('✅ Búsqueda realizada');

    await searchPage.filterByColor('Blanco');
    console.log('✅ Filtro de color aplicado: Blanco');

    // Preparar captura ANTES del sort
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('getPlpFilter') && res.status() === 202,
      { timeout: 20000 }
    );

    await searchPage.sortByPriceAsc();
    console.log('✅ Ordenado por precio: menor a mayor');

    // Capturar respuesta de red
    let interceptedProducts: { name: string; price: number }[] = [];
    try {
      const response = await responsePromise;
      const json = await response.json();
      const records = json?.mainContent?.records || [];
      interceptedProducts = records.map((r: any) => ({
        name: String(r._t || '').trim(),
        price: Number(r?.allMeta?.variants?.[0]?.prices?.salePrice || 0)
      }));
      console.log(`🌐 Productos interceptados: ${interceptedProducts.length}`);
    } catch (e) {
      console.warn('⚠️ No se pudo interceptar la respuesta de red');
    }

    const uiProducts = await searchPage.getFirstNProducts(5);

    console.log('\n🛍️  Primeros 5 productos encontrados:');
    console.log('======================================');
    uiProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} — ${p.price}`);
    });
    console.log('======================================\n');

    expect(uiProducts.length).toBeGreaterThan(0);
    expect(uiProducts.length).toBeLessThanOrEqual(5);

    // ── Part 2: Cross-validation UI vs Red ───────────────────────
    if (interceptedProducts.length > 0) {
      crossValidate(uiProducts, interceptedProducts);

      const matches = uiProducts.filter(uiProduct => {
        const uiName = uiProduct.name.toLowerCase();
        const uiPrice = parseFloat(uiProduct.price.replace(/[^0-9.]/g, ''));

        return interceptedProducts.some(ip => {
          const apiName = ip.name.toLowerCase();
          const priceSimilar = Math.abs(ip.price - uiPrice) < 5;
          const nameSimilar = apiName.includes(uiName.substring(0, 15)) ||
                              uiName.includes(apiName.substring(0, 15));
          return priceSimilar || nameSimilar;
        });
      });

      console.log(`📈 Matches encontrados: ${matches.length}/5`);

      expect(
        matches.length,
        `Solo ${matches.length}/5 productos del UI aparecen en la respuesta de red`
      ).toBeGreaterThanOrEqual(3);

    } else {
      console.warn('⚠️  No se interceptaron productos de red, validando solo UI');
      expect(uiProducts.length).toBeGreaterThanOrEqual(1);
    }
  });

});