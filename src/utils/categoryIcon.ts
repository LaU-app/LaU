import {
    bookOutline, laptopOutline, constructOutline, shirtOutline, briefcaseOutline,
    hardwareChipOutline, pricetagOutline, cafeOutline, bicycleOutline, musicalNotesOutline,
    footballOutline, homeOutline, gameControllerOutline, brushOutline,
} from 'ionicons/icons'

/**
 * El backend guarda el nombre del ionicon de cada categoría, para poder añadir
 * categorías sin tocar el frontend. Se resuelve con un mapa explícito y no con
 * `import * as icons`, que arrastraría el paquete entero de ionicons al bundle.
 * Un icono no contemplado cae al genérico.
 */
const ICONS: Record<string, string> = {
    'book-outline': bookOutline,
    'laptop-outline': laptopOutline,
    'construct-outline': constructOutline,
    'shirt-outline': shirtOutline,
    'briefcase-outline': briefcaseOutline,
    'hardware-chip-outline': hardwareChipOutline,
    'cafe-outline': cafeOutline,
    'bicycle-outline': bicycleOutline,
    'musical-notes-outline': musicalNotesOutline,
    'football-outline': footballOutline,
    'home-outline': homeOutline,
    'game-controller-outline': gameControllerOutline,
    'brush-outline': brushOutline,
    'pricetag-outline': pricetagOutline,
}

export function categoryIcon(name: string | null | undefined): string {
    return (name && ICONS[name]) || pricetagOutline
}

export default categoryIcon
