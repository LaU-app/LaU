export type StudyQuoteCategory = 'study' | 'knowledge' | 'time' | 'discipline' | 'philosophy' | 'perseverance'
export interface StudyQuote { quote: string; author: string; category: StudyQuoteCategory }

// Colección curada manualmente. Cada frase se conserva en su redacción estándar
// en español y se excluyen a propósito variantes de autoría discutida.
export const STUDY_QUOTES: StudyQuote[] = [
  { quote: 'Aprender sin pensar es esfuerzo inútil; pensar sin aprender es peligroso.', author: 'Confucio', category: 'study' },
  { quote: 'El que enseña, aprende dos veces.', author: 'Joseph Joubert', category: 'study' },
  { quote: 'La educación es el arma más poderosa que puedes usar para cambiar el mundo.', author: 'Nelson Mandela', category: 'study' },
  { quote: 'Aprender nunca agota la mente.', author: 'Leonardo da Vinci', category: 'study' },
  { quote: 'Mientras enseñamos, aprendemos.', author: 'Séneca', category: 'study' },
  { quote: 'Si he logrado ver más lejos, ha sido porque he subido a hombros de gigantes.', author: 'Isaac Newton', category: 'knowledge' },
  { quote: 'En la vida, no hay nada que temer, solo cosas que comprender.', author: 'Marie Curie', category: 'knowledge' },
  { quote: 'Conocer no es suficiente, debemos aplicar. Querer no es suficiente, debemos hacer.', author: 'Johann Wolfgang von Goethe', category: 'knowledge' },
  { quote: 'Solo sé que no sé nada.', author: 'Sócrates', category: 'knowledge' },
  { quote: 'Cuanto más aumenta mi conocimiento, más aumenta mi asombro.', author: 'Leonardo da Vinci', category: 'knowledge' },
  { quote: 'El que lee mucho y anda mucho, ve mucho y sabe mucho.', author: 'Miguel de Cervantes', category: 'knowledge' },
  { quote: 'Yo, que me figuraba el Paraíso bajo la especie de una biblioteca.', author: 'Jorge Luis Borges', category: 'knowledge' },
  { quote: 'Todos los hombres desean por naturaleza saber.', author: 'Aristóteles', category: 'knowledge' },
  { quote: 'Ser culto es el único modo de ser libre.', author: 'José Martí', category: 'knowledge' },
  { quote: 'No es que tengamos poco tiempo, sino que perdemos mucho.', author: 'Séneca', category: 'time' },
  { quote: 'El tiempo perdido nunca se vuelve a encontrar.', author: 'Benjamin Franklin', category: 'time' },
  { quote: 'El tiempo es lo más valioso que un hombre puede gastar.', author: 'Diógenes de Sinope', category: 'time' },
  { quote: 'Tienes poder sobre tu mente, no sobre los acontecimientos externos. Compréndelo, y hallarás fuerza.', author: 'Marco Aurelio', category: 'discipline' },
  { quote: 'Primero di quién quieres ser, y luego haz lo que tengas que hacer.', author: 'Epicteto', category: 'discipline' },
  { quote: 'La paciencia sirve de protección contra las injurias, como los vestidos contra el frío.', author: 'Leonardo da Vinci', category: 'discipline' },
  { quote: 'La suerte favorece a la mente preparada.', author: 'Louis Pasteur', category: 'discipline' },
  { quote: 'El genio es un uno por ciento de inspiración y un noventa y nueve por ciento de transpiración.', author: 'Thomas Edison', category: 'discipline' },
  { quote: 'La diligencia es madre de la buena ventura.', author: 'Miguel de Cervantes', category: 'discipline' },
  { quote: 'No son las cosas las que perturban a los hombres, sino las opiniones sobre las cosas.', author: 'Epicteto', category: 'philosophy' },
  { quote: 'Una vida sin examen no merece la pena ser vivida.', author: 'Sócrates', category: 'philosophy' },
  { quote: 'Nuestra vida es lo que nuestros pensamientos hacen de ella.', author: 'Marco Aurelio', category: 'philosophy' },
  { quote: 'La virtud no está sola: siempre tiene vecinos.', author: 'Confucio', category: 'philosophy' },
  { quote: 'Ningún viento es favorable para el que no sabe a qué puerto se dirige.', author: 'Séneca', category: 'philosophy' },
  { quote: 'Caminante, no hay camino, se hace camino al andar.', author: 'Antonio Machado', category: 'perseverance' },
  { quote: 'La vida es como andar en bicicleta. Para mantener el equilibrio, debes seguir moviéndote.', author: 'Albert Einstein', category: 'perseverance' },
  { quote: 'Debemos creer que estamos dotados para algo, y que esto, cueste lo que cueste, debe ser alcanzado.', author: 'Marie Curie', category: 'perseverance' },
  { quote: 'El carácter no se puede desarrollar con facilidad y tranquilidad. Solo a través de experiencias de prueba y sufrimiento puede el alma fortalecerse.', author: 'Helen Keller', category: 'perseverance' },
  { quote: 'No hay un camino fácil de la tierra a las estrellas.', author: 'Séneca', category: 'perseverance' },
]

/** Elige una frase al azar evitando repetir la anterior mostrada. */
export function pickStudyQuote(previous?: string | null): StudyQuote {
  if (STUDY_QUOTES.length <= 1) return STUDY_QUOTES[0]
  let next = STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)]
  while (next.quote === previous) next = STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)]
  return next
}
