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
    meta: { requiresGuest: true },
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
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: "/tabs/home",
      },
      {
        path: "home",
        component: () => import("@/views/HomeView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "tab2",
        component: () => import("@/views/TestApi.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "tab3",
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
      // No hay token, redirigir al welcome (no al login)
      next("/welcome");
      return;
    }

    // Hay token, permitir acceso (la validación se hará en background en el componente)
    next();
  }
  // Si la ruta es para invitados (login/register/welcome) y ya está autenticado
  else if (to.meta.requiresGuest && isAuthenticated) {
    // Solo redirigir si NO es welcome, para permitir logout
    if (to.path !== "/welcome") {
      next("/tabs/home");
    } else {
      // Si está autenticado pero va a /welcome, permitir acceso (para logout)
      next();
    }
  }
  // Caso normal
  else {
    next();
  }
});

export default router;
