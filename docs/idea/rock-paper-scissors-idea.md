# Fighting-Game Rock-Paper-Scissors — Project Brief

_2026-10-10 · Robin_

Source: [Claude Doc](https://claude.ai/artifact/4PRz1jUz4JEjbZixpavXHU) (copied into the project as the main idea doc)

A small single-player game to experiment with coding alongside Claude, structured so online multiplayer can be added later without a rewrite.

## Core rules

Three moves: Attack, Throw, Block. Attack beats Throw, Throw beats Block, Block beats Attack.

| Winning move    | Damage |
|-----------------|--------|
| Attack          | 15     |
| Throw           | 20     |
| Block (counter) | 10     |

Ties deal no damage. Each player has a health bar; the match ends when one side hits 0.

## Architecture

Keep three pieces cleanly separated so networked multiplayer can be added later without touching the rules:

1. A pure round-resolution function — takes both players' moves in, returns the result out, with no input or display code mixed in.
2. A game-state layer — tracks each player's health and whose turn it is, independent of how moves arrive.
3. A display/input layer — shows health bars and reads player choices (currently local keyboard input).

This separation means swapping local input for networked input later is a change to how moves arrive, not a rewrite of the rules.

## Future step: online multiplayer

Not built now. When ready, add a small server that holds game state; both players send their move choice to it each round and get the result back.
