const mongoose=require('mongoose')

const PlayerSchema=mongoose.Schema({
    gameCode:{type:String},
    userId:{type:mongoose.Schema.ObjectId,ref:"User",required:true},
    owner:{type:Boolean},
    role:{type:String},
    character:{type:String},
    status:{type:String},
    voteCount:{type:Number},
    createAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
})


const Player=mongoose.model('Player',PlayerSchema)
module.exports=Player