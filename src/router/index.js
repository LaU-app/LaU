import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "../views/TabsPage.vue";
import { AuthService } from "@/services/auth";

const routes = [
  {
    path: "/",
    redirect: "/welcome",
  },
  {
    path: "/welcome",
    name: "Welcome",
    component: () => import("@/views/WelcomeView.vue"),
    // Permitir acceso a welcome siempre (sin meta)
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/LoginView.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/university-select",
    name: "UniversitySelect",
    component: () => import("@/views/UniversitySelectView.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/RegisterView.vue"),
    meta: { requiresGuest: true },
  },
  {
    path: "/users",
    name: "Users",
    component: () => import("@/views/UsersView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/notifications",
    name: "Notifications",
    component: () => import("@/views/NotificationsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/notification-settings",
    name: "NotificationSettings",
    component: () => import("@/views/NotificationSettingsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/tasks",
    name: "Tasks",
    component: () => import("@/views/TasksView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/tasks/:id",
    name: "TaskDetail",
    component: () => import("@/views/TaskDetailView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/tabs/",
    component: TabsPage,
    children: [
      {
        path: "",
        redirect: "/tabs/tab1",
      },
      {
        path: "tab1",
        name: "Home",
        component: () => import("@/views/HomeView.vue"),
        // Sin meta: permite acceso público (feed público) y autenticado (feed personalizado)
      },
      {
        path: "post/:id",
        name: "PostDetail",
        component: () => import("@/views/PostDetailView.vue"),
        // Sin meta: permite ver posts públicos sin login
      },
      {
        path: "create-post/:tipo?",
        name: "CreatePostTab",
        component: () => import("@/views/CreatePost.vue"),
        meta: { requiresAuth: true },
      },
      {
        name: "Perfil",
        path: "perfil/:username?",
        component: () => import("@/views/PerfilView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "chat",
        name: "ChatList",
        component: () => import("@/views/ChatList.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "perfil/:username",
        name: "UserProfile",
        component: () => import("@/views/PerfilView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "perfil",
        name: "MiPerfil",
        component: () => import("@/views/PerfilView.vue"),
        meta: { requiresAuth: true },
      }
    ],
  },
  {
    path: "/chat/:id",
    name: "ChatDetail",
    component: () => import("@/views/ChatDetail.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/AjusteView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/create-post/:tipo?",
    name: "CreatePost",
    component: () => import("@/views/CreatePost.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/auth/callback",
    name: "AuthCallback",
    component: () => import("@/views/AuthCallback.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Listener para manejar navegación desde notificaciones push
window.addEventListener("pushNotificationAction", (event) => {
  const { type, postId, userId, notificationId } = event.detail;

  // Navegar según el tipo
  if (type === "like" || type === "comment") {
    if (postId) {
      router.push(`/tabs/post/${postId}`);
    } else {
      router.push("/tabs/notifications");
    }
  } else if (type === "follow") {
    router.push("/tabs/notifications");
  } else {
    // Por defecto, ir a notificaciones
    router.push("/tabs/notifications");
  }
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = AuthService.isAuthenticated();

  // Si la ruta requiere autenticación
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      // No hay token, redirigir al welcome para invitar a login
      next("/welcome");
      return;
    }

    // Hay token, permitir acceso
    next();
  }
  // Si la ruta es para invitados (login/register) y ya está autenticado
  else if (to.meta.requiresGuest && isAuthenticated) {
    next("/tabs/tab1");
  }
  // Caso normal (incluye /welcome y /tabs/tab1 sin autenticación)
  else {
    next();
  }
});

export default router;
