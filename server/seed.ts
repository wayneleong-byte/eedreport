// Seed content mirroring the current live eedreport.pplx.app site.
export interface SeedItem {
  title: string;
  meta?: string;
  description?: string;
  status?: string;
}
export interface SeedSection {
  title: string;
  anchor: string;
  position: number;
  items: SeedItem[];
}

export const seedData: SeedSection[] = [
  {
    title: "展覽中心展廳更新",
    anchor: "SEC_A",
    position: 0,
    items: [
      {
        title: "MGM 展品更新 & RAMP 美化",
        meta: "MGM Collaboration｜2026 H3",
        description:
          "展品製作招標進行中。Ramp美化待MGM提交Concept Design，呈交上級審批後進行。以上目標在9月前完成。",
        status: "",
      },
      {
        title: "澳大標本展藏品轉到我館",
        meta: "",
        description: "今天到澳大了解對方提出的想法及展項內容。",
        status: "READY",
      },
    ],
  },
  {
    title: "特備展覽",
    anchor: "SEC_B",
    position: 1,
    items: [
      {
        title: "公共安全體驗展",
        meta: "籌備中｜2026.09.24 - 2027.02.21",
        description: "6月7-10日到重慶進行展品檢查及驗收工作。其他有序進行中。",
        status: "籌備中",
      },
      {
        title: "橋樑主題展覽",
        meta: "2027 H1",
        description:
          "澳門區展項內容及布置深化設計已跟設計部協調，目前已開始展項內容製作（影片及自行開發多媒體遊戲部份）。",
        status: "",
      },
      {
        title: "無象之境 (Vision Pro)",
        meta: "",
        description: "供應商準備中，已協調五樓場地使用安排。",
        status: "",
      },
      {
        title: "澳門科學館神舟廿三號航天任務圖片展及天宮課堂",
        meta: "",
        description: "海報是模擬，非正式的。",
        status: "",
      },
    ],
  },
  {
    title: "已完成項目",
    anchor: "SEC_C",
    position: 2,
    items: [
      { title: "無障礙通達服務【人工智能眼鏡的應用】", meta: "", description: "", status: "READY" },
      { title: "IMD 活動", meta: "", description: "", status: "READY" },
      { title: "蒸氣誌5月號", meta: "", description: "", status: "READY" },
      {
        title: "比賽活動",
        meta: "",
        description:
          "2025-2026大灣區STEAM創意綜合繪畫比賽頒獎禮（400多人，大多來自香港，亦有廣東）。國際青少年創科教育大賽（澳門區）2026：不插電編程挑戰賽、物聯網（IoT）比賽、AI人工智能挑戰賽。",
        status: "READY",
      },
      {
        title: "內部培訓項目",
        meta: "",
        description: "Gemini 主管班；Rokid AR 內容製作班。",
        status: "READY",
      },
      { title: "MGM 員工SDG培訓及活動", meta: "已完成", description: "", status: "READY" },
    ],
  },
  {
    title: "協辦比賽",
    anchor: "SEC_D",
    position: 3,
    items: [
      {
        title: "2025-26 全國青少年勞動技能與智能設計大賽（AILD智能設計大賽）",
        meta: "",
        description:
          "此為白名單項目，本年主題是「2026人工智能賦能永續發展創新挑戰賽」。",
        status: "",
      },
      {
        title: "第二十一屆青少年科普書籍閱讀獎勵活動",
        meta: "",
        description: "科協主辦、我館協辦。",
        status: "READY",
      },
    ],
  },
  {
    title: "AI 教育工作",
    anchor: "SEC_E",
    position: 4,
    items: [
      {
        title: "「智醒老友記AI學園」",
        meta: "",
        description:
          "針對65歲或以上人士參與AI項目比例偏低，現針對性開展系列課程，6月開始。會提供小禮物以吸引參加。",
        status: "",
      },
    ],
  },
  {
    title: "其他事項",
    anchor: "SEC_F",
    position: 5,
    items: [
      {
        title: "STEM RACING 被盜用澳門區事件跟進",
        meta: "",
        description: "官方CEO已補回 AWARD，表揚隊伍及我館活動組織。",
        status: "",
      },
      {
        title: "EDU空缺招聘及升職試進行中",
        meta: "",
        description: "",
        status: "READY",
      },
    ],
  },
];
