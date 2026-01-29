/**
 * Test de recomendaciones con CPF: 70653456298
 */

const BASE_URL = 'http://localhost:3000';
const MY_CPF = '70653456298';

async function getRecommendations() {
  console.log('🚀 Iniciando solicitud de recomendaciones...\n');

  // 1. Iniciar el job
  console.log('1️⃣ Enviando request con CPF:', MY_CPF);
  const response = await fetch(`${BASE_URL}/api/scraping/recommendations/cpf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cpf: MY_CPF,
      recommendLogic: 'PERSONAL',
      limit: 10,
      headless: true,
      useCache: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const job = await response.json();
  console.log('✅ Job creado:', job);
  console.log('   Job ID:', job.id);
  console.log('   Status:', job.status);
  console.log('');

  // 2. Polling - esperar a que complete
  console.log('2️⃣ Esperando a que el job complete...');
  const jobId = job.id;
  let attempts = 0;
  const maxAttempts = 60; // 2 minutos max (60 * 2s)

  while (attempts < maxAttempts) {
    attempts++;

    // Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Consultar estado
    const statusResponse = await fetch(`${BASE_URL}/api/scraping/jobs/${jobId}`);
    const jobStatus = await statusResponse.json();

    console.log(`   [Intento ${attempts}/${maxAttempts}] Status: ${jobStatus.status}`);

    // Verificar si completó
    if (jobStatus.status === 'completed') {
      console.log('\n🎉 ¡Job completado exitosamente!\n');
      return jobStatus.result;
    }

    // Verificar si falló
    if (jobStatus.status === 'failed') {
      console.error('\n❌ Job falló:', jobStatus.error);
      throw new Error(jobStatus.error);
    }
  }

  throw new Error('⏱️ Timeout: El job no completó en el tiempo esperado');
}

async function displayResults(result: any) {
  console.log('📊 RESULTADOS DEL SCRAPING');
  console.log('=' .repeat(80));
  console.log('Success:', result.success);
  console.log('Total de productos:', result.totalProducts);
  console.log('Duración:', result.duration, 'ms');
  console.log('Fecha:', result.scrapedAt);
  console.log('');

  if (result.products && result.products.length > 0) {
    console.log('🛍️ PRODUCTOS RECOMENDADOS PARA CPF:', MY_CPF);
    console.log('=' .repeat(80));
    console.log('');

    result.products.forEach((product: any, index: number) => {
      console.log(`📦 Producto ${index + 1}`);
      console.log('-'.repeat(80));
      console.log('  ID:', product.id);
      console.log('  Nombre:', product.name);
      if (product.description) {
        console.log('  Descripción:', product.description);
      }
      if (product.price) {
        console.log('  Precio:', product.price, product.currency || '');
      }
      if (product.category) {
        console.log('  Categoría:', product.category);
      }
      if (product.brand) {
        console.log('  Marca:', product.brand);
      }
      if (product.rating) {
        console.log('  Rating:', product.rating, '⭐');
      }
      if (product.url) {
        console.log('  URL:', product.url);
      }
      if (product.imageUrl) {
        console.log('  Imagen:', product.imageUrl);
      }
      console.log('');
    });
  } else {
    console.log('⚠️ No se encontraron productos recomendados');
  }
}

async function testDifferentLogics() {
  const logics = ['PERSONAL', 'RELATED', 'POPULAR', 'ALSO_BOUGHT'];

  console.log('\n🔄 Probando diferentes lógicas de recomendación...\n');

  for (const logic of logics) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 Probando lógica: ${logic}`);
    console.log('='.repeat(80));

    const response = await fetch(`${BASE_URL}/api/scraping/recommendations/cpf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf: MY_CPF,
        recommendLogic: logic,
        limit: 5,
        headless: true,
      }),
    });

    const job = await response.json();
    console.log('Job creado:', job.id, '- Status:', job.status);

    // Esperar un poco antes de la siguiente
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✅ Jobs creados para todas las lógicas');
  console.log('💡 Usa GET /api/scraping/jobs para ver todos los jobs');
}

async function checkStats() {
  console.log('\n📈 ESTADÍSTICAS DE LA COLA\n');

  const response = await fetch(`${BASE_URL}/api/scraping/stats`);
  const stats = await response.json();

  console.log('Esperando:', stats.waiting);
  console.log('Activos:', stats.active);
  console.log('Completados:', stats.completed);
  console.log('Fallidos:', stats.failed);
  console.log('Total:', stats.total);
}

// Función principal
async function main() {
  try {
    // Opción 1: Test básico
    const result = await getRecommendations();
    await displayResults(result);

    // Opción 2: Probar diferentes lógicas (comentado por defecto)
    // await testDifferentLogics();

    // Ver estadísticas
    await checkStats();

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  Test de Recomendaciones por CPF - Emarsys Scarab           ║
║  CPF: 70653456298                                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  main();
}

export { getRecommendations, displayResults, testDifferentLogics, checkStats };
