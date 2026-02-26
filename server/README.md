# Guess Who - Game Server

## Setup

1. Add your photos to `public/photos/` folder
   - The **filename** (without extension) is the answer
   - Example: `John.jpg` → answer is "john" (case-insensitive)
   
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   Server runs on `ws://localhost:3001` by default.
   Set `PORT` env variable to change.

4. Open the frontend and enter the server URL when creating/joining a room.

## How It Works

- **Host** creates a room → gets a 5-character room code
- **Players** join using the room code
- Host clicks "Start Game" when everyone is in
- Photos are revealed gradually with small circles
- Players type guesses in the shared chat
- First correct guess wins the round (scored by speed)
- Game ends after all rounds
