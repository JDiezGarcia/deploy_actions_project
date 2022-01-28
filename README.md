


# Deploy Actions Proyect (GitHub Actions)

Creador: Fco. Javier Diez Garcia

Tipo: CFGS Proyect

Instituto: IES L'Estacio

Curso: Web Applications Development


# Index

- [Deploy Actions Proyect (GitHub Actions)](#deploy-actions-proyect-github-actions)
- [Index](#index)
- [Introduction](#introduction)
- [Teoria Github Actions](#teoria-github-actions)
- [Crear Credentials en Jenkins](#crear-credentials-en-jenkins)
  - [1. Settings](#1-settings)
  - [2. Manage Credentials](#2-manage-credentials)
  - [3. Global Credentials](#3-global-credentials)
  - [4. Add Credentials](#4-add-credentials)
  - [5. Save Credentials](#5-save-credentials)
- [Resultado de los Ultimos Test](#resultado-de-los-ultimos-test)
- [Steps](#steps)
  - [1. Inicio Repositorio](#1-inicio-repositorio)
  - [2. Creacion jenkinsfile y primer stage Linter](#2-creacion-jenkinsfile-y-primer-stage-linter)
  - [3. Creacion de Pipeline y union con el repositorio git](#3-creacion-de-pipeline-y-union-con-el-repositorio-git)
  - [4. Ejecucion Proyecto primera vez](#4-ejecucion-proyecto-primera-vez)
  - [5. Comprobacion Stage Lint](#5-comprobacion-stage-lint)
  - [6. Fallo Test Lint](#6-fallo-test-lint)
  - [7. Creacion Stage Cypress](#7-creacion-stage-cypress)
  - [8. Comprobacion Stage Cypress](#8-comprobacion-stage-cypress)
  - [9. Fallo Test Cypress](#9-fallo-test-cypress)
  - [10. Creacion del Stage Badge](#10-creacion-del-stage-badge)
  - [11. Creacion Script Badge](#11-creacion-script-badge)
  - [12. Comprobacion Stage Badge](#12-comprobacion-stage-badge)
  - [13. Creacion Stage Deploy](#13-creacion-stage-deploy)
  - [14. Forzamos al Job a Fallar](#14-forzamos-al-job-a-fallar)
  - [15. Creamos una cuenta en Vercel para obtener tokens](#15-creamos-una-cuenta-en-vercel-para-obtener-tokens)
  - [16. Instalamos Vercel localmente](#16-instalamos-vercel-localmente)
  - [17. Linkeamos la cuenta y el proyecto](#17-linkeamos-la-cuenta-y-el-proyecto)
  - [18. Creacion de secretos Github Actions](#18-creacion-de-secretos-github-actions)
  - [19. Creacion del Job Deploy](#19-creacion-del-job-deploy)
  - [20. Comprobacion del Job Deploy](#20-comprobacion-del-job-deploy)
  - [21. Creacion del Job Email-Result](#21-creacion-del-job-email-result)
  - [22. Creacion del Action Email-Result.yaml](#22-creacion-del-action-email-resultyaml)
  - [23. Creacion del index.js de Email-Result](#23-creacion-del-indexjs-de-email-result)
  - [22. Creacion de secretos para Email-Result](#22-creacion-de-secretos-para-email-result)
  - [23. Permiso de envio en Aplicacion poco Seguras](#23-permiso-de-envio-en-aplicacion-poco-seguras)
  - [24. Comprobacion del Job Email-Result](#24-comprobacion-del-job-email-result)
  - [25. Creacion del Job Tweet-Results (Custom Job)](#25-creacion-del-job-tweet-results-custom-job)
  - [26. Creacion del Action Tweet-Result.yaml](#26-creacion-del-action-tweet-resultyaml)
  - [27. Creacion del index.js del Action Tweet-Result](#27-creacion-del-indexjs-del-action-tweet-result)
  - [28. Creacion cuenta Developer en Twitter](#28-creacion-cuenta-developer-en-twitter)
  - [29. Creacion de los secretes para la Action Tweet-Results](#29-creacion-de-los-secretes-para-la-action-tweet-results)
  - [30. Comprobacion del Job Tweet-Results](#30-comprobacion-del-job-tweet-results)

# Introduction


Mediante las actions de Github vamos a crear 6 Jobs siendo, 1º Linter-Test para pasar un test Lint, 2º Cypress-Test para todos los test de endpoints, 3º Badge-Readme para crear una badge con el result de Cypress-Test, 4º Deploy con el deploy de la aplicacion en Vercel, 5º Email-Result con todos los resultados anteriores enviados por correo y 6º Tweet-Result que cogera todos los anteriores resultados mas el del email y los publicara en tweet.

WEB VERCEL: https://nextjs-iowgett96-jdiezgarcia.vercel.app/

# Teoria Github Actions

GitHub Actions es un plataforma de integracion y entrega continua (CI/CD) que permite automatizar el build, test y desploy de tus proyectos. Pues crear workflows que pueden ejecutar unos jobs y estos ejecutan a su vez unos steps. Los workflows, pueden ejecutarse dependiendo de diferentes eventos realizados hacia github.

Los Jobs son una agrupacion de steps que pretenden ejecutar un proceso especifico, haciendo estos steps muchas acciones (actions) distintas, por un mismo objetivo. Estos pueden ejecutarse en diferentes maquinas virtuales ofrecidas por GitHub Actions

Los Steps sirven para la ejecucion de comando o la ejecucion de actions, sean creados por nosotros o del marketplace de GitHub Actions. Podemos encontrar un variedad muy grande de actions que nos permiten desplegar, realizar cambios, realizar test ...etc en el proyecto.

Las Actions son las encargadas de realizar estas funciones dichas anteriormente o los Runers que son los que mediante las maquinas virtuales seleccionadas te permiten la ejecucion de comandos.

# Crear Credentials en Jenkins

## 1. Settings

> Para crear una credencial, desde el Dashboard vamos a Manage Jenkins
>
>![ScreenShot](img/c-1.png)

## 2. Manage Credentials

> Hacemos click en la opcion Manage Credentials
>
>![ScreenShot](img/c-2.png)

## 3. Global Credentials

> Una vez dentro, hacemos click o en Jenkins o en global, Jenkins nos dara varios dominios (en nuestro caso uno) y global nos llevara a todas las credenciales
>
>![ScreenShot](img/c-3.png)

## 4. Add Credentials

> A continuacion le daremos a crear credential
>
>![ScreenShot](img/c-4.png)
> 
> Tenemos varias opciones, por ejemplo Usuario y Password, sera un tipo utilizado para conectarse a github, despues tenemos las demas, nosotros excepto la de User y Pass, vamos a utilizar unicamente Secret Text
>
>![ScreenShot](img/c-5.png)

## 5. Save Credentials

> Ponemos el contenido de la credential y el ID de identificacion
>
>![ScreenShot](img/c-6.png)


# Resultado de los Ultimos Test

<!---Start place for the badge -->
![badge-success](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)
<!---End place for the badge -->

# Steps


## 1. Inicio Repositorio

> Creacion de una nueva branch apartir del proyecto anterior con git actions
>
>![ScreenShot](img/1.png)

```bash
# Comandos Utilizados:
git checkout -b jenkins
```

## 2. Creacion jenkinsfile y primer stage Linter
> Creamos un archivo jenkinsfile en la raiz y añadiremos el primer stage que vamos a utilizar lint, haciendo que instale dependencias y ejecute el test, guardando el resultado de este en una variable de entorno, por ultimo un stage Results para ir viendo todos conforme vamos haciendo la pipeline
> 
> ![ScreenShot](img/2.png)
```groovy
pipeline {
    agent any
    parameters {
        string(name: 'executor', description: 'What is your name?', defaultValue: 'System' )
        string(name: 'subject', description: 'Why are you executing the pipeline?', defaultValue: 'We detected a change in the repository')
        string(name: 'email', description: 'Put your email to recieve a notificiation with the results', defaultValue: 'fco.javier.diez.garcia@gmail.com')
    }
    stages {
        stage('Lint') {
            steps {
                script {
                    sh 'npm install'
                    env.lintResult = sh(script: 'npm run lint', returnStatus: true)
                }
            }
        }
        stage('Results') {
            steps {
                script {
                    sh "echo ${executor}"
                    sh "echo ${subject}"
                    sh "echo ${email}"
                    sh "echo ${env.lintResult}"
                }
            }
        }
    }
}
```

## 3. Creacion de Pipeline y union con el repositorio git
> Primero en el Dashboard de Jenkins, le damos a crear elemento nuevo, ponemos el nomnbre y elegimos de que tipo va a ser, en nuestro caso pipeline.
> 
> ![ScreenShot](img/3.png)
> 
> Una vez dentro le daremos que sea Pipile Script from SCM, en SCM git, podremos la URL del repositorio y añadiremos las credenciales para poder iniciar sesion en el repositorio git. Despues elegimos la rama en la que trabajar y en path del script. Ahora con todo esto ya podemos darle a crear.
> 
> ![ScreenShot](img/4-1.png)


## 4. Ejecucion Proyecto primera vez

> Para que el sistema de Jenkins este en marcha correctamente, con los parametros o con un sistema que controle cuando se cambia el codigo y se vuelva a ejecutar, le tendremos que dar a build la primera vez, no se le podran pasar los parametros. Despues ya te saldran los parametros como deben. En nuestro caso hemos configura 3 para que cuando envie el mensaje nos saque el nombre del ejecutor del build, si lo hace el sistema automaticamente se llamara System, despues el subject y por ultimo el email al que se le enviaran los resultados
> 
>![ScreenShot](img/4-2.png)

## 5. Comprobacion Stage Lint
> Como podemos comprobar el primero lo tuvimos que abortar y los siguientes dos nos han salido bien, vamos a comprobar sus logs.
> 
>![ScreenShot](img/5.png)
>
> Nos sale sin ningun error el test del lint
>![ScreenShot](img/6.png)
>
> Y todos los echos nos salen con sus valores dados, como el resultado de la ejecucion de lint
>![ScreenShot](img/7.png)

## 6. Fallo Test Lint
> Para que falle el codigo de lint y comprobar sus estados vamos al codigo y cambiamos dobles comillas a simples
> 
>![ScreenShot](img/8.png)
>
> Ahora podremos comprobar que nos marca el error en el log
>![ScreenShot](img/9.png)
>
> Despues de todo en el ultimo log con los resultado nos sale que lint a dado 1, entonces sale failure, despues de esta comprobacion y futuras comprobaciones de fallos, revertiremos los cambios.
>![ScreenShot](img/10.png)


## 7. Creacion Stage Cypress
> Primero antes de crear el nuevo stage vamos a crear un trigger para que compruebe si ha habido cambios en el codigo, ponemos cada minuto para ver que funciona despues lo cambiaremos.
> 
>![ScreenShot](img/11.png)
>
> Ahora creamos el stage para que primero instale dependencias que necesitara cypress para ejecutarse, luego hacemos la instalacion de este para poder utilizarlo, a continuacion hacemos build al proyecto y lo arrancamos en el background, por ultimo ejecutamos y guardamos su resultado. Como haremos con todos lo añadimos al Stage Result para asi comprobarlo.
>![ScreenShot](img/12.png)
> 
> Por ultimo hacemos un git add, commit y push subir los cambios al repositorio.
>![ScreenShot](img/13.png)
```groovy
pipeline {
    agent any
    triggers {
        pollSCM('*/1 * * * *')
    }
    parameters {
        string(name: 'executor', description: 'What is your name?', defaultValue: 'System' )
        string(name: 'subject', description: 'Why are you executing the pipeline?', defaultValue: 'We detected a change in the repository')
        string(name: 'email', description: 'Put your email to recieve a notificiation with the results', defaultValue: 'fco.javier.diez.garcia@gmail.com')
    }
    stages {
        stage('Lint') {
            steps {
                script {
                    sh 'npm install'
                    env.lintResult = sh(script: 'npm run lint', returnStatus: true)
                }
            }
        }
        stage('Cypress') {
            steps {
                script {
                    sh 'apt-get install -y lsof ibgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb'
                    sh 'npm install cypress --save-dev'
                    sh 'npm run build && npm run start &'
                    env.cypressResult = sh(script: 'cypress run --headed', returnStatus: true)
                }
            }
        }
        stage('Results') {
            steps {
                script {
                    sh "echo 'executor: ${executor}'"
                    sh "echo 'subject: ${subject}'"
                    sh "echo 'email: ${email}'"
                    sh "echo 'lint: ${env.lintResult}'"
                    sh "echo 'cypress: ${env.cypressResult}'"
                }
            }
        }
    }
}
```

## 8. Comprobacion Stage Cypress
> Para ir rapido y comprobar si el poll funciona iremos a git polling log y ahi veremos como ha encontrado los cambios una vez pasado el tiempo necesario
> 
>![ScreenShot](img/14.png)
>
> En la imagen a continuacion vemos los resultados del cypress test cuando hacemos log a su stage y como pone en la ultima linea, sale que han pasado todos los tests
>![ScreenShot](img/15-1.png)
>
> Y si entramos en results nos sale con 0 lo cual nos indica que el stage ha salido bien
>![ScreenShot](img/15-2.png)

## 9. Fallo Test Cypress
> Lo primero que vamos ha hacer, es ya que vamos a provocar un fallo, cambiar el trigger para que este en su tiempo correcto de comprobacion, cada 3 horas.
> 
>![ScreenShot](img/16.png)
> 
> Despues cambiamos el codigo añadiendo al post un 0 haciendo que el endpoint falle en los tests
> 
>![ScreenShot](img/18.png)
> 
> Por ultimo comprobamos que en el results nos sale un codigo 11 en vez de 1, asi que para saber si pasa algo de Failure solo comprobamos el que sea igual a 0 para success y todo lo demas failure
> 
>![ScreenShot](img/17.png)
```groovy
triggers {
    pollSCM('1 */3 * * *')
}
```


## 10. Creacion del Stage Badge 
> Ahora utilizando los custom actions utilizados en el proyecto anterior, los modificaremos para el nuevo entorno y les haremos build para que asi no ocupe mas de lo necesario. El stage ejecutara este script el cual devolvera un resultado de la ejecucion y cambiado la badge de nuestro Readme del proyecto. A continuacion añadiremos la config de git de user y email, mediante withCredentials, utilizaremos el tocken para hacer un remote al repositorio, despues add, commit permitioendo que este vacio y dandole [ci skip] al mensaje de este y por ultimo haciendo push al origin HEAD:jenkins (Esto ultimo descubierto por Juanjo con mi asistencia)
> 
>![ScreenShot](img/21-2.png)
> 
> Ahora creamos una nueva credencial, siendo esta la primera de este proyecto, hacemos que sea secret text y su id sera el utilizado en la pipeline.
> [COMO CREAR CREDENTIALS](#crear-credentials-en-jenkins)
> 
>![ScreenShot](img/20.png)
> 
> Al tener el trigger que comprueba los cambios del repositorio y que tenemos un commit hecho desde Jenkins pasaremos a crear un stage inicial que lo que hara sera pararlo si el ultimo commit a sido hecho por Jenkins, utilizando el mensaje del commit (Controla que este en el mensaje o no " [ci skip]"). Dependiendo del resultado Jenkins parara o no el build.
> 
>![ScreenShot](img/21-1.png)
```groovy
pipeline {
    agent any
    triggers {
        pollSCM('1 */3 * * *')
    }
    parameters {
        string(name: 'executor', description: 'What is your name?', defaultValue: 'System' )
        string(name: 'subject', description: 'Why are you executing the pipeline?', defaultValue: 'We detected a change in the repository')
        string(name: 'email', description: 'Put your email to recieve a notificiation with the results', defaultValue: 'fco.javier.diez.garcia@gmail.com')
    }
    stage ('Checkout SCM') {
        steps {
            script {
                STAGE_NAME = 'Checkout SCM'

                checkout scm
                result = sh (script: "git log -1 | grep '.*\\[ci skip\\].*'", returnStatus: true)
                if (result == 0) {
                    echo ("'ci skip' spotted in git commit. Aborting.")
                    success ("'ci skip' spotted in git commit. Aborting.")
                }
            }
        }
    }
    stages {
        stage('Lint') {
            steps {
                script {
                    sh 'npm install'
                    env.lintResult = sh(script: 'npm run lint', returnStatus: true)
                }
            }
        }
        stage('Cypress') {
            steps {
                script {
                    sh 'apt-get install -y lsof ibgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb'
                    sh 'npm install cypress --save-dev'
                    sh 'npm run build && npm run start &'
                    env.cypressResult = sh(script: 'cypress run --headed', returnStatus: true)
                }
            }
        }
        stage('Create Badge') {
            steps {
                script {
                    env.badgeResult = sh(script: "node jenkinsScripts/create_badge/dist/index.js ${env.cypressResult}", returnStatus: true)
                    sh 'git config user.email \'jdiez.actions@github.com\''
                    sh 'git config user.name \'JDiezActions\' '
                    withCredentials([string(credentialsId: 'TOKEN_GITHUB', variable: 'TOKEN')]) {
                        sh 'git remote set-url origin https://JDiezGarcia:${TOKEN}@github.com/JDiezGarcia/deploy_actions_project.git'
                    }
                    sh 'git add .'
                    sh 'git commit --allow-empty -m \'[ci skip] Readme\''
                    sh 'git push origin HEAD:jenkins'
                }
            }
        }
        stage('Results') {
            steps {
                script {
                    sh "echo 'executor: ${executor}'"
                    sh "echo 'subject: ${subject}'"
                    sh "echo 'email: ${email}'"
                    sh "echo 'lint: ${env.lintResult}'"
                    sh "echo 'cypress: ${env.cypressResult}'"
                    sh "echo 'badge: ${env.badgeResult}'"
                }
            }
        }
    }
}
```
## 11. Creacion Script Badge
> Ahora dentro de la carpeta jenkinsScripts creamos las carpetas create_badge y dentro de el añadiremos el custom action solo dejando el package.json y el index.js, para modificarlo y luego hacerle 'ncc build index.js --license licenses.txt', este proceso se repetira durante todas la modificaciones de custom actions a scripts.
> 
>![ScreenShot](img/bad-s.png)
>
> El require de fs sera para la lectura y escritura de archivos, hacemos que coja el argumento 2 que le pasamos, el readme y que compruebe la salida para asignarle una badge, cambiamos a 0 la comprombacion, con fs y replace añadirla al readme.
```js
const fs = require('fs');

async function create_badge() {

    let outcome = process.argv[2];
    let readme = 'README.md'; 
    let badge;
    if (outcome == '0') {
        badge = '![badge-success](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)'
    } else {
        badge = '![badge-failure](https://img.shields.io/badge/test-failure-red)'
    }

    fs.readFile(readme, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/(?<=\<!---Start place for the badge --\>\n)[^]+(?=\n\<!---End place for the badge --\>)/g, badge);

        fs.writeFile(readme, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });

}
create_badge();
```
## 12. Comprobacion Stage Badge
> Primero vemos que todos los test se han parado al utilizar el stage para que no continue, haciendo asi que no se realizara otro commit detras de otro.
> 
>![ScreenShot](img/22.png)
>
> Despues veriamos el Results con todos pasando su ejecucion.
>![ScreenShot](img/23.png)
>
> Podemos ver que se mantiene el badge, ya que practicamente es el mismo funcionamiento del custom action.
> 
>![ScreenShot](img/badg-2.png)


## 13. Creacion Stage Deploy
> Ahora creamos todas las credenciales necesarias, siendo estas, id_project, id_org y el token.
> 
>![ScreenShot](img/24.png)
>
> Ahora creamos todas las credenciales necesarias, siendo estas, id_project, id_org y el token.
> 
>![ScreenShot](img/27.png)
```groovy
```

## 14. Forzamos al Job a Fallar
> Para poder comprobar el cambio de badge volvemos a poner POST mal en los archivos y podemos comprobar que todos sale bien gracias al continue-on-error y que el result es failure y se cambia la badge.
> 
>![ScreenShot](img/16.png)
>![ScreenShot](img/17.png)


## 15. Creamos una cuenta en Vercel para obtener tokens
> Ahora antes de la creacion del siguiente job vamos a vercel para obtener los datos que seran utilizados en el siguiente job
> 
>![ScreenShot](img/18.png)

## 16. Instalamos Vercel localmente
> Para poder desplegar el proyecto tenemos que linkear el proyecto y la cuenta por ello vamos a installar vercel
> 
>![ScreenShot](img/19.png)
```bash
#Comandos a Utilizar
sudo npm i -g vercel;
```

## 17. Linkeamos la cuenta y el proyecto
> Una vez instalado vercel utilizamos el comando para linkear dentro de la carpeta del proyecto, le ponemos que no linke a uno existente y le pasamos los datos, nombre, path y que no cambie los settings y una vez hecho eso ya tenemos el proyecto linkeado con vercel
> 
>![ScreenShot](img/20.png)

## 18. Creacion de secretos Github Actions
> Una vez linkeado tendremos un project.json con los datos necesarios para los secrets de github, teniendo ahi el org_id y project_id, despues con el token anterior generado creamos vercel_token.
> 
>![ScreenShot](img/21.png)
>![ScreenShot](img/22.png)

## 19. Creacion del Job Deploy
> Con todo lo anterior hecho, pasamos a crear el job que se hara despues de que acabe cypress-test, cogera el codigo y mediante la action y pasandole los secrets y el directorio del proyecto se hara el deploy
> 
>![ScreenShot](img/23.png)
```yaml
deploy:
    runs-on: ubuntu-latest
    needs: cypress-test
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Deploy App on Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.TOKEN_GITHUB }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          working-directory: ./
```
## 20. Comprobacion del Job Deploy
> Ahora comprobamos si la ejecucion del job a salido como tenia que salir y se ha desplegado en vercel. En la primera captura comprobamos que todo esta bien y dentro del step podemos comprobar que tiene el link donde se ha desplegado LINK: https://nextjs-iowgett96-jdiezgarcia.vercel.app/
> 
>![ScreenShot](img/24.png)
>![ScreenShot](img/25.png)

## 21. Creacion del Job Email-Result
> Creamos el job para enviar un email con los resultados de los jobs, que necesitara que acaben todos los anteriores(o los dos ultimos ya que son al mismo tiempo y necesitan a cypress), aunque fallen o no, cogemos el codigo y mediante una action creado por nosotros le pasamos los inputs de todos los results y los secrets con el correo destinatario y el correo y contraseña origines
> 
>![ScreenShot](img/26.png)
```yaml
  email-result:
    runs-on: ubuntu-latest
    if: always()
    needs: [cypress-test, deploy, linter-test, badge-readme ]
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Email Notification
        uses: ./.github/actions/email_results/
        id: email-results
        with:
          linter: ${{ needs.linter-test.result }}
          cypress:  ${{ needs.cypress-test.result }}
          badge:  ${{ needs.badge-readme.result }}
          deploy:  ${{ needs.deploy.result }}
          send_to: ${{ secrets.DESTINATION_EMAIL }}
          origin_email: ${{ secrets.ORIGIN_EMAIL }}
          origin_pass: ${{ secrets.ORIGIN_PASS }}
```
## 22. Creacion del Action Email-Result.yaml
> Ahora antes de crear otro action nosotros mismo creamos el yaml que contendra todos los inputs nombrados anteriormente y seran requeridos
> 
>![ScreenShot](img/27.png)
```yaml
name: 'email_results'
description: 'Sends a email with the results'
inputs:
  cypress:
    description: 'Cypress Result'
    required: true
  linter:
    description: 'Linter Result'
    required: true
  deploy:
    description: 'Deploy Result'
    required: true
  badge:
    description: 'Badge Result'
    required: true
  send_to:
    description: 'Email to Receive Results'
    required: true
  origin_email:
    description: 'Email to Send Results'
    required: true
  origin_pass:
    description: 'Email password'
    required: true
runs:
  using: 'node12'
  main: 'dist/index.js'
```
## 23. Creacion del index.js de Email-Result
> Ahora creamos el proyecto node que mediante el require de core y nodemailter cogeran los inputs y creara el transporter que se encargara de enviar nuestro mensaje mediante gmail, con el user y pass, despues crearemos la estructura del mail mediante un json y enviaremos el mensaje mediante sendMail(), una vez hecho haremos el mismo proceso que antes, buildeando el proyecto.
> 
>![ScreenShot](img/28.png)
```js
const core = require('@actions/core');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: `${core.getInput('origin_email')}`,
        pass: `${core.getInput('origin_pass')}`
    }
});

var mailOptions = {
    from: `${core.getInput('origin_email')}`, 
    to: `${core.getInput('send_to')}`,
    subject: 'Resultado del workdflow ejecutado',
    html: `
    <div>
        <p>Se ha realizado un push en la rama main que ha provocado la ejecución del workflow 
        project_flow con los siguientes resultados: </p>
        <br/>
        <br/>
        <span>- linter: ${core.getInput('linter')}</span><br/>
        <span>- cypress: ${core.getInput('cypress')}</span><br/>
        <span>- badge: ${core.getInput('badge')}</span><br/>
        <span>- deploy: ${core.getInput('deploy')}</span><br/>
    </div>
    ` 
};


transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.log(error);
    } else {
        console.log('Message sent: ' + info.response);
    }
});
```

## 22. Creacion de secretos para Email-Result
> Ahora creamos los secretos necesarios para el action, siendo estos el user y pass de origen y el correo del destinatario. DESTINATION_EMAIL, ORIGIN_EMAIL y ORIGIN_PASS (Vea el siguiente paso antes)
> 
>![ScreenShot](img/29.png)

## 23. Permiso de envio en Aplicacion poco Seguras
> Ahora en el correo de envio de GMAIL tenemos que pemitir la autenticacion en 2 pasos para poder luego crear una contraseña para X aplicacion que sera la que hemos puesto en ORIGIN_PASS
> 
>![ScreenShot](img/30.png)

## 24. Comprobacion del Job Email-Result
> Una vez hecho todo lo anterior comprobamos la ejecucion del job y como vemos como ha funcionado su ejecucion, ahora comprobamos el correo y vemos como tenemos todos los resultados en el email que nos ha llegado por el action.
> 
>![ScreenShot](img/31.png)
>![ScreenShot](img/32.png)

## 25. Creacion del Job Tweet-Results (Custom Job)
> Para nuestro ultimo Job vamos a crear un job que una vez acabado todos los anteriores(Con el ultimo ya bastaria), cogera el codigo y ejecutara nuestra action, que se le pasaran todos los results incluido el del email y 4 secrets las claves y secrets de access y consumer.
> 
>![ScreenShot](img/33.png)
```yaml
  tweet-result:
    runs-on: ubuntu-latest
    if: always()
    needs: [cypress-test, deploy, linter-test, badge-readme, email-result ]
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      
      - name: Post Tweet
        uses: ./.github/actions/tweet_results/
        id: tweet-results
        with:
          linter: ${{ needs.linter-test.result }}
          cypress:  ${{ needs.cypress-test.result }}
          badge:  ${{ needs.badge-readme.result }}
          deploy:  ${{ needs.deploy.result }}
          email: ${{ needs.email-result.result }}
          access_key: ${{ secrets.ACCESS_KEY }}
          access_secret: ${{ secrets.ACCESS_SECRET }}
          consumer_key: ${{ secrets.CONSUMER_KEY }}
          consumer_secret: ${{ secrets.CONSUMER_SECRET }}
```

## 26. Creacion del Action Tweet-Result.yaml
> Una vez tenemos el job creamos el yaml añadiendo todos los inputs anteriores siendo todos tambien requeridos
> 
>![ScreenShot](img/34.png)
```yaml
name: 'tweet_results'
description: 'Will tweet all the results'
inputs:
  cypress:
    description: 'Cypress Result'
    required: true
  linter:
    description: 'Linter Result'
    required: true
  deploy:
    description: 'Deploy Result'
    required: true
  badge:
    description: 'Badge Result'
    required: true
  email:
    description: 'Email Result'
    required: true
  consumer_key:
    description: 'Consumer Key'
    required: true
  consumer_secret:
    description: 'Consumer Secret'
    required: true
  access_key:
    description: 'Access Key'
    required: true
  access_secret:
    description: 'Access Secret'
    required: true
runs:
  using: 'node12'
  main: 'dist/index.js'
```
## 27. Creacion del index.js del Action Tweet-Result
> Ahora mediante los require de core y TwitterClient, cogeremos los secrets y los meteremos en config, crearemos un nuevo twitterClient con la config. Despues tendremos dos funciones una para crear una fecha y que no detecte en caso de que todo salga igual en los results cambien el tweet para que no de error por duplicado y la que posteara el tweet. Esta ultima tendra el contenido del tweet(data) y mediante la funcion del cliente tweets.statuesUpdate(que envia una peticion POST a la api de Twitter) postearemos nuestro tweet.
> 
>![ScreenShot](img/35.png)
```js
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
```
## 28. Creacion cuenta Developer en Twitter
> Ahora creamos una cuenta de Developer en Twitter y creamos un enviroment y un proyecto, una vez dentro de nuestro proyecto cambiamos los permisos de este a todos los necesario siendo esta las tres opciones: Read, Read and Write y Read, Write and Direct Messages, una vez eso vamos a Keys y Tokens y creamos consumer keys y authentication Tokens, que seran los secrets previamente utilizados
> 
>![ScreenShot](img/36.png)

## 29. Creacion de los secretes para la Action Tweet-Results
> Ahora añadimos estas keys y secrets a nuestros secrets de github siendo estos: CONSUMER_KEY, CONSUMER_SECRET, ACCESS_KEY y ACCESS_SECRET
> 
>![ScreenShot](img/37.png)

## 30. Comprobacion del Job Tweet-Results
> Y finalmente comprobamos la ejecucion y job sale bien, entonces vamos a la cuenta de twitter y que si se ha publicado el tweet con los resultados.
> 
>![ScreenShot](img/38.png)
>![ScreenShot](img/39.png)

