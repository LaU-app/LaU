<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <div class="ion-text-center ion-padding"
                style="display: flex; flex-direction: column; justify-content: center; height: 100vh;">

                <div v-if="debugError" style="color: red; margin-bottom: 20px;">
                    <h3>¡Error Detectado!</h3>
                    <p>{{ debugError }}</p>
                    <ion-button @click="goBack">Volver al Login</ion-button>
                </div>

                <div v-else>
                    <ion-spinner name="crescent" style="transform: scale(2); margin-bottom: 20px;"></ion-spinner>
                    <h2>Conectando...</h2>
                    <p>Estamos validando tus credenciales.</p>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
// 2. Importamos los componentes esenciales de Ionic
import { IonPage, IonContent, IonSpinner, IonButton, toastController } from '@ionic/vue';
import oauthService from '../services/oauthServices';
import { AuthService } from '../services/auth';

export default {
    name: 'AuthCallback',
    // 3. Registramos los componentes
    components: {
        IonPage,
        IonContent,
        IonSpinner,
        IonButton
    },
    setup() {
        const router = useRouter();
        const debugError = ref(null);

        const goBack = () => router.replace('/login');

        onMounted(() => {
            console.log("[CALLBACK] Iniciando...");
            const params = new URLSearchParams(window.location.search);
            const queryParams = Object.fromEntries(params.entries());

            if (queryParams.error) {
                debugError.value = "Google devolvió error: " + queryParams.error;
                return;
            }

            if (queryParams.code) {
                oauthService.listenForAuth(async (tokenData, err) => {
                    if (err) {
                        console.error("ERROR FINAL:", err);
                        debugError.value = "Fallo al canjear token: " + (err.message || err);
                        return;
                    }

                    try {
                        console.log("Token OK. Enviando a Backend...");
                        const provider = localStorage.getItem('auth_provider') || 'google';

                        const authData = await AuthService.socialLogin(provider, tokenData.accessToken);

                        // NUEVA LÓGICA: Evaluamos la respuesta del backend
                        if (authData.requires_registration) {
                            // Guardamos los datos de Google/Microsoft temporalmente
                            localStorage.setItem('social_temp_token', tokenData.accessToken);
                            localStorage.setItem('social_temp_provider', provider);
                            localStorage.setItem('social_temp_name', authData.name);
                            localStorage.setItem('social_temp_email', authData.email);
                            
                            // Forzamos la redirección al registro
                            window.location.href = '/register';
                        } else {
                            // Login exitoso, ya tiene cuenta
                            const toast = await toastController.create({
                                message: '¡Bienvenido de vuelta!',
                                duration: 2000,
                                position: 'top',
                                cssClass: 'success-toast'
                            });
                            toast.present();
                            window.location.href = '/tabs/tab1';
                        }

                    } catch (apiError) {
                        debugError.value = "Error de API: " + (apiError.response?.data?.message || apiError.message);
                    }
                });

                oauthService.handleCallback(queryParams);
            } else {
                debugError.value = "No se recibió código de la URL";
            }
        });

        return { debugError, goBack };
    }
}
</script>