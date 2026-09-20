/** Tipos de la API. Espejan las respuestas de api-skill_path. */

export type Rating = "forgot" | "hard" | "easy";
export type CardState = "new" | "learning" | "mastered";
export type QuizStatus = "in_progress" | "submitted";

export interface Session {
  userId: string;
  name: string;
  email: string;
  initials: string;
  token: string;
  expiresIn: number;
}

export interface Profile {
  userId: string;
  name: string;
  email: string;
  initials: string;
  createdAt: string;
}

export interface Topic {
  topicId: string;
  name: string;
  description: string | null;
  cardCount: number;
  icon: string | null;
  level: string | null;
}

export interface FollowedTopic {
  topicId: string;
  name: string;
  cardCount: number;
  icon: string | null;
  isOwn: boolean;
  followedAt: string;
}

export interface FollowResult {
  topicId: string;
  name: string;
  cardCount: number;
  alreadyFollowing: boolean;
}

export interface Flashcard {
  cardId: string;
  question: string;
  answer: string;
  hint: string | null;
  position: number;
  state: CardState;
}

export interface DueCards {
  topicId: string;
  topicName: string | null;
  dueCount: number;
  cardsTotal: number;
  cardsMastered: number;
  xpAvailable: number;
  items: Flashcard[];
}

export interface ReviewResult {
  cardId: string;
  topicId: string;
  rating: Rating;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: string;
  state: CardState;
  xpAwarded: number;
  remainingDue: number;
  progress: TopicProgress | null;
}

export interface TopicProgress {
  topicId: string;
  topicName: string | null;
  cardsTotal: number;
  cardsMastered: number;
  cardsPending: number;
  percent: number;
  lastStudiedAt: string | null;
  xpTotal?: number;
  streakDays?: number;
}

export interface ProgressSummary {
  streakDays: number;
  longestStreakDays: number;
  xpTotal: number;
  lastStudiedAt: string | null;
  studiedToday: boolean;
  masteryPercent: number;
  cardsMastered: number;
  cardsTotal: number;
}

export interface ProgressOverview {
  summary: ProgressSummary;
  items: TopicProgress[];
}

export interface QuizOption {
  key: string;
  text: string;
}

export interface QuizQuestion {
  questionId: string;
  position: number;
  prompt: string;
  options: QuizOption[];
}

export interface Quiz {
  quizId: string;
  topicId: string;
  topicName: string | null;
  questionCount: number;
  timeLimitSeconds: number;
  xpReward: number;
  basedOnConcepts: number;
  startedAt: string;
  questions: QuizQuestion[];
}

export interface QuizAnswerResult {
  questionId: string;
  cardId: string;
  prompt: string;
  selected: string | null;
  correctKey: string;
  correct: boolean;
}

export interface ConceptToReview {
  cardId: string;
  concept: string;
}

export interface QuizResult {
  quizId: string;
  topicId: string;
  topicName: string | null;
  score: number;
  correctCount: number;
  total: number;
  xpAwarded: number;
  timedOut: boolean;
  submittedAt: string;
  results: QuizAnswerResult[];
  conceptsToReview: ConceptToReview[];
}

export interface Deck {
  topicId: string;
  name: string;
  description: string | null;
  cardCount: number;
  icon: string | null;
  isOwn?: boolean;
  createdAt: string;
}

export interface DeckCard {
  cardId: string;
  question: string;
  answer: string;
  hint: string | null;
}

export interface DeckDetail extends Deck {
  cards: DeckCard[];
}

export interface NewCard {
  question: string;
  answer: string;
  hint?: string | null;
}

/** Detalle del error 409 cuando faltan conceptos para el quiz. */
export interface NotEnoughConcepts {
  studied: number;
  required: number;
  topicName: string;
}
