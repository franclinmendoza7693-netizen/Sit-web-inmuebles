// public/js/modelo/casos-enunciado.js — dueño: Dev B
// Son las 5 filas de la tabla del enunciado. El modelo final debe quedar dentro de ±10 % en cada una.
// Precios en MILES de USD, igual que el dataset.

export const CASOS_ENUNCIADO = [
  { superficie_m2: 100, num_habitaciones: 3, zona: 'centro', anio_construccion: 2005, precio_miles_usd: 250 },
  { superficie_m2: 150, num_habitaciones: 4, zona: 'suburbio', anio_construccion: 2010, precio_miles_usd: 400 },
  { superficie_m2: 120, num_habitaciones: 3, zona: 'centro', anio_construccion: 2008, precio_miles_usd: 320 },
  { superficie_m2: 180, num_habitaciones: 5, zona: 'suburbio', anio_construccion: 2015, precio_miles_usd: 500 },
  { superficie_m2: 90,  num_habitaciones: 2, zona: 'rural',    anio_construccion: 2000, precio_miles_usd: 180 },
];

export const TOLERANCIA_ACEPTACION = 0.1; // ±10 %