// A simple database that lives on your phone
const STORAGE_KEY = "b3tr_surveys";

export interface Survey {
  id: string;
  title: string;
  description: string;
  reward: number; // How much the user gets
  fee: number;    // How much YOU get
  questions: { text: string }[];
  createdAt: number;
}

export const SurveyStorage = {
  getAll: (): Survey[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  add: (survey: Omit<Survey, "id" | "createdAt">) => {
    const surveys = SurveyStorage.getAll();
    const newSurvey = {
      ...survey,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newSurvey, ...surveys]));
    return newSurvey;
  }
};
