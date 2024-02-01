const Player = require ('../models/PlayerModel');
const Game = require ('../models/GameModel');
const jwt = require ('jsonwebtoken');
const config = require ('../config/index');
const User = require ('../models/UserModel');
const Chat = require ('../models/Chat');
const JWT_SECRET = config.JWT_SECRET;

function generateGameCode () {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor (Math.random () * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

exports.getGames=async(req,res)=>{
  try {
    const games=await Game.find({gameStatus:'Created'})
    res.status(200).json({games})

  } catch (error) {
    res.status(500).json({message:error.message})
  }
}

exports.seleteGame=async(req,res)=>{
  const {gameCode, token} = req.body;
  console.log(gameCode)
  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let user = jwt.verify (token, JWT_SECRET);

    const userinfo = await User.findById (user.userId);
    if (!userinfo || userinfo.token !== token)
      return res.status (401).json ({message: 'unauth'});

    const PlayerExist = await Player.findOne ({
      userId: userinfo._id,
      gameCode: gameCode,
    });

    const GameExist = await Game.findOne ({gameCode: gameCode});
    if (!GameExist||GameExist.gameStatus!=='Created') return res.status (404).json ({message: 'room not found'});

    if (!PlayerExist) {
      const newPlayer = new Player ({
        gameCode: gameCode,
        userId: userinfo._id,
        role: 'guest',
        owner: false,
      });
      await newPlayer.save ();

      await Game.findByIdAndUpdate (GameExist._id, {
        $inc: {playerCount: 1},
        $push: {playersId: newPlayer._id},
        updatedAt: Date.now (),
      });
    }
    return res
      .status (200)
      .json ({message: 'joined to Game Room', gameCode: gameCode});
  } catch (error) {
    console.log (error);
    res.status (500).json ({message: error.message});
  }
}

exports.createNew = async (req, res) => {
  const {roomName, playerSize, token} = req.body;
  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let user = jwt.verify (token, JWT_SECRET);

    const userinfo = await User.findById (user.userId);

    let gameCode = generateGameCode ();
    const newGame = new Game ({
      playerSize,
      roomName,
      gameCode,
      gameStatus: 'Created',
      host: userinfo._id,
    });
    await newGame.save ();

    const newPlayer = new Player ({
      gameCode: gameCode,
      userId: userinfo._id,
      role: 'host',
      owner: true,
    });
    await newPlayer.save ();

    await Game.findByIdAndUpdate (newGame._id, {
      $inc: {playerCount: 1},
      $push: {playersId: newPlayer._id},
      updatedAt: Date.now (),
    });

    return res
      .status (200)
      .json ({message: 'Game Room Created', gameCode: gameCode});
  } catch (error) {
    console.log (error);
    res.status (500).json ({message: error.message});
  }
};

exports.joinGame = async (req, res) => {
  const {gameCode, token} = req.body;

  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let user = jwt.verify (token, JWT_SECRET);

    const userinfo = await User.findById (user.userId);
    if (!userinfo || userinfo.token !== token)
      return res.status (401).json ({message: 'unauth'});

    const PlayerExist = await Player.findOne ({
      userId: userinfo._id,
      gameCode: gameCode,
    });

    const GameExist = await Game.findOne ({gameCode: gameCode});
    if (!GameExist||GameExist.gameStatus!=='Created') return res.status (404).json ({message: 'room not found'});

    if (!PlayerExist) {
      const newPlayer = new Player ({
        gameCode: gameCode,
        userId: userinfo._id,
        role: 'guest',
        owner: false,
      });
      await newPlayer.save ();

      await Game.findByIdAndUpdate (GameExist._id, {
        $inc: {playerCount: 1},
        $push: {playersId: newPlayer._id},
        updatedAt: Date.now (),
      });
    }
    return res
      .status (200)
      .json ({message: 'joined to Game Room', gameCode: gameCode});
  } catch (error) {
    console.log (error);
    res.status (500).json ({message: error.message});
  }
};

