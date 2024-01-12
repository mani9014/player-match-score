const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is Running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`Error Message: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbToResponsePlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbToResponseMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//1.GET players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id`;
  const getplayersArray = await db.all(getPlayersQuery);
  response.send(
    getplayersArray.map((eachPlayer) => convertDbToResponsePlayer(eachPlayer))
  );
});

//2.GET one player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const getPlayerArray = await db.get(getPlayerQuery);
  response.send(convertDbToResponsePlayer(getPlayerArray));
});

//3.update player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId}`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//4.GET match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details
            WHERE match_id = ${matchId}`;
  const getMatchArray = await db.get(getMatchQuery);
  response.send(convertDbToResponseMatch(getMatchArray));
});

//5.GET all matches
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details
            WHERE player_id = ${playerId}`;
  const getMatchesArray = await db.all(getMatchesQuery);
  response.send(
    getMatchesArray.map((eachMatch) => convertDbToResponseMatch(eachMatch))
  );
});

//6.get all players
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `SELECT * FROM player_match_score NATURAL JOIN player_details
        WHERE match_id = ${matchId}`;
  const getMatchesArray = await db.all(getMatchesQuery);
  response.send(
    getMatchesArray.map((eachMatch) => convertDbToResponsePlayer(eachMatch))
  );
});

//7.get player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT player_details.player_id,player_details.player_name,
  SUM(player_match_score.score),SUM(player_match_score.fours),SUM(player_match_score.sixes)
      FROM player_details INNER JOIN  player_match_score  
      ON player_details.player_id=player_match_score.player_id
      WHERE player_details.player_id = ${playerId}`;
  const getArray = await db.get(getPlayerQuery);
  //console.log(getArray);
  response.send({
    playerId: getArray.player_id,
    playerName: getArray.player_name,
    totalScore: getArray["SUM(player_match_score.score)"],
    totalFours: getArray["SUM(player_match_score.fours)"],
    totalSixes: getArray["SUM(player_match_score.sixes)"],
  });
});

module.exports = app;
