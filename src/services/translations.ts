
import { Language } from './languageConfig';

export interface Translations {
  // Navigation
  search: string;
  discover: string;
  signIn: string;
  profile: string;
  
  // Right sidebar
  save: string;
  saved: string;
  share: string;
  edit: string;
  view: string;
  
  // Date formatting
  monthNames: string[];
  shortMonthNames: string[];
  
  // General
  loading: string;
  error: string;
  retry: string;
}

export const translations: Record<string, Translations> = {
  en: {
    search: "Search articles",
    discover: "Discover",
    signIn: "Sign In",
    profile: "Profile",
    save: "Save",
    saved: "Saved",
    share: "Share",
    edit: "Edit",
    view: "View",
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    loading: "Loading amazing articles...",
    error: "Something went wrong. Please try again.",
    retry: "Try again"
  },
  es: {
    search: "Buscar artículos",
    discover: "Descubrir",
    signIn: "Iniciar Sesión",
    profile: "Perfil",
    save: "Guardar",
    saved: "Guardado",
    share: "Compartir",
    edit: "Editar",
    view: "Ver",
    monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    shortMonthNames: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    loading: "Cargando artículos increíbles...",
    error: "Algo salió mal. Por favor, inténtalo de nuevo.",
    retry: "Intentar de nuevo"
  },
  fr: {
    search: "Rechercher des articles",
    discover: "Découvrir",
    signIn: "Se Connecter",
    profile: "Profil",
    save: "Sauvegarder",
    saved: "Sauvegardé",
    share: "Partager",
    edit: "Modifier",
    view: "Voir",
    monthNames: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    shortMonthNames: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"],
    loading: "Chargement d'articles incroyables...",
    error: "Quelque chose s'est mal passé. Veuillez réessayer.",
    retry: "Réessayer"
  },
  de: {
    search: "Artikel suchen",
    discover: "Entdecken",
    signIn: "Anmelden",
    profile: "Profil",
    save: "Speichern",
    saved: "Gespeichert",
    share: "Teilen",
    edit: "Bearbeiten",
    view: "Ansehen",
    monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    shortMonthNames: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    loading: "Lade erstaunliche Artikel...",
    error: "Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.",
    retry: "Erneut versuchen"
  },
  it: {
    search: "Cerca articoli",
    discover: "Scopri",
    signIn: "Accedi",
    profile: "Profilo",
    save: "Salva",
    saved: "Salvato",
    share: "Condividi",
    edit: "Modifica",
    view: "Visualizza",
    monthNames: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],  
    shortMonthNames: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
    loading: "Caricamento di articoli fantastici...",
    error: "Qualcosa è andato storto. Per favore riprova.",
    retry: "Riprova"
  },
  pt: {
    search: "Buscar artigos",
    discover: "Descobrir",
    signIn: "Entrar",
    profile: "Perfil",
    save: "Salvar",
    saved: "Salvo",
    share: "Compartilhar",
    edit: "Editar",
    view: "Ver",
    monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    shortMonthNames: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    loading: "Carregando artigos incríveis...",
    error: "Algo deu errado. Por favor, tente novamente.",
    retry: "Tentar novamente"
  },
  ru: {
    search: "Поиск статей",
    discover: "Открыть",
    signIn: "Войти",
    profile: "Профиль",
    save: "Сохранить",
    saved: "Сохранено",
    share: "Поделиться",
    edit: "Редактировать",
    view: "Просмотр",
    monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    shortMonthNames: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    loading: "Загрузка удивительных статей...",
    error: "Что-то пошло не так. Пожалуйста, попробуйте еще раз.",
    retry: "Попробовать снова"
  },
  ja: {
    search: "記事を検索",
    discover: "発見",
    signIn: "サインイン",
    profile: "プロフィール",
    save: "保存",
    saved: "保存済み",
    share: "共有",
    edit: "編集",
    view: "表示",
    monthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    shortMonthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    loading: "素晴らしい記事を読み込み中...",
    error: "何かが間違っていました。もう一度お試しください。",
    retry: "再試行"
  },
  zh: {
    search: "搜索文章",
    discover: "发现",
    signIn: "登录",
    profile: "个人资料",
    save: "保存",
    saved: "已保存",
    share: "分享",
    edit: "编辑",
    view: "查看",
    monthNames: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    shortMonthNames: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    loading: "正在加载精彩文章...",
    error: "出了些问题。请重试。",
    retry: "重试"
  },
  ar: {
    search: "البحث في المقالات",
    discover: "اكتشف",
    signIn: "تسجيل الدخول",
    profile: "الملف الشخصي",
    save: "حفظ",
    saved: "محفوظ",
    share: "مشاركة",
    edit: "تحرير",
    view: "عرض",
    monthNames: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    shortMonthNames: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
    loading: "جاري تحميل مقالات رائعة...",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    retry: "حاول مرة أخرى"
  }
};

export const getTranslations = (language: Language): Translations => {
  return translations[language.code] || translations.en;
};

export const formatDate = (date: Date, language: Language): string => {
  const t = getTranslations(language);
  const month = t.shortMonthNames[date.getMonth()];
  const day = date.getDate();
  
  return `${month} ${day}`;
};
