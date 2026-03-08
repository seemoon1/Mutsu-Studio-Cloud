
export type CharConfig = {
  id: string;        
  name: string;      
  sub: string;       
  hex: string;       
  avatar: string;    
  keys: string[];    
  lore?: string; 
  baseStats: {       
    Obsession: number;
    affection?: number; 
    Possessiveness?: number;  
    Intimacy?: number;      
  };
};

export const CHAR_DATA: CharConfig[] = [
  // === User ===
  {
    id: "user", name: "月", sub: "Director / Actor", hex: "#6A5ACD", avatar: "🌙",
    keys:["User", "月", "我"], 
    baseStats: { Obsession: 0 }
  },
  
  // === MyGO!!!!! ===
  {
    id: "tomori", name: "高松 灯", sub: "MyGO!!!!!", hex: "#3498db", avatar: "🐧",
    keys: ["灯","高松灯","小灯","Tomori","tomorin","灯皇","高松","ともり","たかまつ","tomori","企鹅","takamatsu","Takamatsu","Tomori"],
    baseStats: { Obsession: 55 }
  },
  {
    id: "anon", name: "千早 爱音", sub: "MyGO!!!!!", hex: "#FF8899", avatar: "🎸",
    keys: ["爱音","千早爱音","小爱","小爱音","圣爱音","anon","千早","あのん","ちはや","Anon","chihaya","Chihaya","Chihaya anon"],
    baseStats: { Obsession: 0 }
  },
  {
    id: "soyo", name: "长崎 素世", sub: "MyGO!!!!!", hex: "#FFDD88", avatar: "🥐",
    keys: ["素世","长崎素世","爽世","长崎爽世","そよ","soyo","soyorin","长崎","一之濑","一之濑素世","一之濑爽世","ながさき",],
    baseStats: { Obsession: 60 }
  },
  {
    id: "taki", name: "椎名 立希", sub: "MyGO!!!!!", hex: "#7777AA", avatar: "🐼",
    keys: ["立希","椎名立希","椎名","たき","しいな","しいなたき","shiina","Shiina","taki","Taki","Rikki","rikki","りっきー","狸希"],
    baseStats: { Obsession: 8 }
  },
  {
    id: "rana", name: "要 乐奈", sub: "MyGO!!!!!", hex: "#77DD77", avatar: "🐱",
    keys: ["要乐奈","乐奈","かなめ","らな","かなめ　らな","Kaname","rana","Rana","kaname","Kaname rana","抹茶芭菲"],
    baseStats: { Obsession: 1 }
  },

  // === Ave Mujica ===
  {
    id: "sakiko", name: "丰川 祥子", sub: "Ave Mujica", hex: "#7799CC", avatar: "🎹",
    keys: ["祥子","小祥","丰川祥子","丰川","saki","さき","とがわ","さきこ","sakiko","さきちゃん","Oblivionis",],
    baseStats: { Obsession: 20 }
  },
  {
    id: "mutsu", name: "若叶 睦", sub: "Ave Mujica", hex: "#779977", avatar: "🥒",
    keys: ["睦", "墨缇丝", "Mortis", "mortis", "若叶睦", "若叶", "Mutsumi", "睦子米", "小睦", "睦头人", "むつみ", "わかば", "モーティス"],
    baseStats: { Obsession: 15 }
  },
  {
    id: "uika", name: "三角 初华", sub: "Ave Mujica", hex: "#BB9955", avatar: "✨",
    keys: ["三角初华","初华","三角","初音","丰川初音","Doloris","doloris","uika","misumi","sumimi","ういか","みすみ","ういかちゃん","Misumi","はつね","miku"],
    baseStats: { Obsession: 70 }
  },
  {
    id: "nyamu", name: "祐天寺 若麦", sub: "Ave Mujica", hex: "#AA4477", avatar: "💄",
    keys: ["祐天寺若麦", "若麦", "喵姆", "喵姆亲", "喵梦", "ゆうてんじ", "にゃむ", "にゃむち", "ゆうてんじ にゃむ", "Amoris", "amoris", "nyumu", "Nyamu", "祐天寺"],
    baseStats: { Obsession: 3 }
  },
  {
    id: "umiri", name: "八幡 海铃", sub: "Ave Mujica", hex: "#335566", avatar: "🎧",
    keys: ["八幡海铃","八幡","Timoris","timoris","贝斯雇佣兵","やはた","うみり","やはた　うみり","Yahata","yahata","Umiri","umiri","Yahata umiri","海铃","海玲"],
    baseStats: { Obsession: 10 }
  },

  // === Sumimi ===
  {
    id: "mana", name: "纯田 真奈", sub: "Sumimi", hex: "#D2B48C", avatar: "🍊",
    keys: ["纯田真奈","纯田","真奈","甜甜圈","sumimi","すみた","まな","すみた　まな","sumita","Sumita","Mana","mana","Sumita mana"],
    baseStats: { Obsession: 1 }
  }
];