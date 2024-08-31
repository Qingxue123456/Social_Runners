const express = require('express');
const  {MongoClient} = require('mongodb'); //mongoDB数据库
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // generate a unique run id for each run


//--发起一次跑步 --里面需要包含run ID
router.post("/runs", async (req, res) => {
    const runId = uuidv4();
    const { origin, destination, pace } = req.body;
    
    // make sure organizer = username
    const result = await req.db.runs.insertOne({ origin, destination, pace, runId });
    //---注意加上runID,并且返回
    res.status(201).json({
        origin,
        destination,
        pace,
        runId
    });
    

});

//router.get() --加入别人的跑步（社交功能） --需要获取别人发起的跑步的run ID

// summit comment
router.post('/comment', async (req, res) => {
    const { runId, username, comment } = req.body;
    const timestamp = new Date();
    try {
        const result = await req.db.comments.insertOne({
            runId,
            username,
            comment,
            timestamp,
        });
        res.send({ status: 0, message: 'Comment added successfully' });
    } catch (error) {
        console.error(error);
        res.send({ status: 1, message: 'Failed to add comment' });
    }
});


router.get('/comments/:runId', async (req, res) => {
    const { runId } = req.params;
    try {
        const comments = await req.db.comments.find({ runId }).toArray();
        res.send({ status: 0, comments });
    } catch (error) {
        console.error(error);
        res.send({ status: 1, message: 'Failed to retrieve comments' });
    }
});




//共享路由
module.exports = router