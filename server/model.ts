////////////////////////////////////////////////////////////////////////////////////////////
// data model for cards and game state

import { GameConfig } from "./data"

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


/**
 * extracts the cards that are currently in the given player's hand
 */
export function extractPlayerCards(cardsById: Record<CardId, Card>, playerIndex: number): Card[] {
  return Object.values(cardsById).filter(({ playerIndex: x }) => x === playerIndex)
}

/**
 * determines if someone has won the game -- i.e., has no cards left in their hand
 */
// export function determineWinner(state: GameState) {
//   if (state.phase === "initial-card-dealing") {
//     return null
//   }
//   const playerIndex = computePlayerCardCounts(state).indexOf(0)
//   return playerIndex === -1 ? null : playerIndex
// }


/**
determine the winner based on the closest score to 24
*/
export function determineWinner(state: GameState, config: GameConfig): string[] {
  const validScores = state.playerScores.filter(score => score <= config.totalPoints)
  const maxScore = Math.max(...validScores)
  return state.playerScores
    .map((score, index) => ({ score, index }))
    .filter(({ score }) => score === maxScore)
    .map(({ index }) => state.playerNames[index]) // Convert indices to userIDs
}

/**
 * creates an empty GameState in the initial-card-dealing state
 */
export function createEmptyGame(playerNames: string[], numberOfDecks = 5, rankLimit = Infinity): GameState {
  const cardsById: Record<CardId, Card> = {}
  let cardId = 0

  for (let i = 0; i < numberOfDecks; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS.slice(0, rankLimit)) {
        const card: Card = {
          suit,
          rank,
          id: String(cardId++),
          locationType: "unused",
          playerIndex: null,
          positionInLocation: null,
        }
        cardsById[card.id] = card
      }
    }
  }

  let playerScores = new Array(playerNames.length).fill(0) // Initialize scores to 0.
  let playerStopped = new Array(playerNames.length).fill(false) // Initially, no player has stopped.

  return {
    index: 1,
    playerNames,
    cardsById,
    currentTurnPlayerIndex: 0,
    phase: "initial-card-dealing",
    playerScores,
    playerStopped,
    winners: null
  }
}

/**
 * looks through the cards for a random card in the unused state -- 
 * basically, equivalent to continuously shuffling the deck of discarded cards
 */
export function findNextCardToDraw(cardsById: Record<CardId, Card>): CardId | null {
  const unplayedCardIds = Object.keys(cardsById).filter(cardId => cardsById[cardId].locationType === "unused")
  if (unplayedCardIds.length === 0) {
    return null
  }
  return unplayedCardIds[Math.floor(Math.random() * unplayedCardIds.length)]
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

// export interface PlayCardAction {
//   action: "play-card"
//   playerIndex: number
//   cardId: CardId
// }

export type Action = DrawCardAction | StopDrawingAction

function moveToNextPlayer(state: GameState) {
  state.currentTurnPlayerIndex = (state.currentTurnPlayerIndex + 1) % state.playerNames.length
}

function moveCardToPlayer({ currentTurnPlayerIndex, cardsById }: GameState, card: Card) {
  // add to end position
  const currentCardPositions = extractPlayerCards(cardsById, currentTurnPlayerIndex).map(x => x.positionInLocation)

  // update state
  card.locationType = "player-hand"
  card.playerIndex = currentTurnPlayerIndex
  card.positionInLocation = Math.max(-1, ...currentCardPositions) + 1
}

function moveCardToLastPlayed({ currentTurnPlayerIndex, cardsById }: GameState, card: Card) {
  // change current last-card-played to unused
  Object.values(cardsById).forEach(c => {
    if (c.locationType === "last-card-played") {
      c.locationType = "unused"
    }
  })

  // update state
  card.locationType = "last-card-played"
  card.playerIndex = null
  card.positionInLocation = null
}

/**
 * Checks if the game is over, either by all players stopping their draw or reaching the target score.
 */
export function checkGameOver(state: GameState): boolean {
  console.log("check game over ", state.playerStopped.every(val => val))
  return state.playerStopped.every(val => val)
}


/**
 * updates the game state based on the given action
 * @returns an array of cards that were updated, or an empty array if the action is disallowed
 */
export function doAction(state: GameState, action: Action): Card[] {
  const changedCards: Card[] = []
  if (state.phase === "game-over") {
    // Game is already over
    return []
  }
  if (action.playerIndex !== state.currentTurnPlayerIndex) {
    // It's not this player's turn
    return []
  }

  switch (action.action) {
    case "draw-card":
      if (!state.playerStopped[action.playerIndex]) {
        const cardId = findNextCardToDraw(state.cardsById)
        if (cardId == null) {
          // No cards left to draw
          return []
        }
        const card = state.cardsById[cardId]
        moveCardToPlayer(state, card)
        state.playerScores[action.playerIndex] += RANK_VALUES[card.rank] // Update the player's score
        changedCards.push(card)

        // Check if player score exceeds 24 and mark as stopped if so
        // if (state.playerScores[action.playerIndex] > 24) {
        //   state.playerStopped[action.playerIndex] = true
        // }
      }
      break
    case "stop-drawing":
      // Player chooses to stop drawing
      state.playerStopped[action.playerIndex] = true
      console.log(action.playerIndex, " stop drawing")
      break
    default:
      // Any other action is not applicable in the updated game rules
      return []
  }

  // Check if all players have stopped.
  if (state.playerStopped.every(val => val)) {
    state.phase = "game-over"
  }

  // Move to next player if current player has stopped drawing or drawn a card
  if (state.playerStopped[action.playerIndex] || action.action === "draw-card") {
    moveToNextPlayer(state)
    while (state.playerStopped[state.currentTurnPlayerIndex] && !checkGameOver(state)) {
      // Skip over players who have stopped drawing, unless the game is over
      moveToNextPlayer(state)
    }
  }

  //++state.playCount

  return changedCards
}

export function formatCard(card: Card, includeLocation = false) {
  let paddedCardId = card.id
  while (paddedCardId.length < 3) {
    paddedCardId = " " + paddedCardId
  }
  return `[${paddedCardId}] ${card.rank}${card.suit}${(card.rank.length === 1 ? " " : "")}`
    + (includeLocation
      ? ` ${card.locationType} ${card.playerIndex ?? ""}`
      : ""
    )
}

/*
export function printState({ playerNames, cardsById, currentTurnPlayerIndex, phase, playCount }: GameState) {
  const lastPlayedCard = getLastPlayedCard(cardsById)
  console.log(`#${playCount} ${phase} ${lastPlayedCard ? formatCard(lastPlayedCard) : ""}`)
  playerNames.forEach((name, playerIndex) => {
    const cards = extractPlayerCards(cardsById, playerIndex)
    console.log(`${name}: ${cards.map(card => formatCard(card)).join(' ')} ${playerIndex === currentTurnPlayerIndex ? ' *TURN*' : ''}`)
  })
}
*/

/**
 * @returns only those cards that the given player has any "business" seeing
 */
export function filterCardsForPlayerPerspective(cards: Card[], playerIndex: number) {
  return cards.filter(card => card.playerIndex == null || card.playerIndex === playerIndex)
}

