// const nodemailer = require('nodemailer');

// var transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: {
//         user: `${'env.origin_emai.'}}`,
//         pass: `${'env.origin_pass'}`
//     }
// });

// var mailOptions = {
//     from: `${'origin_email'}`, 
//     to: `${'email_send_to'}`,
//     subject: 'Resultado del workdflow ejecutado',
//     html: `
//     <div>
//         <p>Se ha realizado un push en la rama main que ha provocado la ejecución del workflow 
//         project_flow con los siguientes resultados: </p>
//         <br/>
//         <br/>
//         <span>- linter: ${core.getInput('linter')}</span><br/>
//         <span>- cypress: ${core.getInput('cypress')}</span><br/>
//         <span>- badge: ${core.getInput('badge')}</span><br/>
//         <span>- deploy: ${core.getInput('deploy')}</span><br/>
//     </div>
//     ` 
// };


// transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log('Message sent: ' + info.response);
//     }
// });
console.log(process.env.badgeResult, "aaaaaaaaaaaa");