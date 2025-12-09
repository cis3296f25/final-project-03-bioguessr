# BioGuessr
A web-based game inspired by the popular web-game GeoGuessr and its many offspring (FoodGuessr, etc.). Bioguessr will involve the user being shown an image of an animal and they will have to guess the origin of the animal. For animals with multiple origins, a guess is considered correct if it matches any of its country of origins. Wrong answers will provide the user with more hints, like the animal's scientific name, and deduct total possible points until they run out of guesses. There will also be different game modes that the user can select from, such as matching the name of an animal to an image and a hard mode where no hints are given and the player must guess based off of the image alone. This project is intended for all internet users who enjoy the “Guessr” archetype of games and is a new take on the archetype.

# Play here:
https://cis3296f25.github.io/final-project-03-bioguessr/

# How to run locally
- to run the database:
```
cd bioguessr-server
docker compose up
```
- updating the db:
```
cd bioguessr-server
bun run scripts/populate_db.js
```
- to run the client:
```
cd bioguessr-client
bun run dev
```
- to run the server:
```
cd bioguessr-server
bun server.js
```
# How to contribute
Follow this project board to know the latest status of the project: [https://github.com/orgs/cis3296f25/projects/54](https://github.com/orgs/cis3296f25/projects/54)

# How to build
- install Bun from [bun.com](https://bun.com/)
- install Docker from [docker.com](https://www.docker.com/)
- make sure to run
```
bun install
```
in both `bioguessr-client` and `bioguessr-server`.
