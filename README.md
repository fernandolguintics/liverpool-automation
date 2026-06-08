## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd liverpool-automation

# Instalar dependencias
npm install

# Instalar navegadores de Playwright
npx playwright install
```

## Ejecución

### Modo headless (por defecto)
```bash
npx playwright test
```

### Modo headed (con navegador visible)
```bash
set HEADED=true && npx playwright test
```

### Un test específico
```bash
npx playwright test tests/search.spec.ts
```

### Ver el reporte HTML
```bash
npx playwright show-report
```

## Lo que automatiza

1. Navega a Liverpool.com.mx
2. Busca "playstation 5"
3. Filtra por color: Blanco
4. Ordena por precio: menor a mayor
5. Extrae nombre y precio de los primeros 5 productos
6. Intercepta la respuesta de red de la API
7. Valida que al menos 3 de 5 productos del UI coincidan con la respuesta de red

## CI/CD

El pipeline de GitHub Actions corre automáticamente en cada push. Ejecuta las pruebas en modo headless y sube el reporte HTML como artefacto.