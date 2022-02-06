const express = require("express");
const router = express.Router();
const { ObjectId } = require("bson");
const dbh = require("../helpers/mongo_helper");
const constants = require('../helpers/constants');

// ============================================================================
// MIDDLEWARE DEFINITION
// ============================================================================

const validateInput = (req, res, next) => {
    let quotes = req.body.quotes;
    if (!quotes) {
        res.json({ error: true, message: "Quote input found empty!" })
    }
    else if (quotes.length > 200) {
        res.json({ error: true, message: "Limit a quote to 200 characters!" })
    }
    else if (!constants.alphaNumericRegex.test(quotes)) {
        res.json({ error: true, message: 'Accepts only alpha-numeric characters and symbols like ( & - _ , . )' })
    }
    else {
        req.quotes = quotes;
        next();
    }
}



// ============================================================================
// ROUTES
// ============================================================================

router.get('/', (req, res) => {
    dbh.find("quotes", { user: "guest" }).then(
        data => {
            if (data.length) {
                res.json({ error: false, quotes: data.at(-1) })
            }
            else {
                res.json({ error: true, message: "Quotes Collection is empty", quotes: [] })
            }
        }
    )


})


//ADD QUOTE API
router.post('/', validateInput, (req, res) => {
    dbh.insertOne("quotes", { user: "guest", quote: req.quotes, added_on: new Date(req.body.clientDate), update_count: 0 }).then(data => {
        if (data) {
            res.json({ error: false, message: "New Quote added successfully!" })
        }
        else {
            res.json({ error: true, message: "Error encountered while inserting new quote!" })
        }
    })

})

//UPDATE QUOTE API (POST only as a security measure)
router.post('/update', validateInput, (req, res) => {
    dbh.findOne("quotes", { _id: ObjectId(req.body.id) }).then(data => {
        if (data) {
            let update_count = data.update_count;
            dbh.updateOne("quotes",
                { _id: ObjectId(req.body.id) },
                { user: "guest", quote: req.quotes, added_on: new Date(req.body.clientDate), update_count: update_count + 1 },
                {})
                .then(data => {
                    if (data) {
                        res.json({ error: false, message: "Quote has been updated!" })
                    }
                    else {
                        res.json({ error: true, message: "Error encountered while updating quote!" })
                    }
                })
        }
        else {
            res.json({ error: true, message: "This quote is not found in database!" })
        }
    })
})


//GET ADD/UPDATE COUNT
router.get('/count', async (req, res) => {
    let updateCountPipeLine = [
        {
            '$match': {
                'user': 'guest'
            }
        }, {
            '$group': {
                '_id': 'user',
                'update_count': {
                    '$sum': '$update_count'
                }
            }
        }
    ]
    let addCountPipeLine = [
        {
            '$count': 'quote'
        }
    ]

    let update_count = await dbh.aggregate("quotes", updateCountPipeLine);
    let add_count = await dbh.aggregate("quotes", addCountPipeLine);
    res.json({ error: false, counts: { total_update_count: update_count[0].update_count, total_added_count: add_count[0].quote } })
})


// UNAVAILABLE ROUTE HANDLER
router.use(function (req, res, next) {
    res.status(404).send("Resource not found!")
})


module.exports = router