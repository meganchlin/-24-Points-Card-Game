# 24Points

## Demo video: 
[demo video](https://duke.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=3e16b8c7-9adc-4f44-9db5-b1580184a02b)

## Basic Idea and Archetype

- Multiplayer board/card game
- Our project, an interactive multiplayer card game titled "24 Points Card Game," invites players to tactically draw cards with the aim of reaching the total sum of 24. Embracing the competitive spirit of card games within a digital realm, this platform stands as part of the multiplayer board/card game category. We will construct a user-friendly and responsive interface using Vue.js complemented by Vue Router, supported by a robust Node.js backend, and utilize a MongoDB database to manage game dynamics and user interactions.
- Course example we intend to base on: lecture10-card-game

## Key Features

- Dynamic Web Interface: A responsive design built with Vue/Router ensures a consistent and engaging user experience across all devices.
- Robust Backend Processing: The Node.js infrastructure will handle intricate game mechanics and essential user management functions.
- Persistent Data Management: MongoDB will serve as the backbone for storing essential game statistics and user profiles.
- Concurrent Multiplayer Sessions: The system will support numerous authenticated users, allowing for simultaneous game sessions.
- Interactive Forms: In `Config.vue`, we have a `form` that displays `four fields`— Total Points, Number of Decks, Rank Limit, and Number of Players in a Game—allowing game administrators to configure these parameters for the game.
- Real-time Interaction Engine: Our platform will harness a Socket.IO-based central server, ensuring real-time connectivity and interaction across multiple concurrent game sessions.
- Quality Assurance: Implementation of a basic E2E test suite to validate the app's functionality and user experience.

## Extra Features

- CI/CD Pipeline: Our deployment processes will be streamlined through a CI/CD pipeline, ensuring swift, consistent updates and maintenance without compromising quality.
- Administrative Oversight: We'll institute an Admin role with RBAC features to govern game operations, resolve conflicts, and configure game settings, thereby upholding a fair and orderly gaming environment for all participants.
- Socket.IO Scale-Out: To enhance scalability, particularly in real-time multiplayer game scenarios, we configure Socket.IO with Redis for managing sessions at scale and to enable the real-time nature of the game through Socket.IO. This implementation ensures that events emitted in one application instance are received by clients connected to any other instance, a crucial requirement for maintaining synchronization among all players in a multiplayer environment.

## Game Rule

#### Objective
- Draw cards to get as close as possible to 24 points (Admin could change the total aiming points).
#### Setup
- Players: 2. (Admin could change it)
- Number of Deck: 1 (Admin could change it)
    - Each Deck: Standard 52 cards.
- Rank Limit: 13. (Admin could change it)
- Total Points: 24 (Admin could change it)
#### Values
- A=1, 2-10 as face value
- J=11
- Q=12
- K=13
#### How to Play
- Draw Cards: Take turns drawing cards. Stop anytime.
- Aim: Use addition to combine card values aiming for 24 (subject to Admin’s change of total aiming points).
- Ending the Game: The game round ends when all players decide to stop drawing cards.
- Winning
    - Closest to 24 (subject to Admin’s change of total aiming points) without going over wins. In a multiplayer setup, ties share victory or draw one more card each for a tiebreak.