


# Deploy Actions Proyect (Jenkins)

Creador: Fco. Javier Diez Garcia

Tipo: CFGS Proyect

Instituto: IES L'Estacio

Curso: Web Applications Development


# Index

- [Deploy Actions Proyect (Jenkins)](#deploy-actions-proyect-jenkins)
- [Index](#index)
- [Introduccion](#introduccion)
- [Teoria Jenkins](#teoria-jenkins)
- [Instalacion Plugin Dashboard y su Configuracion](#instalacion-plugin-dashboard-y-su-configuracion)
  - [1. Instalacion](#1-instalacion)
  - [2. Configuracion](#2-configuracion)
  - [3. Comprobar el Dashboard](#3-comprobar-el-dashboard)
- [Crear Credentials en Jenkins](#crear-credentials-en-jenkins)
  - [1. Settings](#1-settings)
  - [2. Manage Credentials](#2-manage-credentials)
  - [3. Global Credentials](#3-global-credentials)
  - [4. Add Credentials](#4-add-credentials)
  - [5. Save Credentials](#5-save-credentials)
- [Vercel Project Link](#vercel-project-link)
  - [1. Creamos una cuenta en Vercel para obtener tokens](#1-creamos-una-cuenta-en-vercel-para-obtener-tokens)
  - [2. Instalamos Vercel localmente](#2-instalamos-vercel-localmente)
  - [3. Linkeamos la cuenta y el proyecto](#3-linkeamos-la-cuenta-y-el-proyecto)
  - [4. Obtencion IDs](#4-obtencion-ids)
- [Twitter Development](#twitter-development)
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
  - [14. Comprobacion Stage Deploy](#14-comprobacion-stage-deploy)
  - [15. Cambiar Stage Badge y Deploy a un conjunto Parallelo](#15-cambiar-stage-badge-y-deploy-a-un-conjunto-parallelo)
  - [16. Comprobacion Skip Stage Deploy](#16-comprobacion-skip-stage-deploy)
  - [17. Creacion Stage Send Email](#17-creacion-stage-send-email)
  - [18. Creacion Script Email-Result](#18-creacion-script-email-result)
  - [19. Comprobacion Stage Send Email](#19-comprobacion-stage-send-email)
  - [20. Creacion Stage Tweet Results (Custom Stage)](#20-creacion-stage-tweet-results-custom-stage)
  - [21. Creacion Script Tweet Results](#21-creacion-script-tweet-results)
  - [22. Comprobacion Stage Tweet Results](#22-comprobacion-stage-tweet-results)

# Introduccion

Mediante Jenkins vamos a crear 7 Stages siendo, 1º Para comprobar que no hacemos un bucle al hacer commits en uno de los stages, 2º Lint para pasar un test Lint, 3º Cypress para todos los test de endpoints, 4º Badge para crear una badge con el result de Cypress, 5º Deploy con el deploy de la aplicacion en Vercel, 6º Email Result con todos los resultados anteriores enviados por correo y 7º Tweet Result que cogera todos los anteriores resultados mas el del email y los publicara en tweet.

WEB VERCEL: [MI APP](https://nextjs-jdiezgarcia.vercel.app/)

# Teoria Jenkins

Jenkins ofrece una manera simple de configurar un integracion continua o un entorno de entrega continua (CI/CD) para casi todas las combinaciones de lenguajes y repositorios de codigo fuente, utilizando pipelines, ademas de atomatizar otras rutinas de tareas de desarollo.Mientras Jenkins no elimina la necesidad de scripts en steps individuales, te da una manera mas rapida y robusta de integrar tu cadena completa de build, tests y herramientas de desarollo que tu mismo puedes crear.

Jenkins se compone de proyectos, estos proyectos pueden ser de muchas maneras, nostros utilizamos pipelines, estas pipelines pueden tener muchos tipos de agentes, los cuales seran quienes manejen las stages, podemos crear en la seccion antes de las stages, enviroments, triggers y parameters entre mas cosas, despues tenemos stages, que se compone de muchas maneras, podemos poner condicionantes para entrar o no en un stage, o para ejecutar dentro de un stage diferentes steps dependiendo de las condiciones, tambien podemos hacer que los stages sean parallelos, porque de por si, son secuenciales. Tambien podemos crear scripts para expandir la funcionalidad de un stage o step.

# Instalacion Plugin Dashboard y su Configuracion

## 1. Instalacion

> Para instalarlo debemos ir a Manage Jenkins
>
>![ScreenShot](img/p-1.png)
>
> Despues le damos a Manage Plugins.
>
>![ScreenShot](img/p-2.png)
>
> Una vez dentro vamos a Avaliable buscamos el plugin de Dashboard
>
>![ScreenShot](img/p-3.png)
>
> Le damos al check y luego a instalar, eso nos mostrara todo lo que esta siendo instalado
>
>![ScreenShot](img/p-4.png)

## 2. Configuracion
> Una vez instalado desde el Dashboard vamos a New View, le damos el nombre y el tipo.
> 
>![ScreenShot](img/p-5.png)
>
> Despues nos saldra las configuraciones, primero nombre descripcion y unos filtros, por ejemplo en filtros ponemos solo este proyecto. 
>
>![ScreenShot](img/p-6.png)
>
> Despues podemos eliminar y añadir varios tipos de columnas.
>
>![ScreenShot](img/p-7.png)
>
> Despues tenemos varias configuraciones extras para el dashboard
>
>![ScreenShot](img/p-8.png)
>

## 3. Comprobar el Dashboard
> Primero vamos a Dashboard y apartir de ahi podemos cambiar entre dashboards o añadir mas.
> 
>![ScreenShot](img/p-9.png)
>
> Una vez dentro podremos comprobar como se ha queda nuestro nuevo custom dashboard.
>
>![ScreenShot](img/p-10.png)

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


# Vercel Project Link

## 1. Creamos una cuenta en Vercel para obtener tokens
> Ahora antes de la creacion del siguiente job vamos a vercel para obtener los datos que seran utilizados en el siguiente job
> 
>![ScreenShot](img/v-1.png)

## 2. Instalamos Vercel localmente
> Para poder desplegar el proyecto tenemos que linkear el proyecto y la cuenta por ello vamos a instalar vercel (Esto fue en el proyecto anterior, ahora lo hacemos en el Stage)
> 
>![ScreenShot](img/v-2.png)
```bash
#Comandos a Utilizar
sudo npm i -g vercel;
```

## 3. Linkeamos la cuenta y el proyecto
> Ahora dependiendo de dos factores haremos una cosa u otra. Primero al partir nosotros del proyecto anterior y ya tener el project.json (Tenemos los ID necesarios) asi que solo deberiamos recuperarlos. La otra manera seria hacer los pasos utilizados en el proyecto anterior, utilizamos el comando para linkear dentro de la carpeta del proyecto, le ponemos que no linke a uno existente y le pasamos los datos, nombre, path y que no cambie los settings y una vez hecho eso ya tenemos el proyecto linkeado con vercel
> 
>![ScreenShot](img/v-3.png)

## 4. Obtencion IDs
> Una vez linkeado (en caso de ser nuevo) tendremos un project.json con los datos necesarios para las credenciales, teniendo ahi el org_id y project_id, despues con el token anterior generado creamos vercel_token.
> 
>![ScreenShot](img/v-4.png)

# Twitter Development
> Creamos una cuenta de Developer en Twitter y creamos un enviroment. A continuacion un  proyecto y una vez dentro de nuestro proyecto cambiamos los permisos de este a todos los necesario siendo esta las tres opciones: Read, Read and Write y Read, Write and Direct Messages, una vez eso vamos a Keys y Tokens y creamos consumer keys y authentication Tokens, que seran los secrets previamente utilizados
> 
>![ScreenShot](img/36.png)

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
        //FIRST STAGES
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
        //STAGE RESULTS
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
> Y si entramos en results nos sale con 0 lo cual nos indica que el stage ha salido bien.
> 
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
stages {
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
    //MORE STAGES
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
    //STAGE RESULTS
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
> [VERCEL TUTORIAL](#vercel-project-link).
> 
>![ScreenShot](img/24.png)
>
> Primero hacemos que compruebe que los test hayan salido los dos a 0 y si sale true, entonces hara mediante las credenciales el vercel, el deploy, pasandole ORG_ID, PROJECT_ID, que este en production, a quien hacer focus y por ultimo el token y el path al projecto (Vercel nos dice que no hagamos nada antes de su utilizacion porque el se encarga de build del proyecto).
> 
>![ScreenShot](img/27.png)
```groovy
stage('Deploy') {
    when {
        expression {
            env.lintResult == "0" && env.cypressResult == "0"
        }
    }
    steps {
        sh 'npm install -g vercel'
        script {
            withCredentials([
            string(credentialsId: 'VERCEL_ORG', variable: 'ORG_ID'),
            string(credentialsId: 'VERCEL_TOKEN', variable: 'VERCEL'),
            string(credentialsId: 'VERCEL_PROJECT', variable: 'PROJECT_ID')
            ]) {
                env.deployResult = sh(
                    script: 'VERCEL_ORG_ID=${ORG_ID} VERCEL_PROJECT_ID=${PROJECT_ID} vercel --prod --scope jdiezgarcia --token=${VERCEL} .',
                    returnStatus: true
                )
            }
        }
    }
}
```

## 14. Comprobacion Stage Deploy
> Podemos ver como el proyecto se ha ejecutado correctamente.
> 
>![ScreenShot](img/25.png)
>
> Despues vamos al log y comprobamos que nos da un link al proyecto desplegado en Vercel.
> 
>![ScreenShot](img/26-1-A.png)
>
> Entramos y funciona correctamente.
> 
>![ScreenShot](img/28.png)
>
> En los results podemos ver como todo funciona correctamente.
> 
> ![ScreenShot](img/26-1-B.png) 

## 15. Cambiar Stage Badge y Deploy a un conjunto Parallelo
> Ahora antes de pasar al siguiente Stage vamos a modificar Badge y Deploy para que los dos sean parallelos ya que no tienen ninguna dependencia entre ellos y es una manera de mantener la esencia de refactorizar git-actions a jenkins pipeline.
> 
>![ScreenShot](img/29.png)
> 
> Como podemos comprobar ahora ya tenemos el stage conjunto de ellos dos.
>  
>![ScreenShot](img/30.png)
>
> En la siguiente captura lo podemos ver mas de cerca, como se ejecutan en parallelo haciendo, varios de steps de las dos al mismo tiempo.
>
>![ScreenShot](img/31.png)

```groovy
stage('Badge and Deploy') {
    parallel {
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
        stage('Deploy') {
            when {
                expression {
                    env.lintResult == "0" && env.cypressResult == "0"
                }
            }
            steps {
                sh 'npm install -g vercel'
                script {
                    withCredentials([
                    string(credentialsId: 'VERCEL_ORG', variable: 'ORG_ID'),
                    string(credentialsId: 'VERCEL_TOKEN', variable: 'VERCEL'),
                    string(credentialsId: 'VERCEL_PROJECT', variable: 'PROJECT_ID')
                    ]) {
                        env.deployResult = sh(
                            script: 'VERCEL_ORG_ID=${ORG_ID} VERCEL_PROJECT_ID=${PROJECT_ID} vercel --prod --scope jdiezgarcia --token=${VERCEL} .',
                            returnStatus: true
                        )
                    }
                }
            }
        }
    }
}
```

## 16. Comprobacion Skip Stage Deploy
> Antes de pasar al siguiente stage, vamos a comprobar que lo demas continuaria, pero el deploy no se haria si falla uno de los test, por ello, vamos a cambiar que una de las comprobaciones compruebe un 1 en vez de cero para que falle. (Captura hecha mas adelante)
> 
>![ScreenShot](img/skip_vercel.png)
>
> Como podemos comprobar esto nos daria un fallo en deploy pero lo demas continuaria como deberia sin causar que los siguientes Stages hagan su trabajo de notificacion (Screenshot del Email).
> 
>![ScreenShot](img/26-2.png)

## 17. Creacion Stage Send Email
> Lo primero que hacemos es crear las siguientes credenciales, que seran la contraseña de aplicaciones de Gmail y la otra el correo que envia las notificaciones.
> 
>![ScreenShot](img/32.png)
>
> Ahora en el correo de origen de GMAIL tenemos que pemitir la autenticacion en 2 pasos para poder luego crear una contraseña para X aplicacion que sera la que hemos puesto en ORIGIN_PASS y en ORIGIN_EMAIL
> 
>![ScreenShot](img/33.png)
> 
> Primero cogemos el stage de result y lo cambiamos a Send Email para luego utilizar las credenciales anteriores, pero ademas creamos variables de entorno para los parametros del principio, para asi utilizarlos dentro del script, teniendo el Email que recibira la notificacion, el nombre que ha ejecutado el build y el subject, en caso de automatico pondra los default de antes y por ultimo guardamos el resultado utilizarlo en el ultimo stage.
> 
> ![ScreenShot](img/34.png)
```groovy
stage('Send Email') {
    steps {
        script {
            withCredentials([
                string(credentialsId: 'ORIGIN_EMAIL', variable: 'EMAIL_O'),
                string(credentialsId: 'ORIGIN_PASS', variable: 'PASS_O'),
            ]) {
                env.emailDest = params.email
                env.exectUser = params.executor
                env.subjEmail = params.subject
                env.emailResult = sh(
                    script: 'ORIGIN_E=${EMAIL_O} ORIGIN_P=${PASS_O} node jenkinsScripts/email_results/dist/index.js',
                    returnStatus: true
                )
            }
        }
    }
}
```

## 18. Creacion Script Email-Result
> Ahora creamos el script en node que mediante el require nodemailter cogeran las variables de entorno creadas de los parametros y las creadas de los resultados, las cuales dependiendo de su resultado utilizaran una funcion que las formateara a Success o Failure y creara el transporter que se encargara de enviar nuestro mensaje mediante gmail, con el user y pass, despues crearemos la estructura del mail mediante un json y enviaremos el mensaje mediante sendMail(), una vez hecho haremos el mismo proceso que antes, buildeando el proyecto.
> 
>![ScreenShot](img/e-1.png)
```js
const nodemailer = require('nodemailer');
const linter = formatResult(process.env.lintResult);
const cypress = formatResult(process.env.cypressResult);
const badge = formatResult(process.env.badgeResult);
const deploy = formatResult(process.env.deployResult);
const originEmail = process.env.ORIGIN_E;
const originPass = process.env.ORIGIN_P;
const destinationEmail = process.env.emailDest;

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: `${originEmail}`,
        pass: `${originPass}`
    }
});

var mailOptions = {
    from: `${originEmail}`, 
    to: `${destinationEmail}`,
    subject: `${process.env.subjEmail}`,
    html: `
    <div>
        <p>Se ha realizado un build en Jenkins
        por el user (${process.env.exectUser}) con los siguientes resultados: </p>
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
```

## 19. Comprobacion Stage Send Email
> Comprobamos como han ido los Stages y vemos que todos se han ejecutado.
> 
>![ScreenShot](img/e-2.png)
>
> Como podemos ver el email se ha enviado con el Subject, teniendo un texto donde se identifica el user y por ultimo los estados de los Stages
> 
>![ScreenShot](img/e-3.png)


## 20. Creacion Stage Tweet Results (Custom Stage)
> Primero necesitaremos todas estas credenciales para utilizar twitter. [TWITTER TUTORIAL](#twitter-development).
> 
>![ScreenShot](img/t-1.png)
> 
> Utilizaremos la credenciales dadas anteriormente y se las pasaremos como variables de entorno al script que ejecutaremos, siendo asi nuestro ultimo stage.
> 
>![ScreenShot](img/tw-1.png)
```groovy
stage('Tweet Results') {
    steps {
        script {
            withCredentials([
                string(credentialsId: 'ACCESS_KEY', variable: 'A_K'),
                string(credentialsId: 'ACCESS_SECRET', variable: 'A_S'),
                string(credentialsId: 'CONSUMER_KEY', variable: 'C_K'),
                string(credentialsId: 'CONSUMER_SECRET', variable: 'C_S')
            ]) {
            sh 'A_KEY=${A_K} A_SECRET=${A_S} C_SECRET=${C_S} C_KEY=${C_K} node jenkinsScripts/tweet_results/dist/index.js'
            }
        }
    }
}
```

## 21. Creacion Script Tweet Results
> Ahora mediante require de TwitterClient, cogeremos los variables de las credentialas y las meteremos en config, crearemos un nuevo twitterClient con la config. Despues tendremos dos funciones una para crear una fecha y que no detecte en caso de que todo salga igual en los results cambien el tweet para que no de error por duplicado y la que posteara el tweet. Esta ultima tendra el contenido del tweet(data) y mediante la funcion del cliente tweets.statuesUpdate(que envia una peticion POST a la api de Twitter) postearemos nuestro tweet. Reutilizamos las variables de resultados, ademas utilizamos la de email y formateamos con la misma funcion del email.
> 
>![ScreenShot](img/tw-2.png)
```js
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
```

## 22. Comprobacion Stage Tweet Results
> Y finalmente comprobamos la ejecucion del stage y vemos que todo esta bien.
> 
>![ScreenShot](img/tw-3.png)
>
> Y aqui que todo se postea correctamente en Twitter.
>
>![ScreenShot](img/tw-4.png)