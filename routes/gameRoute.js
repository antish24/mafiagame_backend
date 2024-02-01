const express=require('express')
const router=express.Router()
const GameController=require('../controller/gameController')

router.post('/create',GameController.createNew)
router.post('/join',GameController.joinGame)
router.get('/all',GameController.getGames)
router.post('/select',GameController.seleteGame)
router.post('/close',GameController.closeGame)
router.post('/start',GameController.startGame)
router.post('/role',GameController.PlayerCharcter)
router.post('/ready',GameController.PlayerReady)

router.post('/players',GameController.Players)
router.post('/gameplayers',GameController.GamePlayers)
router.post('/kick',GameController.kickPlayer)
router.post('/vote',GameController.VotePlayer)
router.post('/votes',GameController.Votes)

module.exports=router

