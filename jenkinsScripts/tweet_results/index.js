const core = require('@actions/core');
const { TwitterClient } = require('twitter-api-client');
const config = {
    apiKey: `${core.getInput('consumer_key')}`,
    apiSecret: `${core.getInput('consumer_secret')}`,
    accessToken: `${core.getInput('access_key')}`,
    accessTokenSecret: `${core.getInput('access_secret')}`
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
};
function PostTweet(){
    
    let data = 
        `RESULTS JOBS:
        [Results-Date: ${actualDate()}\n]
        linter: ${core.getInput('linter')}\n
        cypress: ${core.getInput('cypress')}\n
        badge: ${core.getInput('badge')}\n
        deploy: ${core.getInput('deploy')}\n
        email: ${core.getInput('email')}`;
    
    twitterClient.tweets.statusesUpdate({
        status: data
    }).then(
        console.log("Tweeted!")
    ).catch(err => {
        console.error(err)
    })
};

PostTweet();