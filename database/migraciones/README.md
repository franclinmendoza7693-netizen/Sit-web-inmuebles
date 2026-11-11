# Migraciones

Cada cambio de tablas después del día 1 es un archivo nuevo, numerado y con nombre descriptivo:

```
002_agrega_num_banos.sql
003_indice_distrito.sql
```

Reglas:

- Nunca se edita `schema.sql` para un cambio ya aplicado en otras PCs; se crea una migración.
- Nadie modifica tablas a mano en Workbench sin su script.
- Si la migración cambia un valor cerrado (ENUM), primero se cambia `shared/contrato.js` por PR "contrato:".
- Al hacer Pull, cada uno ejecuta las migraciones nuevas en su BD local.
