import { createRouter, createWebHistory } from "@ionic/vue-router";
import TabsPage from "../views/TabsPage.vue";
import { AuthService } from "@/services/auth";

const routes = [
  {
    path: "/",
    redirect: () => {
      return AuthService.isAuthenticated() ? "/tabs/tab1" : "/welcome";
    },
  },
  {
    path: "/welcome",
    name: "Welcome",
    component: () => import("@/views/WelcomeView.vue"),
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
  // Rutas antiguas: ahora viven dentro de /tabs (con el menú inferior visible).
  // Se redirigen para que enlaces, notificaciones push y pantallas que aún las usan sigan funcionando.
  { path: "/users", redirect: "/tabs/users" },
  { path: "/notifications", redirect: "/tabs/notifications" },
  { path: "/study", redirect: "/tabs/study" },
  { path: "/tasks", redirect: "/tabs/tasks" },
  { path: "/tasks/:id", redirect: (to) => ({ path: `/tabs/tasks/${to.params.id}` }) },
  {
    path: "/marketplace/:pathMatch(.*)*",
    redirect: (to) => {
      const rest = [].concat(to.params.pathMatch || []).join("/");
      return { path: rest ? `/tabs/marketplace/${rest}` : "/tabs/marketplace" };
    },
  },
  {
    path: "/notification-settings",
    name: "NotificationSettings",
    component: () => import("@/views/NotificationSettingsView.vue"),
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
      },
      {
        path: "post/:id",
        name: "PostDetail",
        component: () => import("@/views/PostDetailView.vue"),
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
        path: "users",
        name: "Users",
        component: () => import("@/views/UsersView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "notifications",
        name: "Notifications",
        component: () => import("@/views/NotificationsView.vue"),
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
      },
      
      // ✨ RUTAS DE ESTUDIO Y TAREAS (Ahora son hijas de TabsPage) ✨
      {
        path: "study",
        name: "Study",
        component: () => import("@/views/StudyView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "tasks",
        name: "Tasks",
        component: () => import("@/views/TasksView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "tasks/:id",
        name: "TaskDetail",
        component: () => import("@/views/TaskDetailView.vue"),
        meta: { requiresAuth: true },
      },

      // ✨ RUTAS DE MARKETPLACE (Ahora son hijas de TabsPage) ✨
      {
        path: "marketplace",
        name: "Marketplace",
        component: () => import("@/views/MarketplaceView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "marketplace/product/:id",
        name: "MarketplaceProduct",
        component: () => import("@/views/MarketplaceProductView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "marketplace/cart",
        name: "MarketplaceCart",
        component: () => import("@/views/MarketplaceCartView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "marketplace/orders",
        name: "MarketplaceOrders",
        component: () => import("@/views/MarketplaceOrdersView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "marketplace/dashboard",
        name: "MarketplaceDashboard",
        component: () => import("@/views/MarketplaceDashboardView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "marketplace/store/:slug",
        name: "MarketplaceStore",
        component: () => import("@/views/MarketplaceStoreView.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },
  // Rutas que cubren pantalla completa sin menús
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
  {
    path: "/create-poll",
    name: "CreatePoll",
    component: () => import("@/views/CreatePollView.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Listener para manejar navegación desde notificaciones push
window.addEventListener("pushNotificationAction", (event) => {
  const { type, postId, userId, notificationId, chatUserId } = event.detail;

  if (type === "like" || type === "comment") {
    if (postId) {
      router.push(`/tabs/post/${postId}`);
    } else {
      router.push("/notifications");
    }
  } else if (type === "follow") {
    router.push("/notifications");
  } else if (type === "message" || type === "chat") {
    if (chatUserId) {
      router.push(`/chat/${chatUserId}`);
    } else {
      router.push("/tabs/chat");
    }
  } else {
    router.push("/notifications");
  }
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = AuthService.isAuthenticated();

  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      next("/welcome");
      return;
    }
    next();
  } else if (to.meta.requiresGuest && isAuthenticated) {
    const vieneDeRegistro = localStorage.getItem("flujo_registro_social") === "true";
    if (to.path === "/register" && vieneDeRegistro) {
      next(); 
    } else {
      next("/tabs/tab1"); 
    }
  } else {
    next();
  }
});

export default router;