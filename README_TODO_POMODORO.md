# 📚 Sistema de ToDo con Pomodoro - SivarSocial

## 🎯 Descripción

Sistema completo de gestión de tareas con temporizador Pomodoro integrado para estudiantes. Incluye sincronización offline, notificaciones locales y estadísticas de productividad.

## ✨ Características Implementadas

### 📝 Gestión de Tareas

- ✅ Crear, editar y eliminar tareas
- ✅ Prioridades (Alta, Media, Baja) con indicadores visuales
- ✅ Fechas de vencimiento con alertas
- ✅ Estimación de Pomodoros necesarios
- ✅ Estados: Pendiente, En Curso, Completada, Cancelada
- ✅ Filtros por estado y prioridad
- ✅ Sincronización offline (LocalForage)
- ✅ Vista detallada con historial de sesiones

### ⏲️ Temporizador Pomodoro

- ✅ Timer de 25 minutos con progreso circular animado
- ✅ Descansos cortos (5 min) y largos (15 min)
- ✅ Vincular sesiones a tareas específicas
- ✅ Pausar, reanudar y cancelar sesiones
- ✅ Notificaciones locales al completar
- ✅ Tracking automático de progreso en tareas
- ✅ Historial de sesiones completadas/canceladas

### 📊 Estadísticas

- ✅ Total de tareas por estado
- ✅ Tareas vencidas
- ✅ Pomodoros completados hoy/semana/mes
- ✅ Tiempo total de estudio
- ✅ Progreso visual por tarea

### 🔄 Sincronización Offline

- ✅ Cola de sincronización automática
- ✅ Caché local con LocalForage
- ✅ Reintentos automáticos al recuperar conexión
- ✅ Sincronización cada 60 segundos
- ✅ Indicadores de estado offline/online

## 🚀 Instalación y Configuración

### Dependencias Instaladas

```bash
npm install localforage
npm install @capacitor/local-notifications
npx cap sync android
```

### Estructura de Archivos Creados

```
src/
├── services/
│   ├── tasksService.js          # API y caché de tareas
│   └── pomodoroService.js       # API y caché de pomodoro
├── components/
│   ├── TaskCard.vue             # Tarjeta de tarea con acciones
│   ├── PomodoroTimer.vue        # Temporizador con controles
│   └── CreateTaskModal.vue      # Modal para crear/editar tareas
├── views/
│   ├── TasksView.vue            # Vista principal de tareas
│   └── TaskDetailView.vue       # Detalle de tarea con historial
├── utils/
│   └── useSyncQueue.js          # Composable de sincronización
└── router/
    └── index.js                 # Rutas actualizadas
```

## 📱 Uso de la Aplicación

### 1. Crear una Tarea

1. Ir a la pestaña de **Tareas** (ícono de checklist en el tab bar)
2. Presionar el botón **+** en el header
3. Completar:
   - Título (obligatorio)
   - Descripción (opcional)
   - Prioridad (Baja, Media, Alta)
   - Fecha de vencimiento
   - Pomodoros estimados
4. Guardar

### 2. Iniciar un Pomodoro

**Opción A - Desde la lista:**

- Presionar el ícono de timer ⏱️ en la tarjeta de tarea

**Opción B - Desde el detalle:**

- Abrir la tarea → "Iniciar Pomodoro"

**Opción C - Pomodoro libre:**

- Presionar el botón flotante (FAB) rojo/verde en la vista de tareas

### 3. Usar el Timer Pomodoro

1. **Iniciar**: Presionar "Iniciar Pomodoro"
2. **Pausar**: Detener temporalmente (opcional)
3. **Reanudar**: Continuar después de pausa
4. **Detener**: Cancelar la sesión (confirmación requerida)
5. **Al completar**: Elegir tipo de descanso (5 o 15 min) o saltar

### 4. Gestionar Tareas

- **Ver detalle**: Tap en cualquier tarea
- **Completar**: Deslizar → botón verde ✓
- **Eliminar**: Deslizar → botón rojo 🗑️
- **Editar**: Detalle → botón de editar (lápiz)

### 5. Filtros y Ordenamiento

- **Filtrar por estado**: Segmentos en el header (Todas, Pendientes, En Curso, Completadas)
- **Ver estadísticas**: Tarjetas en la parte superior
  - Completadas
  - En curso
  - Vencidas
  - Pomodoros de hoy

## 🎨 Colores y Estilos

### Prioridades

