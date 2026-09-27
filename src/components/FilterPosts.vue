<template>
    <ion-grid v-if="!loading" class="filters">
        <ion-row>
            <ion-col>
                <ion-select :toggle-icon="chevronDownOutline" aria-label="Universidad"
                    v-model="filters.universidad_id" placeholder="Universidad" @ionChange="onUniversidadChange">
                    <ion-select-option v-for="uni in universidades" :key="uni.id" :value="uni.id">
                        {{ uni.nombre }}
                    </ion-select-option>
                </ion-select>
            </ion-col>
            <ion-col>
                <ion-select :toggle-icon="chevronDownOutline" aria-label="Carrera" placeholder="Carrera"
                    v-model="filters.carrera_id" :disabled="!filters.universidad_id">
                    <ion-select-option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
                        {{ carrera.nombre }}
                    </ion-select-option>
                </ion-select>
            </ion-col>
            <ion-col class="button-col">
                <ion-button @click="applyFilters" class="apply-filters-btn">
                    Filtrar
                </ion-button>
            </ion-col>
            <ion-col v-if="hasActiveFilters" class="clear-filters-row">
                <ion-button fill="clear" size="small" @click="clearFilters" class="clear-filters-btn">
                    <ion-icon slot="start" :icon="closeCircleOutline"></ion-icon>
                    Limpiar
                </ion-button>
            </ion-col>
        </ion-row>
    </ion-grid>
</template>

<script>
import { IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import api from "@/services/api";
import { UniversidadService } from "@/services/universidad";

import { ref, reactive, onMounted, watch, computed } from 'vue';
import { chevronDownOutline, closeCircleOutline } from 'ionicons/icons';

export default {
    name: "FilterPosts",
    components: {
        IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonButton
    },
    emits: ['filter'],
    setup(props, { emit }) {
        const loading = ref(true);
        const universidades = ref([]);
        const carreras = ref([]);
        const filters = reactive({
            universidad_id: null,
            carrera_id: null
        });

        // Cargar universidades al montar
        onMounted(async () => {
            loading.value = true;
            try {
                const res = await UniversidadService.getUniversidades();
                universidades.value = res.data || res;
            } catch (e) {
                universidades.value = [];
            }
            loading.value = false;
        });

        // Cuando cambia universidad, cargar carreras
        const onUniversidadChange = async () => {
            filters.carrera_id = null;
            carreras.value = [];
            if (filters.universidad_id) {
                loading.value = true;
                try {
                    const res = await UniversidadService.getCarreras(filters.universidad_id);
                    carreras.value = res.data || res;
                } catch (e) {
                    carreras.value = [];
                }
                loading.value = false;
            }
        };

        // Emitir filtros al padre
        const applyFilters = () => {
            emit('filter', { ...filters });
        };

        // Limpiar filtros
        const clearFilters = () => {
            filters.universidad_id = null;
            filters.carrera_id = null;
            carreras.value = [];
            applyFilters();
        };

        // Mostrar botón limpiar si hay filtros activos
        const hasActiveFilters = computed(() => {
            return !!filters.universidad_id || !!filters.carrera_id;
        });

        return {
            loading,
            universidades,
            carreras,
            filters,
            chevronDownOutline,
            closeCircleOutline,
            onUniversidadChange,
            applyFilters,
            clearFilters,
            hasActiveFilters
        };
    }
}
</script>

<style>
.filters {
    background: var(--ion-background-color);
    padding: 0;
    margin: 0;
    --ion-grid-padding: 0;
}

.filters ion-row {
    font-weight: bolder;
    padding: 10px 16px;
}

.filters ion-col {
    padding: 0 4px;
}

.filters ion-row ion-select {
    border-radius: 8px;
    letter-spacing: -0.3px;
    width: fit-content;
    padding: 5px;
    min-height: 20px;
}

.clear-filters-row {
    padding-top: 0 !important;
    padding-bottom: 8px !important;
}

.button-col {
    display: flex;
    align-items: center;
    justify-content: center;
}

.apply-filters-btn {
    --background: #8A2BE2;
    --color: white;
    font-weight: 600;
    font-size: 0.875rem;
    height: 32px;
    margin: 0;
}

.apply-filters-btn:hover {
    --background: #6d1fa6;
}

.clear-filters-btn {
    --color: #8A2BE2;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: none;
    margin: 0;
    height: 32px;
}

.clear-filters-btn ion-icon {
    font-size: 18px;
}
</style>