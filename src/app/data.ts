// app/dark/data.ts

export type Family =
  | "Тидеманн"
  | "Допплер"
  | "Нильсен"
  | "Канвальд"
  | "Таубер"
  | "Альберс"
  | "Обендорф"
  | "Таннхаус"
  | "—";

export type LinkType =
  | "parent"
  | "paradox_parent"
  | "adoptive"
  | "partner"
  | "sibling";

export type Gender = "m" | "f";

export type DarkNode = {
  id: string;
  full: string;
  family: Family;
  dead: boolean;
  gender: Gender;
  born?: number;
  died?: number;
  occupation?: string;
  aliases?: string[];
  timetravel?: boolean;
};

export type DarkLink = { s: string; t: string; type: LinkType; note?: string };

export const FAMILY_COLORS: Record<Family, string> = {
  Тидеманн: "#a83a2e",
  Допплер: "#3a5a7e",
  Нильсен: "#4a7a4f",
  Канвальд: "#b3782a",
  Таубер: "#6b4a8c",
  Альберс: "#3d7a7c",
  Обендорф: "#5a6470",
  Таннхаус: "#a87432",
  "—": "#3a3530",
};

export const NODES: DarkNode[] = [
  // ============== ТИДЕМАНН ==============
  {
    id: "doris",
    full: "Дорис Тидеманн",
    family: "Тидеманн",
    dead: true,
    gender: "f",
    born: 1922,
    died: 1964,
  },
  {
    id: "egon",
    full: "Эгон Тидеманн",
    family: "Тидеманн",
    dead: true,
    gender: "m",
    born: 1922,
    died: 1987,
    occupation: "Полицейский",
  },
  {
    id: "claudia",
    full: "Клаудия Тидеманн",
    family: "Тидеманн",
    dead: true,
    gender: "f",
    born: 1942,
    died: 2019,
    occupation: "Директор АЭС",
    aliases: ["Белый Дьявол"],
  },
  {
    id: "regina",
    full: "Регина Тидеманн",
    family: "Тидеманн",
    dead: true,
    gender: "f",
    born: 1971,
    died: 2020,
    occupation: "Владелица отеля",
  },
  {
    id: "alexander",
    full: "Александр Тидеманн",
    family: "Тидеманн",
    dead: true,
    gender: "m",
    born: 1966,
    died: 2020,
    occupation: "Директор АЭС",
    aliases: ["Борис Нивальд"],
  },
  {
    id: "silja",
    full: "Силья Тидеманн",
    family: "Тидеманн",
    dead: true,
    gender: "f",
    born: 1988,
    died: 1910,
    timetravel: true,
  },
  {
    id: "bartosh",
    full: "Бартош Тидеманн",
    family: "Тидеманн",
    dead: true,
    gender: "m",
    born: 2003,
    died: 1921,
    occupation: "Студент",
    timetravel: true,
  },

  // ============== ДОППЛЕР ==============
  {
    id: "bernd",
    full: "Бернд Допплер",
    family: "Допплер",
    dead: true,
    gender: "m",
    born: 1913,
    died: 1987,
    occupation: "Директор АЭС",
  },
  {
    id: "greta",
    full: "Грета Допплер",
    family: "Допплер",
    dead: true,
    gender: "f",
    occupation: "Домохозяйка",
  },
  {
    id: "anatol",
    full: "Анатоль Велиев",
    family: "—",
    dead: true,
    gender: "m",
  },
  {
    id: "helge",
    full: "Хельге Допплер",
    family: "Допплер",
    dead: true,
    gender: "m",
    born: 1943,
    died: 1986,
    occupation: "Охранник АЭС",
  },
  { id: "ulla", full: "Улла Шмидт", family: "—", dead: true, gender: "f" },
  {
    id: "peter",
    full: "Петер Допплер",
    family: "Допплер",
    dead: true,
    gender: "m",
    born: 1970,
    died: 2020,
    occupation: "Психотерапевт",
  },
  {
    id: "sharlotta",
    full: "Шарлотта Допплер",
    family: "Допплер",
    dead: false,
    gender: "f",
    born: 2041,
    occupation: "Начальник полиции",
  },
  {
    id: "franziska",
    full: "Франциска Допплер",
    family: "Допплер",
    dead: false,
    gender: "f",
    born: 2003,
    occupation: "Студентка",
  },
  {
    id: "elizabeth",
    full: "Элизабет Допплер",
    family: "Допплер",
    dead: false,
    gender: "f",
    born: 2011,
    occupation: "Лидер · 2052",
  },

  // ============== НИЛЬСЕН ==============
  {
    id: "agnes",
    full: "Агнес Нильсен",
    family: "Нильсен",
    dead: false,
    gender: "f",
    born: 1910,
  },
  {
    id: "tronte",
    full: "Тронте Нильсен",
    family: "Нильсен",
    dead: false,
    gender: "m",
    born: 1940,
    occupation: "Журналист",
  },
  {
    id: "jana",
    full: "Яна Нильсен",
    family: "Нильсен",
    dead: false,
    gender: "f",
  },
  {
    id: "ulrich",
    full: "Ульрих Нильсен",
    family: "Нильсен",
    dead: false,
    gender: "m",
    born: 1971,
    occupation: "Полицейский",
    aliases: ["Инспектор"],
  },
  {
    id: "katarina",
    full: "Катарина Нильсен",
    family: "Нильсен",
    dead: true,
    gender: "f",
    born: 1970,
    died: 1987,
  },
  {
    id: "mads",
    full: "Мадс Нильсен",
    family: "Нильсен",
    dead: true,
    gender: "m",
    born: 1973,
    died: 1986,
  },
  {
    id: "magnus",
    full: "Магнус Нильсен",
    family: "Нильсен",
    dead: false,
    gender: "m",
    born: 2001,
    occupation: "Студент",
  },
  {
    id: "marta",
    full: "Марта Нильсен",
    family: "Нильсен",
    dead: true,
    gender: "f",
    born: 2003,
    died: 2020,
    aliases: ["Ева"],
  },
  {
    id: "istok",
    full: "Исток",
    family: "Нильсен",
    dead: true,
    gender: "m",
    timetravel: true,
  },

  // ============== КАНВАЛЬД ==============
  {
    id: "daniel",
    full: "Дэниел Канвальд",
    family: "Канвальд",
    dead: true,
    gender: "m",
    occupation: "Начальник полиции (1953)",
  },
  {
    id: "ines",
    full: "Инес Канвальд",
    family: "Канвальд",
    dead: false,
    gender: "f",
    occupation: "Медсестра",
  },
  {
    id: "sebastian",
    full: "Себастьян Крюгер",
    family: "—",
    dead: true,
    gender: "m",
  },
  {
    id: "hanna",
    full: "Ханна Канвальд",
    family: "Канвальд",
    dead: true,
    gender: "f",
    born: 1972,
    died: 1911,
    occupation: "Массажистка",
    aliases: ["Ханна Крюгер"],
    timetravel: true,
  },
  {
    id: "mikhael",
    full: "Михаэль Канвальд",
    family: "Канвальд",
    dead: true,
    gender: "m",
    born: 2008,
    died: 2019,
    occupation: "Художник",
    aliases: ["Миккель Нильсен"],
    timetravel: true,
  },
  {
    id: "jonas",
    full: "Йонас Канвальд",
    family: "Канвальд",
    dead: true,
    gender: "m",
    born: 2003,
    died: 2019,
    aliases: ["Адам"],
  },

  // ============== ТАУБЕР ==============
  {
    id: "hanno",
    full: "Ханно Таубер",
    family: "Таубер",
    dead: true,
    gender: "m",
    born: 1904,
    died: 1921,
    occupation: "Священник",
    aliases: ["Ной"],
  },

  // ============== АЛЬБЕРС ==============
  {
    id: "helen",
    full: "Хелен Альберс",
    family: "Альберс",
    dead: false,
    gender: "f",
    born: 1942,
  },
  {
    id: "herman",
    full: "Херманн Альберс",
    family: "Альберс",
    dead: false,
    gender: "m",
  },

  // ============== ОБЕНДОРФ ==============
  {
    id: "jurgen",
    full: "Юрген Обендорф",
    family: "Обендорф",
    dead: false,
    gender: "m",
    occupation: "Хозяин свалки",
  },
  {
    id: "ulla_o",
    full: "Улла Обендорф",
    family: "Обендорф",
    dead: false,
    gender: "f",
  },
  {
    id: "erik",
    full: "Эрик Обендорф",
    family: "Обендорф",
    dead: true,
    gender: "m",
    born: 2004,
    died: 1953,
    occupation: "Старшеклассник",
  },
  {
    id: "kilian",
    full: "Килиан Обендорф",
    family: "Обендорф",
    dead: false,
    gender: "m",
  },

  // ============== ТАННХАУС ==============
  {
    id: "tannhaus",
    full: "Х.Г. Таннхаус",
    family: "Таннхаус",
    dead: false,
    gender: "m",
    occupation: "Часовщик",
  },
  {
    id: "marek",
    full: "Марек Таннхаус",
    family: "Таннхаус",
    dead: true,
    gender: "m",
    died: 1971,
    occupation: "—",
  },
  {
    id: "sonja",
    full: "Соня Таннхаус",
    family: "Таннхаус",
    dead: true,
    gender: "f",
    died: 1971,
  },
  {
    id: "charlotte_t",
    full: "Шарлотта Таннхаус",
    family: "Таннхаус",
    dead: true,
    gender: "f",
    died: 1971,
    occupation: "Дочь Марека и Сони",
  },
];

