# NoxCube Social

Plataforma de red social construida con tecnologías web modernas. Diseñada para ofrecer una experiencia de usuario fluida con una interfaz oscura y detalles en tonos dorados y celeste.

## Tecnologías Utilizadas

### Frontend
- **React 19** - Biblioteca principal para la interfaz de usuario con sintaxis JSX
- **Vite** - Herramienta de compilación y desarrollo con recarga rápida
- **React Router DOM v7** - Sistema de enrutamiento para navegación entre páginas
- **Lucide React** - Biblioteca de iconografía vectorial
- **CSS3** - Estilos personalizados con variables CSS, animaciones y diseño responsivo

### Backend y Servicios
- **Firebase Authentication** - Sistema de autenticacion con soporte para:
  - Registro e inicio de sesion con correo electronico y contrasena
  - Sesiones anonimas temporales con limpieza automatica
- **Cloud Firestore** - Base de datos NoSQL en tiempo real con:
  - Subcolecciones anidadas para comentarios y respuestas
  - Escritura por lotes (batched writes) para operaciones atomicas
  - Indices compuestos para consultas optimizadas
  - Reglas de seguridad basadas en autenticacion

## Estructura del Proyecto

src/
├── components/ # Componentes reutilizables
│ ├── Navbar.jsx # Barra de navegacion y sidebar
│ ├── PostCard.jsx # Tarjeta de publicacion individual
│ ├── PostForm.jsx # Formulario de creacion de publicaciones
│ └── CommentSection.jsx # Sistema de comentarios con respuestas anidadas
├── hooks/
│ └── useAuth.js # Hook de autenticacion y gestion de sesion
├── lib/
│ └── firebase.js # Configuracion e inicializacion de Firebase
├── pages/
│ ├── Home.jsx # Pagina principal con feed de publicaciones
│ ├── Login.jsx # Autenticacion con panel dividido
│ ├── Post.jsx # Vista detallada de una publicacion
│ ├── Perfil.jsx # Perfil del usuario autenticado (editable)
│ ├── PerfilAjeno.jsx # Perfil de otros usuarios (solo lectura)
│ ├── CrearPost.jsx # Pagina de creacion de publicaciones
│ └── Configuracion.jsx # Configuracion de cuenta
├── service/
│ ├── postService.js # Operaciones CRUD de publicaciones
│ ├── commentService.js # Operaciones de comentarios y respuestas
│ ├── userService.js # Gestion de perfiles y seguidores
│ ├── notificationService.js # Sistema de notificaciones
│ └── contentFilterService.js # Filtro de contenido inapropiado
├── styles/ # Hojas de estilo organizadas por componente
├── App.jsx # Componente raiz con enrutamiento
├── App.css # Estilos globales y pantalla de carga
├── index.css # Variables CSS y configuracion base
└── main.jsx # Punto de entrada de la aplicacion


## Funcionalidades Implementadas

### Sistema de Autenticacion
- Registro de usuarios con correo electronico y contrasena
- Inicio de sesion con validacion de credenciales
- Sesiones anonimas para navegacion sin registro
- Eliminacion automatica de sesiones anonimas al cerrar sesion o abandonar la pagina
- Persistencia de sesion mediante tokens de Firebase

### Publicaciones (Posts)
- Creacion de publicaciones con titulo y contenido
- Edicion y eliminacion por parte del autor
- Sistema de likes con actualizacion optimista en la interfaz
- Contador de comentarios asociado a cada publicacion
- Comparticion mediante copia de enlace al portapapeles
- Vista expandible para contenido extenso (leer mas / mostrar menos)
- Marcado temporal relativo (hace X minutos, horas, dias)

### Sistema de Comentarios
- Comentarios en publicaciones propias y ajenas
- Respuestas anidadas a comentarios (hilos de conversacion)
- Likes en comentarios y respuestas individuales
- Edicion y eliminacion de comentarios propios
- Los autores de publicaciones pueden eliminar comentarios en sus posts
- Modal de confirmacion para eliminacion de contenido
- Notificaciones tipo toast para acciones realizadas

