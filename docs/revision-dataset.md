# Revisión del dataset – Día 1 (Dev B)

Archivo: `public/admin/datos/inmuebles.csv` · Generador: `ml/generar-dataset.js` (semilla 2026, reproducible con `npm run dataset`)
El dataset es sintético. La tabla del enunciado solo trae 5 filas, que no alcanzan para entrenar una red neuronal; por eso se generaron 2 000 filas con una fórmula calibrada con esas 5 filas, más un ruido de ±8 %. Esto se declara así en el informe.

## Resumen
2 000 filas, 0 filas inválidas (sin vacíos y todas las zonas son del contrato).

| Columna | Mínimo | Máximo | Promedio | Mediana | Desv. estándar | Correlación con el precio |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Superficie (m²) | 40 | 400 | 154.1 | 141 | 76.1 | 0.964 |
| Habitaciones | 1 | 6 | 4.0 | 4 | 1.5 | 0.774 |
| Año de construcción | 1970 | 2025 | 1997.2 | 1997 | 16.1 | 0.170 |
| Precio (miles USD) | 64.3 | 1077 | 359.9 | 330 | 181.2 | — |

| Zona | Inmuebles | % | Precio promedio (miles USD) | Precio promedio por m² (USD) |
| :--- | :--- | :--- | :--- | :--- |
| Centro | 813 | 40.6 % | 372.8 | 2 372 |
| Suburbio | 770 | 38.5 % | 380.4 | 2 477 |
| Rural | 417 | 20.8 % | 296.8 | 2 011 |

## Casos del enunciado frente a la fórmula (sin ruido)

| Superficie | Hab. | Zona | Año | Enunciado (miles USD) | Fórmula | Diferencia |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 100 | 3 | centro | 2005 | 250 | 254.0 | +1.6 % |
| 150 | 4 | suburbio | 2010 | 400 | 398.5 | -0.4 % |
| 120 | 3 | centro | 2008 | 320 | 304.0 | -5.0 % |
| 180 | 5 | suburbio | 2015 | 500 | 485.8 | -2.8 % |
| 90 | 2 | rural | 2000 | 180 | 180.3 | +0.2 % |

Los 5 casos quedan a menos de 5 % de la fórmula, así que un modelo que aprenda bien el dataset debería cumplir la meta de ±10 %.

## Observaciones
1. La superficie es la variable que más pesa (correlación 0.96). El año influye poco (0.17), lo que es coherente con la fórmula.
2. Suburbio sale algo más caro que centro por m². No es un error: así lo marca la tabla del enunciado (150 m² en suburbio → 400 mil).
3. Habitaciones se concentra en 6 (484 filas) porque los inmuebles grandes se limitaron a 6. El modelo verá pocos ejemplos de inmuebles grandes con pocas habitaciones.
4. 84 % de los inmuebles mide entre 60 y 200 m². Las predicciones serán más confiables en ese rango que en los extremos (300–400 m²).
5. Rango de entrenamiento: 40–400 m², 1–6 habitaciones, años 1970–2025. Fuera de ese rango, `predecirPrecio()` marca `fuera_de_rango: true` y la pantalla muestra el aviso.

## Preprocesamiento aplicado (`public/js/modelo/preprocesamiento.js`)
1. Limpieza: se descartan filas con números inválidos o zonas fuera del contrato.
2. Separación 80/20 mezclada con semilla 2026: 1 600 filas de entrenamiento y 400 de prueba.
3. Min-max a [0, 1] de superficie, habitaciones, año y precio, calculado solo con el set de entrenamiento.
4. One-hot de zona en el orden de `ENTRADAS_MODELO`: `superficie_m2`, `num_habitaciones`, `anio_construccion`, `zona_centro`, `zona_suburbio`, `zona_rural`.
Las mismas funciones (`vectorizar`, `desescalar`) se usarán en `prediccion.js` el día 3, para que entrenar y predecir transformen los datos igual.