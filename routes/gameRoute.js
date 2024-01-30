const express=require('express')
const router=express.Router()
const GameController=require('../controller/gameController')

router.post('/create',GameController.createNew)
router.post('/join',GameController.joinGame)
router.post('/players',GameController.Players)
router.post('/gameplayers',GameController.GamePlayers)
router.post('/kick',GameController.kickPlayer)
router.post('/start',GameController.startGame)
router.post('/role',GameController.PlayerCharcter)
router.post('/ready',GameController.PlayerReady)
router.get('/all',GameController.getGames)
router.post('/select',GameController.seleteGame)

module.exports=router

