export interface User {
    userID: string,
    role: "Admin" | "Player",
    numberOfGames: number,
    winGames: number,
    isReady: "NotInGame" | "Pending" | "InGame",
    winRate: number
}

export interface GameConfig {
    index: number,
    totalPoints: number,
    numberOfDeck: number,
    rankLimit: number,
    playersInGame: number
}

export interface RankingEntry {
    rank: number
    name: string
    wins: number
}