export const LINKS: DarkLink[] = [
  // ===== partners =====
  { s: "egon", t: "doris", type: "partner" },
  { s: "egon", t: "hanna", type: "partner", note: "через время" },
  { s: "bernd", t: "greta", type: "partner" },
  { s: "bernd", t: "claudia", type: "partner", note: "любовник" },
  { s: "alexander", t: "regina", type: "partner" },
  { s: "peter", t: "sharlotta", type: "partner" },
  { s: "tronte", t: "jana", type: "partner" },
  { s: "ulrich", t: "katarina", type: "partner" },
  { s: "mikhael", t: "hanna", type: "partner" },
  { s: "bartosh", t: "silja", type: "partner" },
  { s: "hanno", t: "elizabeth", type: "partner", note: "парадокс" },
  { s: "jonas", t: "marta", type: "partner" },
  { s: "istok", t: "agnes", type: "partner" },
  { s: "magnus", t: "franziska", type: "partner" },
  { s: "herman", t: "helen", type: "partner" },
  { s: "jurgen", t: "ulla_o", type: "partner" },
  { s: "marek", t: "sonja", type: "partner" },
  // Дорис и Агнес имели роман в 1953 (упомянуто в секциях обеих)
  { s: "doris", t: "agnes", type: "partner", note: "любовницы (1953)" },

  // ===== bio parents =====
  // Тидеманн линия
  { s: "egon", t: "claudia", type: "parent" },
  { s: "doris", t: "claudia", type: "parent" },
  { s: "egon", t: "silja", type: "parent" },
  { s: "hanna", t: "silja", type: "parent" },
  { s: "claudia", t: "regina", type: "parent" },
  { s: "bernd", t: "regina", type: "parent" },
  { s: "alexander", t: "bartosh", type: "parent" },
  { s: "regina", t: "bartosh", type: "parent" },
  { s: "bartosh", t: "hanno", type: "parent" },
  { s: "silja", t: "hanno", type: "parent" },
  { s: "bartosh", t: "agnes", type: "parent" },
  { s: "silja", t: "agnes", type: "parent" },

  // Канвальд линия
  { s: "daniel", t: "ines", type: "parent" },
  { s: "sebastian", t: "hanna", type: "parent" },
  { s: "mikhael", t: "jonas", type: "parent" },
  { s: "hanna", t: "jonas", type: "parent" },

  // Нильсен линия
  { s: "istok", t: "tronte", type: "parent" },
  { s: "agnes", t: "tronte", type: "parent" },
  { s: "tronte", t: "ulrich", type: "parent" },
  { s: "jana", t: "ulrich", type: "parent" },
  { s: "tronte", t: "mads", type: "parent" },
  { s: "jana", t: "mads", type: "parent" },
  { s: "ulrich", t: "magnus", type: "parent" },
  { s: "katarina", t: "magnus", type: "parent" },
  { s: "ulrich", t: "marta", type: "parent" },
  { s: "katarina", t: "marta", type: "parent" },
  { s: "ulrich", t: "mikhael", type: "parent" },
  { s: "katarina", t: "mikhael", type: "parent" },

  // Допплер линия
  { s: "anatol", t: "helge", type: "parent" },
  { s: "greta", t: "helge", type: "parent" },
  { s: "helge", t: "peter", type: "parent" },
  { s: "ulla", t: "peter", type: "parent" },
  { s: "peter", t: "franziska", type: "parent" },
  { s: "sharlotta", t: "franziska", type: "parent" },
  { s: "peter", t: "elizabeth", type: "parent" },
  { s: "sharlotta", t: "elizabeth", type: "parent" },

  // Альберс линия
  { s: "herman", t: "katarina", type: "parent" },
  { s: "helen", t: "katarina", type: "parent" },

  // Обендорф линия
  { s: "jurgen", t: "erik", type: "parent" },
  { s: "ulla_o", t: "erik", type: "parent" },
  { s: "jurgen", t: "kilian", type: "parent" },
  { s: "ulla_o", t: "kilian", type: "parent" },

  // Таннхаус линия (origin world — погибла в 1971)
  { s: "tannhaus", t: "marek", type: "parent" },
  { s: "marek", t: "charlotte_t", type: "parent" },
  { s: "sonja", t: "charlotte_t", type: "parent" },

  // ===== paradox parents =====
  { s: "hanno", t: "sharlotta", type: "paradox_parent" },
  { s: "elizabeth", t: "sharlotta", type: "paradox_parent" },
  { s: "jonas", t: "istok", type: "paradox_parent" },
  { s: "marta", t: "istok", type: "paradox_parent" },

  // ===== adoptive =====
  { s: "ines", t: "mikhael", type: "adoptive" },
  { s: "bernd", t: "helge", type: "adoptive" },
  // Таннхаус взял младенца Шарлотту Допплер после гибели своей семьи в 1971
  { s: "tannhaus", t: "sharlotta", type: "adoptive", note: "приёмный дед" },
];

// ===== precomputed lookup maps =====
export const nodeById: Record<string, DarkNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
);

type Adj = { id: string; type: LinkType };
export const parentsOf: Record<string, Adj[]> = {};
export const childrenOf: Record<string, Adj[]> = {};
export const partnersOf: Record<string, { id: string; note?: string }[]> = {};

NODES.forEach((n) => {
  parentsOf[n.id] = [];
  childrenOf[n.id] = [];
  partnersOf[n.id] = [];
});
LINKS.forEach((l) => {
  if (
    l.type === "parent" ||
    l.type === "paradox_parent" ||
    l.type === "adoptive"
  ) {
    parentsOf[l.t].push({ id: l.s, type: l.type });
    childrenOf[l.s].push({ id: l.t, type: l.type });
  }
  if (l.type === "partner") {
    partnersOf[l.s].push({ id: l.t, note: l.note });
    partnersOf[l.t].push({ id: l.s, note: l.note });
  }
  if (l.type === "sibling") {
    partnersOf[l.s].push({ id: l.t, note: "брат/сестра" });
    partnersOf[l.t].push({ id: l.s, note: "брат/сестра" });
  }
});