exports.PlayerCharcter = async (req, res) => {
  const {token, gameCode} = req.body;
  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let user = jwt.verify (token, JWT_SECRET);

    const userinfo = await User.findById (user.userId);
    if (!userinfo || userinfo.token !== token)
      return res.status (401).json ({message: 'unauth'});

    const player = await Player.findOne ({
      userId: user.userId,
      gameCode: gameCode,
    });

    if (!player) return res.status (401).json ({message: 'Kicked Out'});

    res.status (200).json ({player});
  } catch (error) {
    res.status (500).json ({error: error.message});
  }
};

exports.Players = async (req, res) => {
  const {token, gameCode} = req.body;
  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let user = jwt.verify (token, JWT_SECRET);

    const userinfo = await User.findById (user.userId);
    if (!userinfo || userinfo.token !== token)
      return res.status (401).json ({message: 'unauth'});

    const playersData = await Player.find ({
      gameCode: gameCode,
    })
      .populate ('userId', 'userName')
      .exec ();

    const player = await Player.findOne ({
      userId: user.userId,
      gameCode: gameCode,
    });

    if (!player) return res.status (401).json ({message: 'Kicked Out'});

    const game = await Game.findOne ({gameCode: gameCode});

    const players = playersData.map (p => ({
      userName: p.userId.userName,
      _id: p._id,
      role: p.role,
      kick: player.userId,
      canKick: game.host,
    }));

    const playerSize = game.playerSize;
    const playerCount = game.playerCount;
    const kick = player.userId;
    const canKick = game.host;
    const RoomName = game.roomName;
    const playerStatus = player.status === 'Player Set'||player.status === 'Ready' ? true : false;

    res.status (200).json ({
      players,
      playerSize,
      playerCount,
      kick,
      canKick,
      RoomName,
      playerStatus,
    });
  } catch (error) {
    res.status (500).json ({error: error.message});
  }
};

exports.GamePlayers = async (req, res) => {
  const {token, gameCode} = req.body;
  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let user = jwt.verify (token, JWT_SECRET);

    const userinfo = await User.findById (user.userId);
    if (!userinfo || userinfo.token !== token)
      return res.status (401).json ({message: 'unauth'});

    const playersData = await Player.find ({
      gameCode: gameCode,
    })
      .populate ('userId', 'userName')
      .exec ();

    const player = await Player.findOne ({
      userId: user.userId,
      gameCode: gameCode,
    });

    if (!player) return res.status (401).json ({message: 'Kicked Out'});

    const players = playersData.map (p => ({
      name: p.userId.userName,
      _id: p._id,
      status: p.status,
    }));

    const ready = players.every(player => player.status === 'Ready');

    res.status (200).json ({players,ready:ready});
  } catch (error) {
    res.status (500).json ({error: error.message});
  }
};

exports.PlayerReady = async (req, res) => {
  const {token, gameCode} = req.body;
  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let user = jwt.verify (token, JWT_SECRET);

    const userinfo = await User.findById (user.userId);
    if (!userinfo || userinfo.token !== token)
      return res.status (401).json ({message: 'unauth'});

      const player = await Player.findOne ({
        userId: user.userId,
        gameCode: gameCode,
      });
  
      if (!player) return res.status (401).json ({message: 'Kicked Out'});

    await Player.findByIdAndUpdate(player._id,{status:'Ready'})
    res.status (200).json ({message:'Player Ready'});
  } catch (error) {
    res.status (500).json ({error: error.message});
  }
};

function twoRandomNumber (max) {
  const randomNumber1 = Math.floor (Math.random () * max);
  let randomNumber2 = Math.floor (Math.random () * max);

  while (randomNumber2 === randomNumber1) {
    randomNumber2 = Math.floor (Math.random () * max);
  }
  return [randomNumber1, randomNumber2];
}

function oneRandomNumber (max) {
  return Math.floor (Math.random () * max);
}

