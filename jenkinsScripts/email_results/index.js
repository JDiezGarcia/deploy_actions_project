const nodemailer = require('nodemailer');
const linter = formatResult(process.env.lintResult);
const cypress = formatResult(process.env.cypressResult);
const badge = formatResult(process.env.badgeResult);
const deploy = formatResult(process.env.deployResult);
const originEmail = process.argv[2];
const originPass = process.argv[3];
const destinationEmail = process.argv[4];

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: `${originEmail}}`,
        pass: `${originPass}`
    }
});

var mailOptions = {
    from: `${originEmail}`, 
    to: `${destinationEmail}`,
    subject: 'Resultado del workdflow ejecutado',
    html: `
    <div>
        <p>Se ha realizado un push en la rama main que ha provocado la ejecución del workflow 
        project_flow con los siguientes resultados: </p>
        <br/>
        <br/>
        <span>- linter: ${linter}</span><br/>
        <span>- cypress: ${cypress}</span><br/>
        <span>- badge: ${badge}</span><br/>
        <span>- deploy: ${deploy}</span><br/>
    </div>
    ` 
};

function formatResult(result){
    if(result == 0){
        return "Success";
    }else{
        return "Failure";
    }
};

transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.log(error);
        process.exit(1);
    } else {
        console.log('Message sent: ' + info.response);
        process.exit(0)
    }
});