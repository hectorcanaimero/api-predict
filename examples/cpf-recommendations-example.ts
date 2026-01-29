/**
 * Ejemplo de uso de la API de recomendaciones por CPF
 *
 * Este archivo muestra cómo usar el endpoint de recomendaciones
 * basadas en CPF usando Emarsys Scarab
 */

// Función para obtener recomendaciones por CPF
async function getRecommendationsByCpf(cpf: string) {
  const response = await fetch('http://localhost:3000/api/scraping/recommendations/cpf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: cpf, // Formato: "123.456.789-00" o "12345678900"
      scarabId: '1916F613C8B45191', // Tu Scarab ID
      recommendLogic: 'PERSONAL', // Lógica de recomendación
      limit: 10, // Número de productos
      headless: true,
      useCache: true,
    }),
  });

  const job = await response.json();
  console.log('Job de recomendaciones iniciado:', job);
  return job.id;
}

// Ejemplo con filtros de categoría
async function getRecommendationsWithCategoryFilter(cpf: string) {
  const response = await fetch('http://localhost:3000/api/scraping/recommendations/cpf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: cpf,
      scarabId: '1916F613C8B45191',
      recommendLogic: 'PERSONAL',
      limit: 5,
      includeCategories: ['WOMEN>Coats & Jackets', 'WOMEN>Dresses'],
      headless: true,
    }),
  });

  const job = await response.json();
  console.log('Job con filtro de categoría iniciado:', job);
  return job.id;
}

// Ejemplo con exclusión de productos
async function getRecommendationsWithExclusions(cpf: string) {
  const response = await fetch('http://localhost:3000/api/scraping/recommendations/cpf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: cpf,
      scarabId: '1916F613C8B45191',
      recommendLogic: 'PERSONAL',
      limit: 10,
      excludeItems: ['2540', '2538', '1234'], // IDs de productos a excluir
      headless: true,
    }),
  });

  const job = await response.json();
  console.log('Job con exclusiones iniciado:', job);
  return job.id;
}

// Función para verificar el estado de un job
async function checkJobStatus(jobId: string) {
  const response = await fetch(`http://localhost:3000/api/scraping/jobs/${jobId}`);
  const job = await response.json();
  console.log('Estado del job:', job);
  return job;
}

// Función para esperar a que un job se complete
async function waitForJobCompletion(jobId: string, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const job = await checkJobStatus(jobId);

    if (job.status === 'completed') {
      console.log('Job completado exitosamente!');
      console.log(`Total de productos recomendados: ${job.result.totalProducts}`);
      console.log(`Duración: ${job.result.duration}ms`);
      return job.result;
    }

    if (job.status === 'failed') {
      console.error('Job falló:', job.error);
      throw new Error(job.error);
    }

    console.log(`Esperando... (intento ${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
  }

  throw new Error('Timeout: el job no se completó a tiempo');
}

// Ejemplo completo de uso
async function exampleWithCpf() {
  try {
    console.log('=== Ejemplo de recomendaciones por CPF ===\n');

    const cpf = '123.456.789-00'; // CPF del cliente

    // 1. Solicitar recomendaciones
    console.log('1. Solicitando recomendaciones para CPF:', cpf);
    const jobId = await getRecommendationsByCpf(cpf);
    console.log(`Job ID: ${jobId}\n`);

    // 2. Esperar a que se complete
    console.log('2. Esperando a que el job se complete...');
    const result = await waitForJobCompletion(jobId);

    // 3. Mostrar resultados
    console.log('\n3. Productos recomendados:');
    result.products.forEach((product, index) => {
      console.log(`\n--- Producto ${index + 1} ---`);
      console.log(`ID: ${product.id}`);
      console.log(`Nombre: ${product.name}`);
      console.log(`Precio: ${product.price} ${product.currency || ''}`);
      console.log(`Categoría: ${product.category || 'N/A'}`);
      console.log(`URL: ${product.url || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error en el ejemplo:', error);
  }
}

// Ejemplo con diferentes lógicas de recomendación
async function exampleWithDifferentLogics() {
  const cpf = '123.456.789-00';

  // Lógicas disponibles en Scarab:
  const logics = [
    'PERSONAL',    // Recomendaciones personalizadas basadas en el historial del usuario
    'RELATED',     // Productos relacionados
    'ALSO_BOUGHT', // Productos que otros compraron junto con este
    'POPULAR',     // Productos más populares
    'CATEGORY',    // Productos de la misma categoría
    'CART',        // Recomendaciones basadas en el carrito
  ];

  console.log('Probando diferentes lógicas de recomendación:\n');

  for (const logic of logics) {
    console.log(`\n=== Probando lógica: ${logic} ===`);

    const response = await fetch('http://localhost:3000/api/scraping/recommendations/cpf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cpf: cpf,
        recommendLogic: logic,
        limit: 5,
        headless: true,
      }),
    });

    const job = await response.json();
    console.log(`Job iniciado: ${job.id}`);

    // Esperar un poco antes de la siguiente solicitud
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Ejecutar el ejemplo
if (require.main === module) {
  // Descomentar el ejemplo que quieras ejecutar:
  exampleWithCpf();
  // exampleWithDifferentLogics();
}

// Exportar funciones para uso en otros módulos
export {
  getRecommendationsByCpf,
  getRecommendationsWithCategoryFilter,
  getRecommendationsWithExclusions,
  checkJobStatus,
  waitForJobCompletion,
};
