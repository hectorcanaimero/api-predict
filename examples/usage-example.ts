/**
 * Ejemplo de uso de la API de scraping
 *
 * Este archivo muestra cómo usar el cliente de la API
 * para realizar scraping de productos de Emarsys
 */

// Función para iniciar un job de scraping
async function startScrapingJob() {
  const response = await fetch('http://localhost:3000/api/scraping/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: 'https://extend.emarsys.com/products/recommended',
      username: 'usuario@example.com',
      password: 'password123',
      maxProducts: 50,
      timeout: 30000,
      headless: true,
      useCache: true,
    }),
  });

  const job = await response.json();
  console.log('Job iniciado:', job);
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
      console.log(`Total de productos: ${job.result.totalProducts}`);
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

// Función para obtener todos los jobs
async function getAllJobs() {
  const response = await fetch('http://localhost:3000/api/scraping/jobs');
  const jobs = await response.json();
  console.log('Todos los jobs:', jobs);
  return jobs;
}

// Función para obtener estadísticas
async function getStats() {
  const response = await fetch('http://localhost:3000/api/scraping/stats');
  const stats = await response.json();
  console.log('Estadísticas de la cola:', stats);
  return stats;
}

// Ejemplo completo de uso
async function example() {
  try {
    console.log('=== Iniciando ejemplo de scraping ===\n');

    // 1. Iniciar un job
    console.log('1. Iniciando job de scraping...');
    const jobId = await startScrapingJob();
    console.log(`Job ID: ${jobId}\n`);

    // 2. Esperar a que se complete
    console.log('2. Esperando a que el job se complete...');
    const result = await waitForJobCompletion(jobId);
    console.log('\n3. Resultados:');
    console.log(`- Productos encontrados: ${result.totalProducts}`);
    console.log(`- Duración: ${result.duration}ms`);

    if (result.products.length > 0) {
      console.log('\n4. Ejemplo de producto:');
      console.log(JSON.stringify(result.products[0], null, 2));
    }

    // 3. Obtener estadísticas
    console.log('\n5. Estadísticas finales:');
    await getStats();

  } catch (error) {
    console.error('Error en el ejemplo:', error);
  }
}

// Ejecutar el ejemplo
if (require.main === module) {
  example();
}

// Exportar funciones para uso en otros módulos
export {
  startScrapingJob,
  checkJobStatus,
  waitForJobCompletion,
  getAllJobs,
  getStats,
};
