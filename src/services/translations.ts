
export const translations = {
  en: {
    // Navigation
    search: "Search",
    today: "Today",
    discover: "Discover",
    profile: "Profile",
    random: "Random",
    
    // Today page
    todayHighlights: "Today's Highlights",
    latestNews: "Latest News",
    fromWikipedia: "From Wikipedia",
    editorialHighlights: "Editorial Highlights",
    addArticle: "Add Article",
    readMore: "Read more",
    readOn: "Read on",
    readArticle: "Read Article",
    refresh: "Refresh",
    justNow: "Just now",
    hoursAgo: "{hours}h ago",
    
    // News sources
    nytNews: "NYT News",
    headlines: "Headlines",
    
    // Common
    loading: "Loading",
    error: "Error",
    retry: "Retry",
    close: "Close",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    
    // Errors
    failedToLoad: "Failed to load news articles. Please try again later.",
    noArticlesAvailable: "No articles available from {source}",
    
    // Article form
    articleTitle: "Article Title",
    articleContent: "Article Content",
    articleUrl: "Article URL (optional)",
    addNewArticle: "Add New Article",
  },
  es: {
    search: "Buscar",
    today: "Hoy",
    discover: "Descubrir",
    profile: "Perfil",
    random: "Aleatorio",
    
    todayHighlights: "Destacados de Hoy",
    latestNews: "Últimas Noticias",
    fromWikipedia: "De Wikipedia",
    editorialHighlights: "Destacados Editoriales",
    addArticle: "Agregar Artículo",
    readMore: "Leer más",
    readOn: "Leer en",
    readArticle: "Leer Artículo",
    refresh: "Actualizar",
    justNow: "Ahora mismo",
    hoursAgo: "hace {hours}h",
    
    nytNews: "Noticias NYT",
    headlines: "Titulares",
    
    loading: "Cargando",
    error: "Error",
    retry: "Reintentar",
    close: "Cerrar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    
    failedToLoad: "Error al cargar artículos. Por favor intente de nuevo.",
    noArticlesAvailable: "No hay artículos disponibles de {source}",
    
    articleTitle: "Título del Artículo",
    articleContent: "Contenido del Artículo",
    articleUrl: "URL del Artículo (opcional)",
    addNewArticle: "Agregar Nuevo Artículo",
  },
  fr: {
    search: "Rechercher",
    today: "Aujourd'hui",
    discover: "Découvrir",
    profile: "Profil",
    random: "Aléatoire",
    
    todayHighlights: "Points saillants d'aujourd'hui",
    latestNews: "Dernières nouvelles",
    fromWikipedia: "De Wikipédia",
    editorialHighlights: "Points saillants éditoriaux",
    addArticle: "Ajouter un article",
    readMore: "Lire la suite",
    readOn: "Lire sur",
    readArticle: "Lire l'article",
    refresh: "Actualiser",
    justNow: "À l'instant",
    hoursAgo: "il y a {hours}h",
    
    nytNews: "Nouvelles NYT",
    headlines: "Titres",
    
    loading: "Chargement",
    error: "Erreur",
    retry: "Réessayer",
    close: "Fermer",
    save: "Enregistrer",
    delete: "Supprimer",
    edit: "Modifier",
    
    failedToLoad: "Échec du chargement des articles. Veuillez réessayer plus tard.",
    noArticlesAvailable: "Aucun article disponible de {source}",
    
    articleTitle: "Titre de l'article",
    articleContent: "Contenu de l'article",
    articleUrl: "URL de l'article (optionnel)",
    addNewArticle: "Ajouter un nouvel article",
  },
  de: {
    search: "Suchen",
    today: "Heute",
    discover: "Entdecken",
    profile: "Profil",
    random: "Zufällig",
    
    todayHighlights: "Heutige Highlights",
    latestNews: "Neueste Nachrichten",
    fromWikipedia: "Von Wikipedia",
    editorialHighlights: "Redaktionelle Highlights",
    addArticle: "Artikel hinzufügen",
    readMore: "Mehr lesen",
    readOn: "Lesen auf",
    readArticle: "Artikel lesen",
    refresh: "Aktualisieren",
    justNow: "Gerade jetzt",
    hoursAgo: "vor {hours}h",
    
    nytNews: "NYT Nachrichten",
    headlines: "Schlagzeilen",
    
    loading: "Laden",
    error: "Fehler",
    retry: "Wiederholen",
    close: "Schließen",
    save: "Speichern",
    delete: "Löschen",
    edit: "Bearbeiten",
    
    failedToLoad: "Artikel konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
    noArticlesAvailable: "Keine Artikel von {source} verfügbar",
    
    articleTitle: "Artikel Titel",
    articleContent: "Artikel Inhalt",
    articleUrl: "Artikel URL (optional)",
    addNewArticle: "Neuen Artikel hinzufügen",
  }
};

export const getTranslation = (key: string, language: string = 'en', params?: Record<string, string | number>): string => {
  const langTranslations = translations[language as keyof typeof translations] || translations.en;
  let translation = langTranslations[key as keyof typeof langTranslations] || key;
  
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translation = translation.replace(`{${paramKey}}`, String(value));
    });
  }
  
  return translation;
};
