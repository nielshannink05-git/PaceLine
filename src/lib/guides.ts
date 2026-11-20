export type GuideArticle = {
  slug: string;
  category: string;
  sportLabel: string;
  readTime: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  sections: {
    heading: string;
    paragraphs: string[];
  }[];
};

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: "waarom-een-negative-split-werkt",
    category: "Pacing & Strategie",
    sportLabel: "Hardlopen",
    readTime: "3 min leestijd",
    title: "Waarom een vlakke negative split je snelste halve marathon oplevert",
    excerpt:
      "Te snel starten in de eerste drie kilometer kost je na kilometer 16 dubbel zoveel tijd. Zo deel je jouw race slim in met een kleine versnelling in de tweede helft.",
    publishedAt: "November 2026",
    sections: [
      {
        heading: "De valkuil van het startvak",
        paragraphs: [
          "Zodra het startschot klinkt en de adrenaline stijgt, lopen bijna alle lopers 10 tot 15 seconden per kilometer harder dan hun doeltempo. Het voelt moeiteloos, maar je verbruikt ongemerkt je glycogeenvoorraad en bouwt vroegtijdig lactaat op.",
          "Door bewust 2% tot 2,5% rustiger te openen in het eerste kwart van de wedstrijd, spaar je energie voor het moment waarop het echt zwaar wordt: de laatste vijf kilometer.",
        ],
      },
      {
        heading: "Samen het tempo bewaken in een pace-treintje",
        paragraphs: [
          "Alleen op je horloge turen terwijl je moe wordt is lastig. Wanneer je in het startvak aanhaakt bij twee of drie lopers met exact dezelfde streeftijd, vang je elkaar uit de wind en houd je elkaar scherp om niet te vroeg te versnellen.",
        ],
      },
    ],
  },
  {
    slug: "no-drop-en-kop-over-kop-spelregels",
    category: "Groepsritten",
    sportLabel: "Wielrennen",
    readTime: "4 min leestijd",
    title: "Samen uit, samen thuis: zo rijd je ontspannen in een wielrengroep",
    excerpt:
      "Wat betekent No-drop precies, hoe werkt een efficiënte kop-over-kop wissel en waarom voorkomt een duidelijke groepsindeling vooraf alle frustratie onderweg?",
    publishedAt: "November 2026",
    sections: [
      {
        heading: "Duidelijkheid voor vertrek",
        paragraphs: [
          "De meeste onrust in fietsgroepen ontstaat niet tijdens de rit, maar ervoor: de een wil een rustige duurtraining van 28 km/u, terwijl de ander op elk viaduct wil doortrekken naar 36 km/u.",
          "Op PaceLine splitsen we ritten daarom vooraf in overzichtelijke tempovakken (zoals Peloton A en Peloton B No-drop). Zo weet iedereen vooraf waar hij aan toe is.",
        ],
      },
      {
        heading: "De gouden regels van No-drop",
        paragraphs: [
          "Bij een No-drop rit geldt: bovenop klimmetjes, na haakse bochten en bij pech onderweg wordt het tempo vooraan teruggenomen totdat de hele groep weer compleet is. Zo komt iedereen met een glimlach bij de koffiestop aan.",
        ],
      },
    ],
  },
  {
    slug: "parcourskennis-voor-de-wedstrijddag",
    category: "Voorbereiding",
    sportLabel: "Hardlopen & Wielrennen",
    readTime: "3 min leestijd",
    title: "Waar lokale parcourskennis het verschil maakt op wedstrijddag",
    excerpt:
      "Van onbeschutte polderwegen met tegenwind tot de beste parkeerplek op 5 minuten lopen van het startvak: lokale tips besparen je onnodige stress.",
    publishedAt: "November 2026",
    sections: [
      {
        heading: "Meer dan alleen een GPX-lijntje",
        paragraphs: [
          "Een hoogteprofiel vertelt je hoeveel hoogtemeters er in een route zitten, maar niet waar de klinkers slecht liggen, op welk stuk de wind meestal schuin tegen staat of welke verzorgingspost het rustigst is.",
          "Op elke wedstrijdpagina van PaceLine verzamelen sporters die eerdere edities hebben uitgereden precies die praktische informatie voor elkaar.",
        ],
      },
    ],
  },
];