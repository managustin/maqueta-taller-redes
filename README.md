# Maqueta 3D · MisioTIC S.A.

Visualización interactiva del proyecto de cableado estructurado del TP Integrador de Taller de Redes 2026 (Grupo 3).

**Ver la maqueta online:** https://managustin-taller-redes.vercel.app/

Se puede ver en español o en inglés (botón EN/ES, o agregando `?lang=en` a la dirección).

## Ver localmente

Es un sitio estático (HTML + Three.js desde CDN), sin paso de build. Para verlo localmente hace falta un servidor, por ejemplo:

```
python -m http.server 8000
```

y abrir http://localhost:8000.

Los datos del edificio, puestos y racks están en `js/data.js`, tomados del informe y las láminas del TP.
