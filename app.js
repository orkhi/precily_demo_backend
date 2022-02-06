require('dotenv').config({ path: './config/dev/.env' });
const express = require("express")
const { RateLimiterMongo, RateLimiterMemory } = require('rate-limiter-flexible');
const cors = require('cors')
const dbh = require("./helpers/mongo_helper")
const helmet = require("helmet");
const responseTime = require('response-time')

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseTime());
app.use(helmet());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8443, http://www.localhost:8443");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("X-XSS-Protection", "1: mode=block");
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set("Content-Security-Policy", "default-src 'self' 'unsafe-inline', img-src 'self' *");
    next();
});

//RATE LIMITER MIDDLEWARE
let rateLimiter;
const limiter = async (req, res, next) => {
    rateLimiter.consume(req.ip, 2) // consume 2 points
        .then((rateLimiterRes) => {
            // 2 points consumed            
            next()
        })
        .catch((rateLimiterRes) => {
            res.json({ msg: "You were too fast!" })
        });
}

//ALLOWING ONLY NECESSARY HTTP METHODS FOR SECURITY
app.use(cors({
    origin: 'http://localhost:8443',
    methods: ['GET', 'POST', 'PUT', 'OPTIONS']
}));

// ============================================================================
// EXTERNAl ROUTES
// ============================================================================
const quotes = require("./routes/quotes");
app.use('/api/quotes', limiter, quotes);


// ============================================================================
// UNAVAILABLE ROUTE HANDLER
// ============================================================================
app.use(function (req, res, next) {
    res.status(404).send("Resource not found!")
})


// let https = require('https');
// let privateKey = fs.readFileSync(config.privateKey, 'utf8');
// let certificate = fs.readFileSync(config.certificate, 'utf8');
// let credentials = { key: privateKey, cert: certificate };

// let httpsServer = https.createServer(credentials, app);
// httpsServer.listen(config.server.port, function () {
//     console.log(config.server.host + ' is Listening on port ' + config.server.port);
// });



// INITIATING DB CONNECTION AND STARTING SERVER
dbh.dbInit().then(async (client) => {
    // Set client in app.locals so one can access from all request
    app.locals.db = client;

    // SETTING UP RATE LIMITER OPTION
    rateLimiter = new RateLimiterMongo({
        storeClient: client,
        dbName: process.env.DB_NAME,
        points: 10, // Number of points
        duration: 2, // Per second(s)
    })


    app.listen(process.env.PORT, () => {
        console.log(`Precily_Demo service is listening at ${process.env.SERVER}:${process.env.PORT}`);
    });

})


// HANDLING SERVER INTERUPT
process.on('SIGINT', function () {
    console.log("Caught interrupt signal");
    console.log("Closing DB Connection");
    dbh.dbClose().then(() => {
        console.log("Exiting ...");
        process.exit();
    })
});


