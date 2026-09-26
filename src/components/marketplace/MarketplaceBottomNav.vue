<template><ion-footer class="study-footer ion-no-border"><nav aria-label="Navegación de Marketplace"><button v-for="item in items" :key="item.id" :class="{selected:active===item.id}" :aria-current="active===item.id ? 'page' : undefined" @click="navigate(item)"><span class="nav-icon"><ion-icon :icon="item.icon"/><ion-badge v-if="item.id==='cart' && cart.count.value>0" color="danger" class="nav-badge">{{ cart.count.value>99 ? '99+' : cart.count.value }}</ion-badge></span><span>{{ item.label }}</span></button></nav></ion-footer></template>
<script setup lang="ts">
import { IonBadge, IonFooter, IonIcon, modalController, useIonRouter } from '@ionic/vue'
import { storefrontOutline, cartOutline, receiptOutline, statsChartOutline } from 'ionicons/icons'
import { studyPageTransition } from '@/utils/studyTransition'
import { cart } from '@/utils/useCart'
const props=defineProps<{active:string;inModal?:boolean}>()
const router=useIonRouter()
const items=[
  {id:'explore',label:'Explorar',icon:storefrontOutline,path:'/marketplace'},
  {id:'cart',label:'Carrito',icon:cartOutline,path:'/marketplace/cart'},
  {id:'orders',label:'Apartados',icon:receiptOutline,path:'/marketplace/orders'},
  {id:'store',label:'Mi tienda',icon:statsChartOutline,path:'/marketplace/dashboard'},
]
async function navigate(item:typeof items[number]) { if(props.inModal) await modalController.dismiss(); router.push(item.path, studyPageTransition) }
</script>
<style scoped>
.nav-icon{position:relative;display:inline-flex}
.nav-badge{position:absolute;top:-6px;right:-10px;min-width:14px;height:14px;font-size:8px;font-weight:600;padding:0 3px;border-radius:7px;display:flex;align-items:center;justify-content:center;line-height:1}
</style>
