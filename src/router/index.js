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
    path: "/register",
    name: "Register",
    component: () => import("@/views/RegisterView.vue"),
    meta: { requiresGuest: true },
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
        path: "tab2/:tipo?",
        name: "CreatePost",
        component: () => import("@/views/CreatePost.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "tab3",
        name: "Perfil",
        component: () => import("@/views/PerfilView.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
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