### Perfiles de Usuario
- Perfil personal editable (nombre, biografia, color de avatar)
- Visualizacion de perfiles de otros usuarios
- Sistema de seguimiento entre usuarios (seguir / dejar de seguir)
- Contadores de seguidores, seguidos y publicaciones
- Pestañas para filtrar publicaciones y comentarios del usuario
- Identificador corto unico copiable
- Avatar personalizable con paleta de colores predefinidos

### Feed de Contenido
- Feed general con todas las publicaciones ordenadas por fecha
- Feed "Siguiendo" que muestra solo contenido de usuarios seguidos
- Feed "Trending" con publicaciones destacadas por cantidad de likes
- Alternancia entre modos de visualizacion

### Sistema de Notificaciones
- Notificaciones en tiempo real para nuevas interacciones
- Contador de notificaciones no leidas en la barra de navegacion
- Marcado individual o global de notificaciones como leidas
- Dropdown con listado de notificaciones recientes
- Navegacion directa al contenido relacionado desde la notificacion

### Filtro de Contenido
- Deteccion de contenido potencialmente inapropiado mediante palabras clave
- Advertencia previa antes de publicar contenido sensible
- Marcado automatico de publicaciones como NSFW
- Opcion de mostrar/ocultar contenido sensible en el feed

### Interfaz de Usuario
- Diseño responsivo adaptado a dispositivos moviles, tablets y escritorio
- Barra de navegacion lateral expandible en escritorio
- Menu inferior deslizante en dispositivos moviles
- Boton flotante de acceso rapido para crear publicaciones
- Pantalla de carga con animacion tridimensional
- Pagina 404 personalizada con efecto visual
- Notificaciones toast para confirmacion de acciones
- Animaciones y transiciones suaves en elementos interactivos

## Configuracion de Seguridad

### Reglas de Firestore

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
match /{document=**} {
allow read: if true;
allow write: if request.auth != null && request.auth.token.isAnonymous != true;
}
match /posts/{postId} {
allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
match /comments/{commentId} {
allow delete: if request.auth != null && (request.auth.uid == resource.data.userId || request.auth.uid == get(/databases/$(database)/documents/posts/$(postId)).data.userId);
}
}
}
}


### Validaciones Implementadas
- Verificacion de autenticacion antes de operaciones de escritura
- Confirmacion de propiedad para edicion y eliminacion de contenido
- Prevencion de duplicacion en seguimiento de usuarios
- Proteccion contra valores negativos en contadores
- Sanitizacion de entradas de usuario mediante Firebase

## Instalacion y Ejecucion

### Requisitos Previos
- Node.js version 18 o superior
- Cuenta de Firebase con Firestore y Authentication habilitados
- Indice compuesto en Firestore para la coleccion `posts`:
  - Campo 1: `userId` (Ascendente)
  - Campo 2: `createdAt` (Descendente)

### Configuracion
1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar las credenciales de Firebase en `src/lib/firebase.js`
4. Aplicar las reglas de seguridad en la consola de Firebase
5. Ejecutar en desarrollo: `npm run dev`
6. Compilar para produccion: `npm run build`

### Variables de Entorno
Las credenciales de Firebase deben configurarse directamente en el archivo `src/lib/firebase.js`. La API Key de Firebase es publica por diseño y no representa un riesgo de seguridad cuando las reglas de Firestore estan correctamente configuradas.

## Optimizaciones para Plan Gratuito de Firebase

- Consultas limitadas a 50 documentos por operacion
- Uso de indices compuestos para evitar escaneos completos
- Escritura por lotes para reducir operaciones
- Subcolecciones anidadas en lugar de colecciones raiz para comentarios
- Limpieza automatica de usuarios anonimos para no exceder limites

## Paleta de Colores

| Uso | Codigo Hexadecimal |
|-----|-------------------|
| Color principal (acentos, botones) | `#C3A44B` |
| Color secundario (enlaces, iconos) | `#67E8F9` |
| Fondo principal | `#0A0A0A` |
| Fondo secundario (tarjetas) | `#121212` |
| Superficies elevadas | `#1A1A1A` |
| Texto principal | `#FFFFFF` |
| Texto secundario | `#E5E5E5` |
| Texto atenuado | `#A8A8A8` |
| Bordes | `#2A2A2A` |
| Indicador de like | `#b41f1f` |