async function startVote (count, playes) {
  for (let x = 0; x < count; x++) {
    await Player.findByIdAndUpdate (playes[x], {
      status: 'vote',
    });
  }
}
exports.startGame = async (req, res) => {
  const { token,gameCode } = req.body;
  try {
    if (!token) return res.status(401).json({ message: 'No token provided' });

    let playerId = jwt.verify(token, JWT_SECRET);
    const playerExist = await Player.findOne({ userId: playerId.userId,gameCode: gameCode});

    if (!playerExist) return res.status(500).json({ message: 'Player not found' });
    if (playerExist.role !== 'host') return res.status(500).json({ message: 'You are not the host' });
    
    const gameExist=await Game.findOne({gameCode:playerExist.gameCode})
    if ((gameExist.playerSize < 3 || gameExist.playerSize!==gameExist.playerCount)) return res.status(500).json({ message: 'not enoung players' });

    const game=await Game.findOneAndUpdate({gameCode:playerExist.gameCode},{gameStatus:'Ready'})


    for(let x=0;x<game.playerCount;x++){
      console.log(game.playersId[x])
      await Player.findOneAndUpdate({userId:game.playersId[x]},{status:'Player Set'})
      await Player.findByIdAndUpdate(game.playersId[x],{status:'Player Set'})
    }

    if(game.playerCount >5){
      const[firstX,secondX]=twoRandomNumber(game.playerCount)
      for(let x=0;x<game.playerCount;x++){
        console.log(game.playersId[x])
        const characterValue=x===firstX||x===secondX?"Leba":"zapa"
        await Player.findOneAndUpdate({userId:game.playersId[x]},{character:characterValue})
        await Player.findByIdAndUpdate(game.playersId[x],{character:characterValue})
      }
    }
    else{
      const firstX=oneRandomNumber(game.playerCount)
      console.log(firstX)
      for(let x=0;x<game.playerCount;x++){
        console.log(game.playersId[x])
        const characterValue=x===firstX?"Leba":"zapa"
        await Player.findOneAndUpdate({userId:game.playersId[x]},{character:characterValue})
        await Player.findByIdAndUpdate(game.playersId[x],{character:characterValue})
      }
    }

    res.status(200).json({message:'Game Started'})
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.closeGame = async (req, res) => {
  const {token,gameCode} = req.body;
  try {
    let playerId = jwt.verify(token, JWT_SECRET);
    const playerExist = await Player.findOne({ userId: playerId.userId,gameCode: gameCode});

    if (!playerExist) return res.status(500).json({ message: 'Player not found' });
    if (playerExist.role !== 'host') return res.status(500).json({ message: 'You are not the host' });
    
    const gameExist=await Game.findOne({gameCode:playerExist.gameCode})
    if (!gameExist) return res.status(500).json({ message: 'not enoung players' });

    await Player.deleteMany({gameCode:gameCode})
    await Chat.deleteMany({gameCode:gameCode})
    await Game.deleteMany({gameCode:gameCode})

    res.status (200).json ({message: 'game closed'});
  } catch (error) {
    res.status (500).json ({error: error.message});
  }
};

exports.kickPlayer = async (req, res) => {
  const {id} = req.body;
  try {
    const player = await Player.findByIdAndDelete (id);
    const chat = await Chat.deleteMany ({playerId: player.userId});
    await Game.findOneAndUpdate (
      {gameCode: player.gameCode},
      {
        $inc: {playerCount: -1},
        $pull: {playersId: player._id},
        updatedAt: Date.now (),
      }
    );
    res.status (200).json ({message: 'player kicked'});
  } catch (error) {
    res.status (500).json ({error: error.message});
  }
};

async function getPlayersWithHighestVoteCount (playerCount, playersId) {
  try {
    const highestVoteCount = await Player.find ()
      .sort ({voteCount: -1})
      .select ('voteCount')
      .limit (1)
      .lean ()
      .exec ();

    if (highestVoteCount.length > 0) {
      const highestVote = highestVoteCount[0].voteCount;
      const playersWithHighestVote = await Player.findOne ({
        voteCount: highestVote,
      });

      if (playersWithHighestVote.character === 'Leba') {
        for (let x = 0; x < playerCount; x++) {
          await Player.findByIdAndUpdate (playersId[x], {
            status: 'Winners',
          });
        }
        await Player.findByIdAndUpdate (playersWithHighestVote._id, {
          status: 'Losser',
        });
        await Game.findOneAndUpdate (
          {gameCode: playersWithHighestVote.gameCode},
          {gameStatus: 'finished'}
        );
      } else {
        for (let x = 0; x < playerCount; x++) {
          await Player.findByIdAndUpdate (playersId[x], {
            status: 'nextRound',
          });
        }
        await Player.findByIdAndUpdate (playersWithHighestVote._id, {
          openedgame: false,
          gameCode: '',
          role: '',
          character: '',
          status: '',
          voteCount: 0,
        });
      }
    } else {
      //   else if (highestVoteCount.length > 1) {
      //     for(let x=0;x<highestVoteCount.length;x++){
      //         const highestVote = highestVoteCount[x].voteCount;
      //         const playersWithHighestVote = await Player.find({ voteCount: highestVote });
      //         console.log('Players with highest vote count:', playersWithHighestVote);
      //     }
      //   }
      console.log ('No players found.');
    }
  } catch (err) {
    console.error ('Error:', err);
  }
}

exports.VotePlayer = async (req, res) => {
  const {votedPlayer, voter, token} = req.body;
  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let playerId = jwt.verify (token, JWT_SECRET);
    const PlayerExist = await Player.findById (playerId.userId);
    if (!PlayerExist)
      return res.status (500).json ({message: 'Player not found'});

    await Player.findByIdAndUpdate (votedPlayer, {$inc: {voteCount: 1}});
    await Player.findByIdAndUpdate (voter, {status: 'voted'});

    const gameCode = PlayerExist.gameCode;

    const game = await Game.findOneAndUpdate (
      {gameCode: gameCode},
      {$inc: {voteCount: 1}}
    );
    if (game.voteCount + 1 === game.playerCount) {
      getPlayersWithHighestVoteCount (game.playerCount, game.playersId);
    } else {
      console.log ('continue voting');
    }
    res.status (200).json ({message: 'player voted'});
  } catch (error) {
    res.status (500).json ({error: error.message});
  }
};

exports.nextRound = async (req, res) => {
  const {token, minute} = req.body;
  try {
    if (!token) return res.status (401).json ({message: 'not token provided'});
    let playerId = jwt.verify (token, JWT_SECRET);

    const PlayerExist = await Player.findById (playerId.userId);
    if (!PlayerExist)
      return res.status (500).json ({message: 'Player not found'});
    if (!PlayerExist.openedgame)
      return res.status (500).json ({message: "You don't have opened game"});
    const gameCode = PlayerExist.gameCode;

    const game = await Game.findOne ({gameCode: gameCode});
    if (game.playerCount > 1) {
      for (let x = 0; x < game.playerCount; x++) {
        await Player.findByIdAndUpdate (game.playersId[x], {
          status: 'playing',
        });
      }

      res.status (200).json ({message: 'game started'});

      let count = 0;
      let countdownInterval;
      count = minute > 5 ? 5 : minute < 1 ? 1 : minute - 1;
      console.log (count);
      countdownInterval = setInterval (() => {
        console.log (`Countdown: ${count} minutes remaining`);
        // Check if the count has reached 0
        if (count === 0) {
          clearInterval (countdownInterval);
          console.log ('Countdown finished');
          // Call the function when the countdown reaches 0
          startVote (game.playerCount, game.playersId);
        }

        // Decrement the count by 1
        count--;
      }, 60000);
    } else {
      res.status (404).json ({message: 'min 5 playes'});
    }
  } catch (error) {
    res.status (500).json ({error: error.message});
  }
};
