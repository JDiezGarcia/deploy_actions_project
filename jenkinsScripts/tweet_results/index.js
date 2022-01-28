const { TwitterClient } = require('twitter-api-client');
const linter = formatResult(process.env.lintResult);
const cypress = formatResult(process.env.cypressResult);
const badge = formatResult(process.env.badgeResult);
const deploy = formatResult(process.env.deployResult);
const email = formatResult(process.env.emailResult);

const config = {
    apiKey: `${process.env.C_K}`,
    apiSecret: `${process.env.C_S}`,
    accessToken: `${process.env.A_K}`,
    accessTokenSecret: `${process.env.A_S}`
};

const twitterClient = new TwitterClient(config);

function actualDate(){
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    
    return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
}

function PostTweet(){
    
    let data = 
        `RESULTS JOBS JENKINS:
        [Results-Date: ${actualDate()}\n]
        linter: ${linter}\n
        cypress: ${cypress}\n
        badge: ${badge}\n
        deploy: ${deploy}\n
        email: ${email}`;
    
    twitterClient.tweets.statusesUpdate({
        status: data
    }).then( () => {
        console.log("Tweeted!"),
        process.exit(0)
    }
    ).catch(err => {
        console.error(err)
        process.exit(1);
    })
}

function formatResult(result) {
    if (result == 0) {
        return "Success";
    } else {
        return "Failure";
    }
}

PostTweet();