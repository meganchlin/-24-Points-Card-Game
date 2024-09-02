////////////////////////////////////////////////////////////////////////////////////////////
// data model for cards and game state

export interface Config {
  numberOfDecks: number
  rankLimit: number
}

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

export const RANK_VALUES: { [key: string]: number } = {
  "A": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
  "J": 11, "Q": 12, "K": 13
}
export const SUITS = ["♦️", "♥️", "♣️", "♠️"]

export type CardId = string
export type LocationType = "unused" | "last-card-played" | "player-hand"

export interface Card {
  id: CardId
  rank: typeof RANKS[number]
  suit: typeof SUITS[number]
  locationType: LocationType
  playerIndex: number | null
  positionInLocation: number | null
}

export type GamePhase = "initial-card-dealing" | "play" | "game-over"

export interface GameState {
  index: number
  playerNames: string[]
  cardsById: Record<CardId, Card>
  currentTurnPlayerIndex: number
  phase: GamePhase
  playerScores: number[] // scores for each player
  playerStopped: boolean[] // if a player has stopped drawing
  winners: string[]
}

////////////////////////////////////////////////////////////////////////////////////////////
// player actions

export interface DrawCardAction {
  action: "draw-card"
  playerIndex: number
}

export interface StopDrawingAction {
  action: "stop-drawing"
  playerIndex: number
}


export type Action = DrawCardAction | StopDrawingAction