- **Alta**: Rojo (`--ion-color-danger`)
- **Media**: Amarillo (`--ion-color-warning`)
- **Baja**: Verde (`--ion-color-success`)

### Estados

- **Pendiente**: Amarillo
- **En Curso**: Azul (`--ion-color-primary`)
- **Completada**: Verde
- **Cancelada**: Gris (`--ion-color-medium`)

### Temporizador

- **Pomodoro**: Rojo (#D32F2F)
- **Descanso**: Verde
- **Progreso**: Animación circular con stroke-dashoffset

## 🔧 Configuración Backend

### Variables de Entorno (Laravel)

Asegúrate de que tu `.env` tenga:

```env
APP_URL=http://localhost:8000
```

### Rutas API Requeridas

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // Tasks
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    Route::get('/tasks-stats', [TaskController::class, 'stats']);

    // Pomodoro
    Route::post('/pomodoro/start', [PomodoroController::class, 'start']);
    Route::post('/pomodoro/complete', [PomodoroController::class, 'complete']);
    Route::post('/pomodoro/cancel', [PomodoroController::class, 'cancel']);
    Route::get('/pomodoro/active', [PomodoroController::class, 'active']);
    Route::get('/pomodoro/sessions', [PomodoroController::class, 'index']);
    Route::get('/pomodoro/stats', [PomodoroController::class, 'stats']);
});
```

### Permisos Android (AndroidManifest.xml)

```xml
<!-- Ya incluido en tu proyecto -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## 📊 Flujo de Datos

### Crear Tarea

```
Usuario → CreateTaskModal → tasksService.createTask()
    ├─ Éxito → API Laravel → DB → Actualizar UI
    └─ Error → LocalForage → Cola de Sync → Mostrar offline
```

### Iniciar Pomodoro

```
Usuario → PomodoroTimer → pomodoroService.startPomodoro()
    ├─ Guardar en LocalForage (sesión activa)
    ├─ POST /api/pomodoro/start
    ├─ Iniciar countdown (25 min)
    └─ Al llegar a 0:
        ├─ Notificación local
        ├─ POST /api/pomodoro/complete
        ├─ task.incrementPomodoros()
        └─ Mostrar selector de descanso
```

### Sincronización Offline

```
App.vue (onMounted)
    └─ useSyncQueue.startAutoSync()
        ├─ Cada 60 segundos
        ├─ Al recuperar conexión (window.online)
        └─ Para cada item en cola:
            ├─ Reintentar POST
            ├─ Éxito → Remover de cola
            └─ Fallo → Mantener en cola
```

## 🧪 Testing

### Probar Offline

1. Desactivar WiFi/datos
2. Crear tarea → Ver mensaje "guardada localmente"
3. Iniciar pomodoro
4. Completar sesión
5. Activar conexión
6. Ver logs de sincronización en consola

### Probar Notificaciones

1. Otorgar permisos en Android
2. Iniciar pomodoro
3. Esperar 25 minutos (o modificar `POMODORO_DURATION` temporalmente)
4. Ver notificación "🎉 ¡Pomodoro completado!"

## 🐛 Troubleshooting

### No aparecen notificaciones

```javascript
// En PomodoroTimer.vue, verificar:
const hasPermission = await requestNotificationPermission();
console.log("Permission:", hasPermission);
```

### Las tareas no se sincronizan

```javascript
// En consola del navegador:
import tasksService from "@/services/tasksService";
await tasksService.flushSyncQueue();
```

### Error "Task not found"

- Verificar que la tarea pertenezca al usuario autenticado
- Backend valida `task.user_id === auth()->id()`

## 📈 Próximas Mejoras (Opcionales)

- [ ] Gráficos de productividad semanal
- [ ] Racha de días estudiando
- [ ] Sonidos personalizables para timer
- [ ] Modo Pomodoro personalizado (duración ajustable)
- [ ] Exportar estadísticas a PDF
- [ ] Integración con calendario
- [ ] Compartir logros en el feed social
- [ ] Insignias y gamificación

## 🔗 Enlaces Útiles

- [Técnica Pomodoro](https://francescocirillo.com/pages/pomodoro-technique)
- [Capacitor LocalNotifications](https://capacitorjs.com/docs/apis/local-notifications)
- [LocalForage](https://localforage.github.io/localForage/)
- [Ionic Vue](https://ionicframework.com/docs/vue/overview)

## 👨‍💻 Autor

Implementado siguiendo las especificaciones del documento de referencia y adaptado a SivarSocial.

## 📄 Licencia

Parte del proyecto SivarSocial - Todos los derechos reservados.
