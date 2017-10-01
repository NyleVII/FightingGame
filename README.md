# FightingGame

Project by:
Stephen Antymis
Shawn Sutherland

TO DO:
- Flesh out game state structure <---------- DO THIS FIRST
- Decide on initial UI game board layout
- Create database of cards (creatures have hp, moveset, energy cost, etc.)
- Deck database to load in for players
- Consider a move database
- Render current energy values (and totals) on screen
- Network protocol (valid move, invalid move, client actions, win condition, whose turn)
- Game logic
- HP numbers on active creatures
- HP numbers on cards in hand
- Create and design effect cards (3-5)
- How are we using screen real estate (bottom and sides)
- Implement creature attack
- Play test! (nerf Sitting Dude)

LATER:
- Card hover image



Game System:
- Two players (1 and 2...or 0 and 1????)
- Each player has a creature deck and an effect deck
- Must have a creature on board at all times (if you can't play one, you lose)
- First to 6 knockouts wins
- Uses an energy system
	- Players start with two energy per turn. This rechages each turn, up to the players max energy.
	- Cards can cost energy, give energy, increase max, etc.
	- Draw card - 1 energy
	- Creature attacks - X energy (depends on the attack, generally increasing with strength)
	- Playing cards - X energy (depends on card)
	- Swapping creature - X energy
	- You get the idea


- Effect cards:
	- Buffs/Debuffs
	- Remove
	- Card draw

- Turns happen in order


Experimental ideas:
- killing opponent creatures increases energy (either current or max)


Game Screen display:
- Your creature
	- Life total
	- Buffs
	- Debuffs
- Opponents creature
- Your cards
- Remaining cards in your deck
- Opponents amount of cards
- Energy totals (both players)
- What action is being performed
- Whos turn it is

Extras:
Previously played cards
Graveyard
