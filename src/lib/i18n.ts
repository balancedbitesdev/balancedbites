export const LOCALE_COOKIE = "bb_locale";

export const LOCALES = ["en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ar";
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : "en";
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function alternateLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

export const dict = {
  en: {
    langName: "English",
    switchLabel: "عربي",
    nav: {
      home: "Home",
      menu: "Menu",
      myPlan: "My Plan",
      about: "About",
      learn: "Learn",
      account: "Account",
      contact: "Contact",
      orderNow: "Order Now",
    },
    footer: {
      rights: "All rights reserved.",
      about: "About",
      learn: "Learn",
      contact: "Contact",
      social: "Social media",
    },
    common: {
      back: "Back",
      continue: "Continue",
      sending: "Sending...",
      remove: "Remove",
      total: "Total",
      items: "Items",
      delivery: "Delivery",
      estimatedTotal: "Estimated total",
      browseMenu: "Browse menu",
      whatsapp: "WhatsApp",
      readMore: "Read more",
    },
    cart: {
      title: "Your cart",
      emptyTitle: "Your cart is empty",
      emptyBody: "Add meals from the menu-close this panel anytime to keep browsing.",
      checkout: "Checkout",
      checkoutError: "Could not start checkout. Please try again.",
      commentsNote:
        "Allergies and notes are attached to the item and show on the Shopify order line.",
    },
    contact: {
      title: "Contact Us",
      intro:
        "Reach us on WhatsApp for the fastest response, or send a message through the form.",
      whatsappPrimary: "WhatsApp (primary)",
      whatsappBody:
        "Tap below to chat with our team about orders, delivery zones, and meal plans.",
      whatsappCta: "Message on WhatsApp",
      direct: "Direct",
      hours: "Hours:",
      hoursText: "Open Saturday-Thursday, 9:00 AM - 9:00 PM",
      friday: "Fridays:",
      closed: "Closed",
      pickup: "Pickup:",
      pickupText: "Saturdays from 10:00 AM at our kitchen (see map)",
      pickupLocation: "Pickup location",
      pickupBodyPrefix: "We offer pickup only from",
      pickupBodySuffix:
        "Pickup is available Saturdays from 10:00 AM. Message us on WhatsApp for anything else.",
      openMaps: "Open pickup location in Google Maps",
      form: {
        name: "Name",
        email: "Email",
        phone: "Phone (WhatsApp preferred)",
        message: "Message",
        send: "Send message",
      },
    },
    menu: {
      eyebrow: "Our curated laboratory",
      title: "Our Menu",
      intro:
        "Every meal is nutritionist-approved, macro-balanced, and crafted from premium natural ingredients.",
      script: "Healthy food that actually tastes like a dream.",
      deliveryTitle: "Delivery & pickup",
      deliveryBody:
        "Delivery is only available for 6th of October and Sheikh Zayed. Elsewhere, choose pickup: orders are ready Saturdays from 10:00 AM (confirm by WhatsApp after checkout).",
      loadError: "Could not load products. Please try again later.",
      noProducts: "No products are available yet.",
      searchSr: "Search the menu",
      searchPlaceholder: "Search meals, ingredients, categories...",
      clearSearch: "Clear search",
      noMatchesFor: "No matches for",
      result: "result",
      results: "results",
      noMatches: "No matches. Try a different word or clear the search.",
      emptyCategory: "Nothing in this category yet. Try another filter.",
      filters: {
        all: "All",
        keto_desserts: "Keto Desserts",
        high_protein: "High Protein",
        clean_carb: "Clean Carb",
        veggie_sides: "Vegetable Sides",
        salads: "Salads",
        frozen: "Frozen",
      },
      add: "Add",
      adding: "Adding...",
      viewDetails: "View details",
      allergies: "Allergies",
      notes: "Notes",
      quantity: "Quantity",
      specialRequests: "Special requests",
      addedToCart: "Added to your cart",
    },
    home: {
      whatBelieve: "What we believe",
      feelHome: "Healthy eating should feel like home",
      feelHomeBody:
        "Not restrictive, not complicated-just real food on the table that everyone reaches for.",
      whyCleanEating: "Why clean eating",
      benefits: [
        {
          title: "Support kids' growth",
          body: "Nutrient-dense meals with the vitamins and minerals growing bodies need every day.",
        },
        {
          title: "Adults stay energized",
          body: "Balanced macros that fuel you from morning to evening without the crash.",
        },
        {
          title: "Long-term health",
          body: "Clean ingredients that promote healthy weight and stronger immunity for every age.",
        },
        {
          title: "Stable blood sugar",
          body: "Low-glycemic recipes that keep your energy steady and your focus sharp.",
        },
        {
          title: "One menu for all",
          body: "No separate diet meals and regular meals. Everyone eats the same delicious food.",
        },
        {
          title: "Lifelong habits",
          body: "When the whole family eats well together, healthy choices become second nature.",
        },
      ],
      quote: "One kitchen. One menu.",
      quoteAccent: "Healthy for everyone.",
      quoteBody: "The idea behind everything we cook.",
      approach: "Our approach",
      hormoneTitle: "Hormone-based nutrition",
      hormoneP1:
        "At Balanced Bites, we follow a hormone-based approach to nutrition - because balanced hormones mean better energy, metabolism, and overall health.",
      hormoneP2:
        "Our meals focus on high protein, healthy fats, clean carbs, and fiber to stabilize blood sugar, reduce cravings, and support your body naturally.",
      hormoneP3:
        "We use real, natural ingredients to help lower inflammation and keep your body functioning at its best.",
      whatUse: "What we use",
      realIngredients: "Real ingredients. Nothing to hide.",
      useIntro:
        "Everything is shown in one place: what we avoid, what we use instead, and the core ingredients we cook with daily.",
      never: "Never",
      insteadUse: "Instead, we use",
      ready: "Ready to start?",
      readyTitle: "Design your plate, build your week.",
      readyBody:
        "Protein, sides, salad, and dessert - all chosen by you. Build your weekly package and get a free meal on us.",
      chatWhatsapp: "Chat on WhatsApp",
    },
    about: {
      eyebrow: "About Balanced Bites",
      founded: "Founded by Dalia",
      role: "Certified food nutritionist",
      spotlight: "Founder Spotlight",
      title: "The person behind the menu",
      intro: "Nutrition, taste, and honesty on the plate-by design.",
      p1: "As a certified food nutritionist with nearly a year of hands-on experience developing personalized healthy eating plans, Dalia Seoudi brings deep knowledge of clean eating, balanced meal creation, and ingredient integrity.",
      p2: "Her goal is to support individuals in achieving better health by offering meals and desserts that reflect both nutritional value and culinary enjoyment. Inspired by real transformations, Dalia founded Balanced Bites to provide clean, delicious, and nutritionist-approved options for everyday life.",
      quote: "Clean food should feel warm, generous, and easy to trust.",
      philosophy: "Our philosophy",
      philosophyTitle: "Food is information for your hormones.",
      philosophyText:
        "At Balanced Bites, we follow a hormone-based approach to nutrition because balanced hormones support better energy, metabolism, mood, and fat burning. Our meals are built around high protein, healthy fats, clean carbs, and fiber to support your body's natural rhythm.",
      philosophyClosing:
        "We're not just offering food - we're helping you understand your body and build a sustainable, healthy lifestyle.",
    },
    learn: {
      eyebrow: "Nutrition hub",
      title: "Learn",
      intro:
        "Short reads and videos to help your household eat well without overwhelm. New lessons roll out here first.",
      cards: [
        {
          title: "Nutrition basics",
          desc: "Core ideas behind balanced plates, macros, and everyday fuel.",
        },
        {
          title: "Keto guides",
          desc: "How we think about low-carb and ketogenic-friendly options.",
        },
        {
          title: "Healthy tips",
          desc: "Practical habits for busy schedules and family tables.",
        },
        {
          title: "Founder videos",
          desc: "Messages and kitchen notes from Dalia and the Balanced Bites team.",
        },
      ],
    },
    account: {
      customer: "Customer",
      title: "My account",
      intro: "Orders and profile-same secure checkout when you buy from the menu.",
      shopMenu: "Shop menu",
      includes: "Your account includes",
      orderHistory: "Order history",
      orderHistoryBody: "in one place-dates and totals at a glance.",
      orderAgain: "Order again",
      orderAgainBody: "in one tap - re-add any past order to your cart instantly.",
      secureSignIn: "Secure sign-in",
      secureBody: "through Shopify-same checkout you already trust.",
      signIn: "Sign in",
      signInBody: "Use the secure window-then you'll return here automatically.",
      create: "Create account",
      login: "Log in",
      notEnabled:
        "Online accounts aren't enabled on this deployment yet. You can still shop from the menu as a guest.",
      dashboardError: "We couldn't load your dashboard",
      dashboardRetry: "Try signing out and signing back in. Your cart and menu order are unchanged.",
      logout: "Log out",
    },
  },
  ar: {
    langName: "مصري",
    switchLabel: "English",
    nav: {
      home: "الرئيسية",
      menu: "المنيو",
      myPlan: "خطة أكلي",
      about: "عننا",
      learn: "اتعلم",
      account: "حسابي",
      contact: "تواصل",
      orderNow: "اطلب دلوقتي",
    },
    footer: {
      rights: "كل الحقوق محفوظة.",
      about: "عننا",
      learn: "اتعلم",
      contact: "تواصل",
      social: "السوشيال ميديا",
    },
    common: {
      back: "رجوع",
      continue: "كمّل",
      sending: "بنبعت...",
      remove: "شيل",
      total: "الإجمالي",
      items: "الطلبات",
      delivery: "الدليفري",
      estimatedTotal: "الإجمالي المتوقع",
      browseMenu: "شوف المنيو",
      whatsapp: "واتساب",
      readMore: "اقرا أكتر",
    },
    cart: {
      title: "السلة",
      emptyTitle: "السلة فاضية",
      emptyBody: "ضيف أكلك من المنيو، واقفل السلة في أي وقت وكمل تصفح.",
      checkout: "كمّل للدفع",
      checkoutError: "معرفناش نبدأ الدفع. جرّب تاني.",
      commentsNote:
        "الحساسية والملاحظات بتتسجل على نفس الصنف وبتظهر لصاحب الطلب في Shopify.",
    },
    contact: {
      title: "تواصل معانا",
      intro: "أسرع رد بيكون على واتساب، أو ابعتلنا رسالة من الفورم.",
      whatsappPrimary: "واتساب (الأساسي)",
      whatsappBody: "دوس هنا وكلمنا عن الطلبات، المناطق، أو خطط الأكل.",
      whatsappCta: "كلّمنا على واتساب",
      direct: "معلومات مباشرة",
      hours: "المواعيد:",
      hoursText: "فاتحين من السبت للخميس، ٩ صباحًا - ٩ بالليل",
      friday: "الجمعة:",
      closed: "أجازة",
      pickup: "الاستلام:",
      pickupText: "السبت من ١٠ الصبح من مطبخنا (شوف الخريطة)",
      pickupLocation: "مكان الاستلام",
      pickupBodyPrefix: "الاستلام بس من",
      pickupBodySuffix:
        "الاستلام متاح السبت من ١٠ الصبح. لأي حاجة تانية كلمنا على واتساب.",
      openMaps: "افتح مكان الاستلام على Google Maps",
      form: {
        name: "الاسم",
        email: "الإيميل",
        phone: "الموبايل (واتساب أفضل)",
        message: "الرسالة",
        send: "ابعت الرسالة",
      },
    },
    menu: {
      eyebrow: "اختياراتنا الصحية",
      title: "المنيو",
      intro:
        "كل وجبة معمولة تحت إشراف أخصائية تغذية، متظبطة ماكروز، وبمكونات طبيعية نضيفة.",
      script: "أكل صحي وطعمه فعلًا يفرّح.",
      deliveryTitle: "الدليفري والاستلام",
      deliveryBody:
        "الدليفري متاح بس في ٦ أكتوبر والشيخ زايد. غير كده اختار استلام: الطلبات بتكون جاهزة السبت من ١٠ الصبح (أكد معانا على واتساب بعد الدفع).",
      loadError: "معرفناش نحمّل المنتجات. جرّب تاني بعد شوية.",
      noProducts: "لسه مفيش منتجات متاحة.",
      searchSr: "دور في المنيو",
      searchPlaceholder: "دور على وجبة، مكونات، أو نوع...",
      clearSearch: "امسح البحث",
      noMatchesFor: "مفيش نتيجة لـ",
      result: "نتيجة",
      results: "نتايج",
      noMatches: "مفيش نتيجة. جرّب كلمة تانية أو امسح البحث.",
      emptyCategory: "لسه مفيش حاجة في التصنيف ده. جرّب فلتر تاني.",
      filters: {
        all: "الكل",
        keto_desserts: "حلويات كيتو",
        high_protein: "بروتين عالي",
        clean_carb: "كارب نضيف",
        veggie_sides: "جوانب خضار",
        salads: "سلطات",
        frozen: "فروزن",
      },
      add: "ضيف",
      adding: "بنضيف...",
      viewDetails: "شوف التفاصيل",
      allergies: "حساسية",
      notes: "ملاحظات",
      quantity: "الكمية",
      specialRequests: "طلبات خاصة",
      addedToCart: "اتضاف للسلة",
    },
    home: {
      whatBelieve: "إحنا مؤمنين بإيه",
      feelHome: "الأكل الصحي لازم يحسسك إنه أكل بيت",
      feelHomeBody:
        "مش حرمان ولا تعقيد - أكل حقيقي على السفرة وكل البيت يحبه.",
      whyCleanEating: "ليه الأكل النضيف",
      benefits: [
        {
          title: "يساعد نمو الأطفال",
          body: "وجبات غنية بعناصر وفيتامينات ومعادن الجسم محتاجها كل يوم.",
        },
        {
          title: "طاقة للكبار طول اليوم",
          body: "ماكروز متوازنة تشبع وتدي طاقة من غير هبوط آخر اليوم.",
        },
        {
          title: "صحة على المدى الطويل",
          body: "مكونات نضيفة تساعد على وزن صحي ومناعة أقوى لكل الأعمار.",
        },
        {
          title: "سكر الدم أهدى",
          body: "وصفات مؤشرها الجلايسيمي قليل تساعد الطاقة والتركيز يفضلوا ثابتين.",
        },
        {
          title: "منيو واحد للكل",
          body: "مفيش أكل دايت وأكل عادي. كله بياكل نفس الأكل الحلو.",
        },
        {
          title: "عادات تعيش",
          body: "لما البيت كله ياكل كويس، الاختيارات الصحية بتبقى أسهل وطبيعية.",
        },
      ],
      quote: "مطبخ واحد. منيو واحد.",
      quoteAccent: "صحي لكل البيت.",
      quoteBody: "دي الفكرة ورا كل حاجة بنطبخها.",
      approach: "طريقتنا",
      hormoneTitle: "تغذية مبنية على الهرمونات",
      hormoneP1:
        "في Balanced Bites بنمشي بطريقة تغذية مبنية على الهرمونات - عشان لما الهرمونات تبقى متوازنة، الطاقة والتمثيل الغذائي والصحة عمومًا بيبقوا أحسن.",
      hormoneP2:
        "وجباتنا بتركز على بروتين عالي، دهون صحية، كارب نضيف، وفايبر عشان نثبت سكر الدم، نقلل الكرايفنج، وندعم جسمك طبيعي.",
      hormoneP3:
        "بنستخدم مكونات طبيعية وحقيقية تساعد تقلل الالتهاب وتخلي جسمك يشتغل بأحسن شكل.",
      whatUse: "بنستخدم إيه",
      realIngredients: "مكونات حقيقية. مفيش حاجة مستخبية.",
      useIntro:
        "كل حاجة واضحة في مكان واحد: إيه اللي مش بنستخدمه، وإيه البدائل النضيفة، وإيه المكونات الأساسية بتاعتنا.",
      never: "مش بنستخدم",
      insteadUse: "بدل كده بنستخدم",
      ready: "جاهز تبدأ؟",
      readyTitle: "اختار طبقك وابني أسبوعك.",
      readyBody:
        "بروتين، سايد، سلطة، وديسيرت - كله باختيارك. ابني باكدج الأسبوع وخد وجبة هدية.",
      chatWhatsapp: "كلّمنا على واتساب",
    },
    about: {
      eyebrow: "عن Balanced Bites",
      founded: "أسستها داليا",
      role: "أخصائية تغذية معتمدة",
      spotlight: "تعرف على المؤسسة",
      title: "الشخص اللي ورا المنيو",
      intro: "تغذية، طعم، ووضوح في كل طبق.",
      p1: "داليا سُعودي أخصائية تغذية معتمدة وعندها خبرة عملية في تصميم خطط أكل صحية ومناسبة لكل شخص. خبرتها مركزة على الأكل النضيف، الوجبات المتوازنة، والمكونات اللي نثق فيها.",
      p2: "هدفها تساعد الناس توصل لصحة أحسن من خلال وجبات وحلويات قيمتها الغذائية عالية وطعمها حلو. ومن قصص التحول الحقيقية، بدأت Balanced Bites عشان تقدم اختيارات نضيفة، لذيذة، وموافَق عليها من أخصائية تغذية.",
      quote: "الأكل النضيف لازم يبقى دافي، كريم، وسهل تثق فيه.",
      philosophy: "فلسفتنا",
      philosophyTitle: "الأكل رسالة لهرمونات جسمك.",
      philosophyText:
        "في Balanced Bites بنمشي بطريقة تغذية مبنية على الهرمونات، عشان توازن الهرمونات يساعد طاقتك، الميتابوليزم، المزاج، وحرق الدهون. وجباتنا مبنية على بروتين عالي، دهون صحية، كارب نضيف، وفايبر عشان تدعم رتم جسمك الطبيعي.",
      philosophyClosing:
        "إحنا مش بنقدم أكل بس - إحنا بنساعدك تفهم جسمك وتبني لايف ستايل صحي ومستمر.",
    },
    learn: {
      eyebrow: "مركز التغذية",
      title: "اتعلم",
      intro:
        "قرايات وفيديوهات قصيرة تساعد البيت كله ياكل أحسن من غير توتر. الجديد بينزل هنا الأول.",
      cards: [
        {
          title: "أساسيات التغذية",
          desc: "أفكار بسيطة عن الطبق المتوازن، الماكروز، والطاقة اليومية.",
        },
        {
          title: "دليل الكيتو",
          desc: "إزاي بنفكر في اختيارات قليلة الكارب ومناسبة للكيتو.",
        },
        {
          title: "نصايح صحية",
          desc: "عادات عملية للجداول الزحمة وسفرة البيت.",
        },
        {
          title: "فيديوهات داليا",
          desc: "رسائل وملاحظات من المطبخ من داليا وفريق Balanced Bites.",
        },
      ],
    },
    account: {
      customer: "العميل",
      title: "حسابي",
      intro: "طلباتك وبياناتك - بنفس checkout الآمن لما تطلب من المنيو.",
      shopMenu: "تسوق من المنيو",
      includes: "حسابك فيه",
      orderHistory: "تاريخ الطلبات",
      orderHistoryBody: "في مكان واحد - التواريخ والإجماليات واضحة.",
      orderAgain: "اطلب تاني",
      orderAgainBody: "بدوسة واحدة - رجّع أي طلب قديم للسلة فورًا.",
      secureSignIn: "دخول آمن",
      secureBody: "عن طريق Shopify - نفس checkout اللي بتثق فيه.",
      signIn: "تسجيل الدخول",
      signInBody: "استخدم النافذة الآمنة - وبعدها هترجع هنا تلقائي.",
      create: "اعمل حساب",
      login: "ادخل",
      notEnabled:
        "الحسابات الأونلاين لسه مش متفعلة هنا. تقدر تطلب من المنيو كضيف عادي.",
      dashboardError: "معرفناش نحمّل حسابك",
      dashboardRetry: "جرّب تخرج وتدخل تاني. السلة والمنيو زي ما هم.",
      logout: "تسجيل خروج",
    },
  },
} as const;

export type Dictionary = (typeof dict)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dict[locale];
}
