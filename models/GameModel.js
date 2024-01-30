const mongoose=require('mongoose')

const GameSchema=mongoose.Schema({
    gameCode:{type:String,required:true,unique: true},
    roomName:{type:String,required:true},
    playerSize:{type:Number,default:0},
    playerCount:{type:Number,default:0},
    host:{type:mongoose.Schema.ObjectId,ref:"User",required:true},
    voteCount:{type:Number,default:0},
    playersId:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player',
            required:true
          },
    ],
    gameStatus:{type:String,},
    gameControl:{type:String,default:false},
    createAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
})


const Game=mongoose.model('Game',GameSchema)
module.exports=Game