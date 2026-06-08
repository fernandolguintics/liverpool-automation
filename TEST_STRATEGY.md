# Estrategia de Pruebas — Flujo de Búsqueda PS5 en Liverpool

## ¿Qué NO automatizaría?

El flujo de pago y checkout no debe automatizarse en esta suite.
Crear órdenes reales genera transacciones financieras, requiere cuentas de
prueba con métodos de pago válidos y depende de la disponibilidad de
inventario — factores que hacen las pruebas frágiles y potencialmente
costosas. De igual forma, los flujos de login protegidos con 2FA o CAPTCHA
agregan dependencias externas que rompen pipelines sin previo aviso. El
contenido visual como banners e imágenes promocionales cambia frecuentemente
por diseño; hacer assertions sobre ellos genera falsos positivos constantes
sin valor real de calidad.

## Manejo de CAPTCHA

Si Liverpool agregara un CAPTCHA al flujo de búsqueda, la estrategia sería:

1. **Usar un ambiente de staging** que omita el CAPTCHA por defecto. Este es
   el enfoque preferido — las suites de automatización nunca deben correr
   contra producción con protección activa contra bots.
2. **Token por variable de entorno**: negociar un header o token de bypass con
   el equipo de backend para el ambiente de pruebas (ej. `X-Test-Bypass: true`).
3. **Nunca resolver CAPTCHAs programáticamente** en CI. Servicios como
   2captcha existen pero introducen inestabilidad, costos y problemas éticos.
4. Si el CAPTCHA aparece inesperadamente en ejecuciones de monitoreo en
   producción, tratarlo como una anomalía detectada y generar una alerta en
   lugar de reintentar.

## Riesgos de Inestabilidad y Mitigaciones

| Riesgo | Mitigación aplicada |
|---|---|
| Los precios cambian en tiempo real | Assertions con tolerancia difusa (±$5) |
| Tarjetas de producto con lazy loading | `waitForSelector` en la primera tarjeta antes de iterar |
| El dropdown de orden está oculto por defecto | `click({ force: true })` + fallback con JS evaluate |
| `networkidle` nunca se dispara en SPAs | Reemplazado con `domcontentloaded` + esperas fijas |
| AB testing cambia los selectores | Selectores semánticos + fallbacks basados en ID |
| La API retorna 202 en lugar de 200 | Verificación de status actualizada tras observar tráfico real |
| Nombres de productos duplicados en resultados | Matching por precio como señal secundaria |

Los reintentos están configurados en 1 localmente y 2 en CI para absorber
problemas de red transitorios sin enmascarar fallas reales.

## Integración en un Pipeline de Equipo (50+ suites)

- **Etiquetar las pruebas** como `@smoke` o `@regression` para que el pipeline
  ejecute solo smoke tests en cada PR y regresión completa de noche.
- **Aislar dependencias del navegador** usando la imagen Docker oficial de
  Playwright para evitar conflictos con versiones de otros proyectos.
- **Cachear `node_modules` y los navegadores de Playwright** en CI para
  reducir el tiempo de instalación de ~2 minutos a ~15 segundos.
- **Establecer un timeout máximo** de 60 segundos por prueba para evitar que
  un test inestable bloquee todo el pipeline.
- **Subir reportes como artefactos** con una política de retención de 7 días —
  suficiente para depurar sin saturar el almacenamiento.
- **Ejecutar en paralelo** con 2 workers en CI para mantener el tiempo total
  de la suite por debajo de 2 minutos.
- **Alertar sobre la tasa de inestabilidad**, no solo sobre fallas. Una prueba
  que pasa 8 de cada 10 ejecuciones es un problema aunque nunca bloquee un merge.