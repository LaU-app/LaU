# Menciones

Documentación del flujo de menciones del frontend Ionic Vue.

## Alcance

Las menciones se escriben con el formato `@username` en publicaciones y comentarios. El frontend ofrece sugerencias de amistades mutuas, inserta el username seleccionado en el texto y convierte las menciones renderizadas en enlaces al perfil.

La validación definitiva y la creación de notificaciones ocurren en la API de `SivarSocial`.

## Componentes

### `MentionInput`

Ruta: `src/components/MentionInput.vue`

Componente reutilizable para campos de texto con menciones.

- Usa `ion-input` por defecto y `ion-textarea` cuando `multiline` es `true`.
- Detecta una mención cuando el cursor está después de `@` al inicio o después de un espacio.
- Espera 300 ms antes de consultar sugerencias.
- Muestra hasta 10 usuarios devueltos por la API.
- El dropdown se teletransporta a `body` y usa posición fija para no quedar recortado por `ion-item`, `ion-card` o `ion-footer`.
- Se reposiciona al hacer scroll, cambiar el tamaño u orientar la pantalla.
- Abre las sugerencias arriba o abajo según el espacio disponible.
- Permite seleccionar con el mouse/táctil, `ArrowUp`, `ArrowDown`, `Enter` y cerrar con `Escape`.

#### Props

| Prop | Tipo | Valor predeterminado | Uso |
|---|---|---:|---|
| `modelValue` | `string` | `''` | Texto controlado mediante `v-model`. |
| `placeholder` | `string` | `''` | Placeholder del campo. |
| `disabled` | `boolean` | `false` | Deshabilita la edición y las sugerencias. |
| `multiline` | `boolean` | `false` | Cambia el control a `ion-textarea`. |
| `rows` | `number` | `3` | Filas iniciales del textarea. |
| `autoGrow` | `boolean` | `false` | Activa el crecimiento automático del textarea. |
| `inputClass` | `string\|array\|object` | `'post-input'` | Clases aplicadas al control Ionic interno. |

#### Eventos

- `update:modelValue`: emite el contenido actualizado.
- `enter`: se emite al pulsar Enter cuando el dropdown no está abierto. Se usa para enviar comentarios o publicaciones de texto.

### `MentionTextRenderer`

Ruta: `src/components/MentionTextRenderer.vue`

Renderiza texto conservando el contenido normal y transformando:

- `@username` en un enlace a `/tabs/perfil/:username`.
- URLs `http://` y `https://` en enlaces abiertos mediante `@capacitor/browser`.

### Vistas y componentes que lo usan

- `src/views/CreatePost.vue`: descripción de publicaciones con imagen, música o archivo.
- `src/components/CreatePostCard.vue`: publicación rápida de posts de texto.
- `src/views/PostDetailView.vue`: campo de comentarios y respuestas mediante `MentionInput`; texto del post mediante `MentionTextRenderer`.
- `src/components/PostCard.vue`: texto y descripción del post mediante `MentionTextRenderer`.
- `src/components/CommentItem.vue`: contenido de cada comentario y respuesta mediante `MentionTextRenderer`.

## Servicio de sugerencias

Ruta: `src/services/mentionsService.js`

`mentionsService.searchFriends(query)` realiza:

```http
GET /api/users/search-friends?query={texto}
```

La instancia Axios agrega automáticamente el token Bearer disponible en `localStorage` o `sessionStorage`.

La respuesta esperada es:

```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "name": "Nombre de ejemplo",
      "username": "usuario_ejemplo",
      "imagen": "avatar.webp",
      "imagen_url": "https://api.ejemplo.test/perfiles/avatar.webp",
      "insignia": null
    }
  ]
}
```

Si el texto de búsqueda está vacío, la API devuelve una lista vacía. Los resultados solo incluyen usuarios que tienen una relación de seguimiento mutua con el usuario autenticado.

## Flujo de uso

1. El usuario escribe `@` o `@texto`.
2. `MentionInput` detecta el token y consulta `searchFriends` después de 300 ms.
3. El usuario selecciona una sugerencia.
4. El componente inserta `@username ` en el texto.
5. La vista envía el texto original al endpoint de creación correspondiente.
6. La API valida nuevamente el usuario mencionado, persiste la mención y crea la notificación.
7. Al leer el post o comentario, `MentionTextRenderer` convierte el token en un enlace de perfil.

## Consideraciones

- El frontend no debe asumir que cualquier `@username` es válido: la API vuelve a validar la relación mutua.
- Una sugerencia vacía puede significar que no existe coincidencia, que no hay amistad mutua o que la sesión no es válida.
- El username debe contener únicamente letras, números y guion bajo para que coincida con el parser actual.
