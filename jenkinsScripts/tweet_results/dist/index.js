/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 901:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

exports.OAuth = __nccwpck_require__(759).OAuth;
exports.OAuthEcho = __nccwpck_require__(759).OAuthEcho;
exports.OAuth2 = __nccwpck_require__(423).OAuth2;

/***/ }),

/***/ 295:
/***/ ((module) => {

// Returns true if this is a host that closes *before* it ends?!?!
module.exports.isAnEarlyCloseHost= function( hostName ) {
  return hostName && hostName.match(".*google(apis)?.com$")
}

/***/ }),

/***/ 759:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

var crypto= __nccwpck_require__(113),
    sha1= __nccwpck_require__(509),
    http= __nccwpck_require__(685),
    https= __nccwpck_require__(687),
    URL= __nccwpck_require__(310),
    querystring= __nccwpck_require__(477),
    OAuthUtils= __nccwpck_require__(295);

exports.OAuth= function(requestUrl, accessUrl, consumerKey, consumerSecret, version, authorize_callback, signatureMethod, nonceSize, customHeaders) {
  this._isEcho = false;

  this._requestUrl= requestUrl;
  this._accessUrl= accessUrl;
  this._consumerKey= consumerKey;
  this._consumerSecret= this._encodeData( consumerSecret );
  if (signatureMethod == "RSA-SHA1") {
    this._privateKey = consumerSecret;
  }
  this._version= version;
  if( authorize_callback === undefined ) {
    this._authorize_callback= "oob";
  }
  else {
    this._authorize_callback= authorize_callback;
  }

  if( signatureMethod != "PLAINTEXT" && signatureMethod != "HMAC-SHA1" && signatureMethod != "RSA-SHA1")
    throw new Error("Un-supported signature method: " + signatureMethod )
  this._signatureMethod= signatureMethod;
  this._nonceSize= nonceSize || 32;
  this._headers= customHeaders || {"Accept" : "*/*",
                                   "Connection" : "close",
                                   "User-Agent" : "Node authentication"}
  this._clientOptions= this._defaultClientOptions= {"requestTokenHttpMethod": "POST",
                                                    "accessTokenHttpMethod": "POST",
                                                    "followRedirects": true};
  this._oauthParameterSeperator = ",";
};

exports.OAuthEcho= function(realm, verify_credentials, consumerKey, consumerSecret, version, signatureMethod, nonceSize, customHeaders) {
  this._isEcho = true;

  this._realm= realm;
  this._verifyCredentials = verify_credentials;
  this._consumerKey= consumerKey;
  this._consumerSecret= this._encodeData( consumerSecret );
  if (signatureMethod == "RSA-SHA1") {
    this._privateKey = consumerSecret;
  }
  this._version= version;

  if( signatureMethod != "PLAINTEXT" && signatureMethod != "HMAC-SHA1" && signatureMethod != "RSA-SHA1")
    throw new Error("Un-supported signature method: " + signatureMethod );
  this._signatureMethod= signatureMethod;
  this._nonceSize= nonceSize || 32;
  this._headers= customHeaders || {"Accept" : "*/*",
                                   "Connection" : "close",
                                   "User-Agent" : "Node authentication"};
  this._oauthParameterSeperator = ",";
}

exports.OAuthEcho.prototype = exports.OAuth.prototype;

exports.OAuth.prototype._getTimestamp= function() {
  return Math.floor( (new Date()).getTime() / 1000 );
}

exports.OAuth.prototype._encodeData= function(toEncode){
 if( toEncode == null || toEncode == "" ) return ""
 else {
    var result= encodeURIComponent(toEncode);
    // Fix the mismatch between OAuth's  RFC3986's and Javascript's beliefs in what is right and wrong ;)
    return result.replace(/\!/g, "%21")
                 .replace(/\'/g, "%27")
                 .replace(/\(/g, "%28")
                 .replace(/\)/g, "%29")
                 .replace(/\*/g, "%2A");
 }
}

exports.OAuth.prototype._decodeData= function(toDecode) {
  if( toDecode != null ) {
    toDecode = toDecode.replace(/\+/g, " ");
  }
  return decodeURIComponent( toDecode);
}

exports.OAuth.prototype._getSignature= function(method, url, parameters, tokenSecret) {
  var signatureBase= this._createSignatureBase(method, url, parameters);
  return this._createSignature( signatureBase, tokenSecret );
}

exports.OAuth.prototype._normalizeUrl= function(url) {
  var parsedUrl= URL.parse(url, true)
   var port ="";
   if( parsedUrl.port ) {
     if( (parsedUrl.protocol == "http:" && parsedUrl.port != "80" ) ||
         (parsedUrl.protocol == "https:" && parsedUrl.port != "443") ) {
           port= ":" + parsedUrl.port;
         }
   }

  if( !parsedUrl.pathname  || parsedUrl.pathname == "" ) parsedUrl.pathname ="/";

  return parsedUrl.protocol + "//" + parsedUrl.hostname + port + parsedUrl.pathname;
}

// Is the parameter considered an OAuth parameter
exports.OAuth.prototype._isParameterNameAnOAuthParameter= function(parameter) {
  var m = parameter.match('^oauth_');
  if( m && ( m[0] === "oauth_" ) ) {
    return true;
  }
  else {
    return false;
  }
};

// build the OAuth request authorization header
exports.OAuth.prototype._buildAuthorizationHeaders= function(orderedParameters) {
  var authHeader="OAuth ";
  if( this._isEcho ) {
    authHeader += 'realm="' + this._realm + '",';
  }

  for( var i= 0 ; i < orderedParameters.length; i++) {
     // Whilst the all the parameters should be included within the signature, only the oauth_ arguments
     // should appear within the authorization header.
     if( this._isParameterNameAnOAuthParameter(orderedParameters[i][0]) ) {
      authHeader+= "" + this._encodeData(orderedParameters[i][0])+"=\""+ this._encodeData(orderedParameters[i][1])+"\""+ this._oauthParameterSeperator;
     }
  }

  authHeader= authHeader.substring(0, authHeader.length-this._oauthParameterSeperator.length);
  return authHeader;
}

// Takes an object literal that represents the arguments, and returns an array
// of argument/value pairs.
exports.OAuth.prototype._makeArrayOfArgumentsHash= function(argumentsHash) {
  var argument_pairs= [];
  for(var key in argumentsHash ) {
    if (argumentsHash.hasOwnProperty(key)) {
       var value= argumentsHash[key];
       if( Array.isArray(value) ) {
         for(var i=0;i<value.length;i++) {
           argument_pairs[argument_pairs.length]= [key, value[i]];
         }
       }
       else {
         argument_pairs[argument_pairs.length]= [key, value];
       }
    }
  }
  return argument_pairs;
}

// Sorts the encoded key value pairs by encoded name, then encoded value
exports.OAuth.prototype._sortRequestParams= function(argument_pairs) {
  // Sort by name, then value.
  argument_pairs.sort(function(a,b) {
      if ( a[0]== b[0] )  {
        return a[1] < b[1] ? -1 : 1;
      }
      else return a[0] < b[0] ? -1 : 1;
  });

  return argument_pairs;
}

exports.OAuth.prototype._normaliseRequestParams= function(args) {
  var argument_pairs= this._makeArrayOfArgumentsHash(args);
  // First encode them #3.4.1.3.2 .1
  for(var i=0;i<argument_pairs.length;i++) {
    argument_pairs[i][0]= this._encodeData( argument_pairs[i][0] );
    argument_pairs[i][1]= this._encodeData( argument_pairs[i][1] );
  }

  // Then sort them #3.4.1.3.2 .2
  argument_pairs= this._sortRequestParams( argument_pairs );

  // Then concatenate together #3.4.1.3.2 .3 & .4
  var args= "";
  for(var i=0;i<argument_pairs.length;i++) {
      args+= argument_pairs[i][0];
      args+= "="
      args+= argument_pairs[i][1];
      if( i < argument_pairs.length-1 ) args+= "&";
  }
  return args;
}

exports.OAuth.prototype._createSignatureBase= function(method, url, parameters) {
  url= this._encodeData( this._normalizeUrl(url) );
  parameters= this._encodeData( parameters );
  return method.toUpperCase() + "&" + url + "&" + parameters;
}

exports.OAuth.prototype._createSignature= function(signatureBase, tokenSecret) {
   if( tokenSecret === undefined ) var tokenSecret= "";
   else tokenSecret= this._encodeData( tokenSecret );
   // consumerSecret is already encoded
   var key= this._consumerSecret + "&" + tokenSecret;

   var hash= ""
   if( this._signatureMethod == "PLAINTEXT" ) {
     hash= key;
   }
   else if (this._signatureMethod == "RSA-SHA1") {
     key = this._privateKey || "";
     hash= crypto.createSign("RSA-SHA1").update(signatureBase).sign(key, 'base64');
   }
   else {
       if( crypto.Hmac ) {
         hash = crypto.createHmac("sha1", key).update(signatureBase).digest("base64");
       }
       else {
         hash= sha1.HMACSHA1(key, signatureBase);
       }
   }
   return hash;
}
exports.OAuth.prototype.NONCE_CHARS= ['a','b','c','d','e','f','g','h','i','j','k','l','m','n',
              'o','p','q','r','s','t','u','v','w','x','y','z','A','B',
              'C','D','E','F','G','H','I','J','K','L','M','N','O','P',
              'Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3',
              '4','5','6','7','8','9'];

exports.OAuth.prototype._getNonce= function(nonceSize) {
   var result = [];
   var chars= this.NONCE_CHARS;
   var char_pos;
   var nonce_chars_length= chars.length;

   for (var i = 0; i < nonceSize; i++) {
       char_pos= Math.floor(Math.random() * nonce_chars_length);
       result[i]=  chars[char_pos];
   }
   return result.join('');
}

exports.OAuth.prototype._createClient= function( port, hostname, method, path, headers, sslEnabled ) {
  var options = {
    host: hostname,
    port: port,
    path: path,
    method: method,
    headers: headers
  };
  var httpModel;
  if( sslEnabled ) {
    httpModel= https;
  } else {
    httpModel= http;
  }
  return httpModel.request(options);
}

exports.OAuth.prototype._prepareParameters= function( oauth_token, oauth_token_secret, method, url, extra_params ) {
  var oauthParameters= {
      "oauth_timestamp":        this._getTimestamp(),
      "oauth_nonce":            this._getNonce(this._nonceSize),
      "oauth_version":          this._version,
      "oauth_signature_method": this._signatureMethod,
      "oauth_consumer_key":     this._consumerKey
  };

  if( oauth_token ) {
    oauthParameters["oauth_token"]= oauth_token;
  }

  var sig;
  if( this._isEcho ) {
    sig = this._getSignature( "GET",  this._verifyCredentials,  this._normaliseRequestParams(oauthParameters), oauth_token_secret);
  }
  else {
    if( extra_params ) {
      for( var key in extra_params ) {
        if (extra_params.hasOwnProperty(key)) oauthParameters[key]= extra_params[key];
      }
    }
    var parsedUrl= URL.parse( url, false );

    if( parsedUrl.query ) {
      var key2;
      var extraParameters= querystring.parse(parsedUrl.query);
      for(var key in extraParameters ) {
        var value= extraParameters[key];
          if( typeof value == "object" ){
            // TODO: This probably should be recursive
            for(key2 in value){
              oauthParameters[key + "[" + key2 + "]"] = value[key2];
            }
          } else {
            oauthParameters[key]= value;
          }
        }
    }

    sig = this._getSignature( method,  url,  this._normaliseRequestParams(oauthParameters), oauth_token_secret);
  }

  var orderedParameters= this._sortRequestParams( this._makeArrayOfArgumentsHash(oauthParameters) );
  orderedParameters[orderedParameters.length]= ["oauth_signature", sig];
  return orderedParameters;
}

exports.OAuth.prototype._performSecureRequest= function( oauth_token, oauth_token_secret, method, url, extra_params, post_body, post_content_type,  callback ) {
  var orderedParameters= this._prepareParameters(oauth_token, oauth_token_secret, method, url, extra_params);

  if( !post_content_type ) {
    post_content_type= "application/x-www-form-urlencoded";
  }
  var parsedUrl= URL.parse( url, false );
  if( parsedUrl.protocol == "http:" && !parsedUrl.port ) parsedUrl.port= 80;
  if( parsedUrl.protocol == "https:" && !parsedUrl.port ) parsedUrl.port= 443;

  var headers= {};
  var authorization = this._buildAuthorizationHeaders(orderedParameters);
  if ( this._isEcho ) {
    headers["X-Verify-Credentials-Authorization"]= authorization;
  }
  else {
    headers["Authorization"]= authorization;
  }

  headers["Host"] = parsedUrl.host

  for( var key in this._headers ) {
    if (this._headers.hasOwnProperty(key)) {
      headers[key]= this._headers[key];
    }
  }

  // Filter out any passed extra_params that are really to do with OAuth
  for(var key in extra_params) {
    if( this._isParameterNameAnOAuthParameter( key ) ) {
      delete extra_params[key];
    }
  }

  if( (method == "POST" || method == "PUT")  && ( post_body == null && extra_params != null) ) {
    // Fix the mismatch between the output of querystring.stringify() and this._encodeData()
    post_body= querystring.stringify(extra_params)
                       .replace(/\!/g, "%21")
                       .replace(/\'/g, "%27")
                       .replace(/\(/g, "%28")
                       .replace(/\)/g, "%29")
                       .replace(/\*/g, "%2A");
  }

  if( post_body ) {
      if ( Buffer.isBuffer(post_body) ) {
          headers["Content-length"]= post_body.length;
      } else {
          headers["Content-length"]= Buffer.byteLength(post_body);
      }
  } else {
      headers["Content-length"]= 0;
  }

  headers["Content-Type"]= post_content_type;

  var path;
  if( !parsedUrl.pathname  || parsedUrl.pathname == "" ) parsedUrl.pathname ="/";
  if( parsedUrl.query ) path= parsedUrl.pathname + "?"+ parsedUrl.query ;
  else path= parsedUrl.pathname;

  var request;
  if( parsedUrl.protocol == "https:" ) {
    request= this._createClient(parsedUrl.port, parsedUrl.hostname, method, path, headers, true);
  }
  else {
    request= this._createClient(parsedUrl.port, parsedUrl.hostname, method, path, headers);
  }

  var clientOptions = this._clientOptions;
  if( callback ) {
    var data="";
    var self= this;

    // Some hosts *cough* google appear to close the connection early / send no content-length header
    // allow this behaviour.
    var allowEarlyClose= OAuthUtils.isAnEarlyCloseHost( parsedUrl.hostname );
    var callbackCalled= false;
    var passBackControl = function( response ) {
      if(!callbackCalled) {
        callbackCalled= true;
        if ( response.statusCode >= 200 && response.statusCode <= 299 ) {
          callback(null, data, response);
        } else {
          // Follow 301 or 302 redirects with Location HTTP header
          if((response.statusCode == 301 || response.statusCode == 302) && clientOptions.followRedirects && response.headers && response.headers.location) {
            self._performSecureRequest( oauth_token, oauth_token_secret, method, response.headers.location, extra_params, post_body, post_content_type,  callback);
          }
          else {
            callback({ statusCode: response.statusCode, data: data }, data, response);
          }
        }
      }
    }

    request.on('response', function (response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        data+=chunk;
      });
      response.on('end', function () {
        passBackControl( response );
      });
      response.on('close', function () {
        if( allowEarlyClose ) {
          passBackControl( response );
        }
      });
    });

    request.on("error", function(err) {
      if(!callbackCalled) {
        callbackCalled= true;
        callback( err )
      }
    });

    if( (method == "POST" || method =="PUT") && post_body != null && post_body != "" ) {
      request.write(post_body);
    }
    request.end();
  }
  else {
    if( (method == "POST" || method =="PUT") && post_body != null && post_body != "" ) {
      request.write(post_body);
    }
    return request;
  }

  return;
}

exports.OAuth.prototype.setClientOptions= function(options) {
  var key,
      mergedOptions= {},
      hasOwnProperty= Object.prototype.hasOwnProperty;

  for( key in this._defaultClientOptions ) {
    if( !hasOwnProperty.call(options, key) ) {
      mergedOptions[key]= this._defaultClientOptions[key];
    } else {
      mergedOptions[key]= options[key];
    }
  }

  this._clientOptions= mergedOptions;
};

exports.OAuth.prototype.getOAuthAccessToken= function(oauth_token, oauth_token_secret, oauth_verifier,  callback) {
  var extraParams= {};
  if( typeof oauth_verifier == "function" ) {
    callback= oauth_verifier;
  } else {
    extraParams.oauth_verifier= oauth_verifier;
  }

   this._performSecureRequest( oauth_token, oauth_token_secret, this._clientOptions.accessTokenHttpMethod, this._accessUrl, extraParams, null, null, function(error, data, response) {
         if( error ) callback(error);
         else {
           var results= querystring.parse( data );
           var oauth_access_token= results["oauth_token"];
           delete results["oauth_token"];
           var oauth_access_token_secret= results["oauth_token_secret"];
           delete results["oauth_token_secret"];
           callback(null, oauth_access_token, oauth_access_token_secret, results );
         }
   })
}

// Deprecated
exports.OAuth.prototype.getProtectedResource= function(url, method, oauth_token, oauth_token_secret, callback) {
  this._performSecureRequest( oauth_token, oauth_token_secret, method, url, null, "", null, callback );
}

exports.OAuth.prototype["delete"]= function(url, oauth_token, oauth_token_secret, callback) {
  return this._performSecureRequest( oauth_token, oauth_token_secret, "DELETE", url, null, "", null, callback );
}

exports.OAuth.prototype.get= function(url, oauth_token, oauth_token_secret, callback) {
  return this._performSecureRequest( oauth_token, oauth_token_secret, "GET", url, null, "", null, callback );
}

exports.OAuth.prototype._putOrPost= function(method, url, oauth_token, oauth_token_secret, post_body, post_content_type, callback) {
  var extra_params= null;
  if( typeof post_content_type == "function" ) {
    callback= post_content_type;
    post_content_type= null;
  }
  if ( typeof post_body != "string" && !Buffer.isBuffer(post_body) ) {
    post_content_type= "application/x-www-form-urlencoded"
    extra_params= post_body;
    post_body= null;
  }
  return this._performSecureRequest( oauth_token, oauth_token_secret, method, url, extra_params, post_body, post_content_type, callback );
}


exports.OAuth.prototype.put= function(url, oauth_token, oauth_token_secret, post_body, post_content_type, callback) {
  return this._putOrPost("PUT", url, oauth_token, oauth_token_secret, post_body, post_content_type, callback);
}

exports.OAuth.prototype.post= function(url, oauth_token, oauth_token_secret, post_body, post_content_type, callback) {
  return this._putOrPost("POST", url, oauth_token, oauth_token_secret, post_body, post_content_type, callback);
}

/**
 * Gets a request token from the OAuth provider and passes that information back
 * to the calling code.
 *
 * The callback should expect a function of the following form:
 *
 * function(err, token, token_secret, parsedQueryString) {}
 *
 * This method has optional parameters so can be called in the following 2 ways:
 *
 * 1) Primary use case: Does a basic request with no extra parameters
 *  getOAuthRequestToken( callbackFunction )
 *
 * 2) As above but allows for provision of extra parameters to be sent as part of the query to the server.
 *  getOAuthRequestToken( extraParams, callbackFunction )
 *
 * N.B. This method will HTTP POST verbs by default, if you wish to override this behaviour you will
 * need to provide a requestTokenHttpMethod option when creating the client.
 *
 **/
exports.OAuth.prototype.getOAuthRequestToken= function( extraParams, callback ) {
   if( typeof extraParams == "function" ){
     callback = extraParams;
     extraParams = {};
   }
  // Callbacks are 1.0A related
  if( this._authorize_callback ) {
    extraParams["oauth_callback"]= this._authorize_callback;
  }
  this._performSecureRequest( null, null, this._clientOptions.requestTokenHttpMethod, this._requestUrl, extraParams, null, null, function(error, data, response) {
    if( error ) callback(error);
    else {
      var results= querystring.parse(data);

      var oauth_token= results["oauth_token"];
      var oauth_token_secret= results["oauth_token_secret"];
      delete results["oauth_token"];
      delete results["oauth_token_secret"];
      callback(null, oauth_token, oauth_token_secret,  results );
    }
  });
}

exports.OAuth.prototype.signUrl= function(url, oauth_token, oauth_token_secret, method) {

  if( method === undefined ) {
    var method= "GET";
  }

  var orderedParameters= this._prepareParameters(oauth_token, oauth_token_secret, method, url, {});
  var parsedUrl= URL.parse( url, false );

  var query="";
  for( var i= 0 ; i < orderedParameters.length; i++) {
    query+= orderedParameters[i][0]+"="+ this._encodeData(orderedParameters[i][1]) + "&";
  }
  query= query.substring(0, query.length-1);

  return parsedUrl.protocol + "//"+ parsedUrl.host + parsedUrl.pathname + "?" + query;
};

exports.OAuth.prototype.authHeader= function(url, oauth_token, oauth_token_secret, method) {
  if( method === undefined ) {
    var method= "GET";
  }

  var orderedParameters= this._prepareParameters(oauth_token, oauth_token_secret, method, url, {});
  return this._buildAuthorizationHeaders(orderedParameters);
};


/***/ }),

/***/ 423:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

var querystring= __nccwpck_require__(477),
    crypto= __nccwpck_require__(113),
    https= __nccwpck_require__(687),
    http= __nccwpck_require__(685),
    URL= __nccwpck_require__(310),
    OAuthUtils= __nccwpck_require__(295);

exports.OAuth2= function(clientId, clientSecret, baseSite, authorizePath, accessTokenPath, customHeaders) {
  this._clientId= clientId;
  this._clientSecret= clientSecret;
  this._baseSite= baseSite;
  this._authorizeUrl= authorizePath || "/oauth/authorize";
  this._accessTokenUrl= accessTokenPath || "/oauth/access_token";
  this._accessTokenName= "access_token";
  this._authMethod= "Bearer";
  this._customHeaders = customHeaders || {};
  this._useAuthorizationHeaderForGET= false;

  //our agent
  this._agent = undefined;
};

// Allows you to set an agent to use instead of the default HTTP or
// HTTPS agents. Useful when dealing with your own certificates.
exports.OAuth2.prototype.setAgent = function(agent) {
  this._agent = agent;
};

// This 'hack' method is required for sites that don't use
// 'access_token' as the name of the access token (for requests).
// ( http://tools.ietf.org/html/draft-ietf-oauth-v2-16#section-7 )
// it isn't clear what the correct value should be atm, so allowing
// for specific (temporary?) override for now.
exports.OAuth2.prototype.setAccessTokenName= function ( name ) {
  this._accessTokenName= name;
}

// Sets the authorization method for Authorization header.
// e.g. Authorization: Bearer <token>  # "Bearer" is the authorization method.
exports.OAuth2.prototype.setAuthMethod = function ( authMethod ) {
  this._authMethod = authMethod;
};


// If you use the OAuth2 exposed 'get' method (and don't construct your own _request call )
// this will specify whether to use an 'Authorize' header instead of passing the access_token as a query parameter
exports.OAuth2.prototype.useAuthorizationHeaderforGET = function(useIt) {
  this._useAuthorizationHeaderForGET= useIt;
}

exports.OAuth2.prototype._getAccessTokenUrl= function() {
  return this._baseSite + this._accessTokenUrl; /* + "?" + querystring.stringify(params); */
}

// Build the authorization header. In particular, build the part after the colon.
// e.g. Authorization: Bearer <token>  # Build "Bearer <token>"
exports.OAuth2.prototype.buildAuthHeader= function(token) {
  return this._authMethod + ' ' + token;
};

exports.OAuth2.prototype._chooseHttpLibrary= function( parsedUrl ) {
  var http_library= https;
  // As this is OAUth2, we *assume* https unless told explicitly otherwise.
  if( parsedUrl.protocol != "https:" ) {
    http_library= http;
  }
  return http_library;
};

exports.OAuth2.prototype._request= function(method, url, headers, post_body, access_token, callback) {

  var parsedUrl= URL.parse( url, true );
  if( parsedUrl.protocol == "https:" && !parsedUrl.port ) {
    parsedUrl.port= 443;
  }

  var http_library= this._chooseHttpLibrary( parsedUrl );


  var realHeaders= {};
  for( var key in this._customHeaders ) {
    realHeaders[key]= this._customHeaders[key];
  }
  if( headers ) {
    for(var key in headers) {
      realHeaders[key] = headers[key];
    }
  }
  realHeaders['Host']= parsedUrl.host;

  if (!realHeaders['User-Agent']) {
    realHeaders['User-Agent'] = 'Node-oauth';
  }

  if( post_body ) {
      if ( Buffer.isBuffer(post_body) ) {
          realHeaders["Content-Length"]= post_body.length;
      } else {
          realHeaders["Content-Length"]= Buffer.byteLength(post_body);
      }
  } else {
      realHeaders["Content-length"]= 0;
  }

  if( access_token && !('Authorization' in realHeaders)) {
    if( ! parsedUrl.query ) parsedUrl.query= {};
    parsedUrl.query[this._accessTokenName]= access_token;
  }

  var queryStr= querystring.stringify(parsedUrl.query);
  if( queryStr ) queryStr=  "?" + queryStr;
  var options = {
    host:parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + queryStr,
    method: method,
    headers: realHeaders
  };

  this._executeRequest( http_library, options, post_body, callback );
}

exports.OAuth2.prototype._executeRequest= function( http_library, options, post_body, callback ) {
  // Some hosts *cough* google appear to close the connection early / send no content-length header
  // allow this behaviour.
  var allowEarlyClose= OAuthUtils.isAnEarlyCloseHost(options.host);
  var callbackCalled= false;
  function passBackControl( response, result ) {
    if(!callbackCalled) {
      callbackCalled=true;
      if( !(response.statusCode >= 200 && response.statusCode <= 299) && (response.statusCode != 301) && (response.statusCode != 302) ) {
        callback({ statusCode: response.statusCode, data: result });
      } else {
        callback(null, result, response);
      }
    }
  }

  var result= "";

  //set the agent on the request options
  if (this._agent) {
    options.agent = this._agent;
  }

  var request = http_library.request(options);
  request.on('response', function (response) {
    response.on("data", function (chunk) {
      result+= chunk
    });
    response.on("close", function (err) {
      if( allowEarlyClose ) {
        passBackControl( response, result );
      }
    });
    response.addListener("end", function () {
      passBackControl( response, result );
    });
  });
  request.on('error', function(e) {
    callbackCalled= true;
    callback(e);
  });

  if( (options.method == 'POST' || options.method == 'PUT') && post_body ) {
     request.write(post_body);
  }
  request.end();
}

exports.OAuth2.prototype.getAuthorizeUrl= function( params ) {
  var params= params || {};
  params['client_id'] = this._clientId;
  return this._baseSite + this._authorizeUrl + "?" + querystring.stringify(params);
}

exports.OAuth2.prototype.getOAuthAccessToken= function(code, params, callback) {
  var params= params || {};
  params['client_id'] = this._clientId;
  params['client_secret'] = this._clientSecret;
  var codeParam = (params.grant_type === 'refresh_token') ? 'refresh_token' : 'code';
  params[codeParam]= code;

  var post_data= querystring.stringify( params );
  var post_headers= {
       'Content-Type': 'application/x-www-form-urlencoded'
   };


  this._request("POST", this._getAccessTokenUrl(), post_headers, post_data, null, function(error, data, response) {
    if( error )  callback(error);
    else {
      var results;
      try {
        // As of http://tools.ietf.org/html/draft-ietf-oauth-v2-07
        // responses should be in JSON
        results= JSON.parse( data );
      }
      catch(e) {
        // .... However both Facebook + Github currently use rev05 of the spec
        // and neither seem to specify a content-type correctly in their response headers :(
        // clients of these services will suffer a *minor* performance cost of the exception
        // being thrown
        results= querystring.parse( data );
      }
      var access_token= results["access_token"];
      var refresh_token= results["refresh_token"];
      delete results["refresh_token"];
      callback(null, access_token, refresh_token, results); // callback results =-=
    }
  });
}

// Deprecated
exports.OAuth2.prototype.getProtectedResource= function(url, access_token, callback) {
  this._request("GET", url, {}, "", access_token, callback );
}

exports.OAuth2.prototype.get= function(url, access_token, callback) {
  if( this._useAuthorizationHeaderForGET ) {
    var headers= {'Authorization': this.buildAuthHeader(access_token) }
    access_token= null;
  }
  else {
    headers= {};
  }
  this._request("GET", url, headers, "", access_token, callback );
}


/***/ }),

/***/ 509:
/***/ ((__unused_webpack_module, exports) => {

/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS 180-1
 * Version 2.2 Copyright Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 1;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = "="; /* base-64 pad character. "=" for strict RFC compliance   */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s)    { return rstr2hex(rstr_sha1(str2rstr_utf8(s))); }
function b64_sha1(s)    { return rstr2b64(rstr_sha1(str2rstr_utf8(s))); }
function any_sha1(s, e) { return rstr2any(rstr_sha1(str2rstr_utf8(s)), e); }
function hex_hmac_sha1(k, d)
  { return rstr2hex(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d))); }
function b64_hmac_sha1(k, d)
  { return rstr2b64(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d))); }
function any_hmac_sha1(k, d, e)
  { return rstr2any(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d)), e); }

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc").toLowerCase() == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA1 of a raw string
 */
function rstr_sha1(s)
{
  return binb2rstr(binb_sha1(rstr2binb(s), s.length * 8));
}

/*
 * Calculate the HMAC-SHA1 of a key and some data (raw strings)
 */
function rstr_hmac_sha1(key, data)
{
  var bkey = rstr2binb(key);
  if(bkey.length > 16) bkey = binb_sha1(bkey, key.length * 8);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = binb_sha1(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
  return binb2rstr(binb_sha1(opad.concat(hash), 512 + 160));
}

/*
 * Convert a raw string to a hex string
 */
function rstr2hex(input)
{
  try { hexcase } catch(e) { hexcase=0; }
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var output = "";
  var x;
  for(var i = 0; i < input.length; i++)
  {
    x = input.charCodeAt(i);
    output += hex_tab.charAt((x >>> 4) & 0x0F)
           +  hex_tab.charAt( x        & 0x0F);
  }
  return output;
}

/*
 * Convert a raw string to a base-64 string
 */
function rstr2b64(input)
{
  try { b64pad } catch(e) { b64pad=''; }
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var len = input.length;
  for(var i = 0; i < len; i += 3)
  {
    var triplet = (input.charCodeAt(i) << 16)
                | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)
                | (i + 2 < len ? input.charCodeAt(i+2)      : 0);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > input.length * 8) output += b64pad;
      else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
    }
  }
  return output;
}

/*
 * Convert a raw string to an arbitrary string encoding
 */
function rstr2any(input, encoding)
{
  var divisor = encoding.length;
  var remainders = Array();
  var i, q, x, quotient;

  /* Convert to an array of 16-bit big-endian values, forming the dividend */
  var dividend = Array(Math.ceil(input.length / 2));
  for(i = 0; i < dividend.length; i++)
  {
    dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
  }

  /*
   * Repeatedly perform a long division. The binary array forms the dividend,
   * the length of the encoding is the divisor. Once computed, the quotient
   * forms the dividend for the next step. We stop when the dividend is zero.
   * All remainders are stored for later use.
   */
  while(dividend.length > 0)
  {
    quotient = Array();
    x = 0;
    for(i = 0; i < dividend.length; i++)
    {
      x = (x << 16) + dividend[i];
      q = Math.floor(x / divisor);
      x -= q * divisor;
      if(quotient.length > 0 || q > 0)
        quotient[quotient.length] = q;
    }
    remainders[remainders.length] = x;
    dividend = quotient;
  }

  /* Convert the remainders to the output string */
  var output = "";
  for(i = remainders.length - 1; i >= 0; i--)
    output += encoding.charAt(remainders[i]);

  /* Append leading zero equivalents */
  var full_length = Math.ceil(input.length * 8 /
                                    (Math.log(encoding.length) / Math.log(2)))
  for(i = output.length; i < full_length; i++)
    output = encoding[0] + output;

  return output;
}

/*
 * Encode a string as utf-8.
 * For efficiency, this assumes the input is valid utf-16.
 */
function str2rstr_utf8(input)
{
  var output = "";
  var i = -1;
  var x, y;

  while(++i < input.length)
  {
    /* Decode utf-16 surrogate pairs */
    x = input.charCodeAt(i);
    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)
    {
      x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
      i++;
    }

    /* Encode output as utf-8 */
    if(x <= 0x7F)
      output += String.fromCharCode(x);
    else if(x <= 0x7FF)
      output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0xFFFF)
      output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0x1FFFFF)
      output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                                    0x80 | ((x >>> 12) & 0x3F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
  }
  return output;
}

/*
 * Encode a string as utf-16
 */
function str2rstr_utf16le(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode( input.charCodeAt(i)        & 0xFF,
                                  (input.charCodeAt(i) >>> 8) & 0xFF);
  return output;
}

function str2rstr_utf16be(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,
                                   input.charCodeAt(i)        & 0xFF);
  return output;
}

/*
 * Convert a raw string to an array of big-endian words
 * Characters >255 have their high-byte silently ignored.
 */
function rstr2binb(input)
{
  var output = Array(input.length >> 2);
  for(var i = 0; i < output.length; i++)
    output[i] = 0;
  for(var i = 0; i < input.length * 8; i += 8)
    output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
  return output;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2rstr(input)
{
  var output = "";
  for(var i = 0; i < input.length * 32; i += 8)
    output += String.fromCharCode((input[i>>5] >>> (24 - i % 32)) & 0xFF);
  return output;
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function binb_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = bit_rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(bit_rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = bit_rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

exports.HMACSHA1= function(key, data) {
  return b64_hmac_sha1(key, data);
}

/***/ }),

/***/ 739:
/***/ ((module) => {

/**
 * Byte sizes are taken from ECMAScript Language Specification
 * http://www.ecma-international.org/ecma-262/5.1/
 * http://bclary.com/2004/11/07/#a-4.3.16
 */

module.exports = {
  STRING: 2,
  BOOLEAN: 4,
  NUMBER: 8
}


/***/ }),

/***/ 708:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";
// Copyright 2014 Andrei Karpushonak



var ECMA_SIZES = __nccwpck_require__(739)
var Buffer = (__nccwpck_require__(300).Buffer)

function allProperties(obj) {
  const stringProperties = []
  for (var prop in obj) { 
      stringProperties.push(prop)
  }
  if (Object.getOwnPropertySymbols) {
      var symbolProperties = Object.getOwnPropertySymbols(obj)
      Array.prototype.push.apply(stringProperties, symbolProperties)
  }
  return stringProperties
}

function sizeOfObject (seen, object) {
  if (object == null) {
    return 0
  }

  var bytes = 0
  var properties = allProperties(object)
  for (var i = 0; i < properties.length; i++) {
    var key = properties[i]
    // Do not recalculate circular references
    if (typeof object[key] === 'object' && object[key] !== null) {
      if (seen.has(object[key])) {
        continue
      }
      seen.add(object[key])
    }

    bytes += getCalculator(seen)(key)
    try {
      bytes += getCalculator(seen)(object[key])
    } catch (ex) {
      if (ex instanceof RangeError) {
        // circular reference detected, final result might be incorrect
        // let's be nice and not throw an exception
        bytes = 0
      }
    }
  }

  return bytes
}

function getCalculator (seen) {
  return function calculator(object) {
    if (Buffer.isBuffer(object)) {
      return object.length
    }

    var objectType = typeof (object)
    switch (objectType) {
      case 'string':
        return object.length * ECMA_SIZES.STRING
      case 'boolean':
        return ECMA_SIZES.BOOLEAN
      case 'number':
        return ECMA_SIZES.NUMBER
      case 'symbol':
        const isGlobalSymbol = Symbol.keyFor && Symbol.keyFor(object)
        return isGlobalSymbol ? Symbol.keyFor(object).length * ECMA_SIZES.STRING : (object.toString().length - 8) * ECMA_SIZES.STRING 
      case 'object':
        if (Array.isArray(object)) {
          return object.map(getCalculator(seen)).reduce(function (acc, curr) {
            return acc + curr
          }, 0)
        } else {
          return sizeOfObject(seen, object)
        }
      default:
        return 0
    }
  }
}

/**
 * Main module's entry point
 * Calculates Bytes for the provided parameter
 * @param object - handles object/string/boolean/buffer
 * @returns {*}
 */
function sizeof (object) {
  return getCalculator(new WeakSet())(object)
}

module.exports = sizeof


/***/ }),

/***/ 745:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var object_sizeof_1 = __importDefault(__nccwpck_require__(708));
var utils_1 = __nccwpck_require__(645);
var windowSessionStorage = typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;
var Cache = /** @class */ (function () {
    function Cache(ttl, maxByteSize) {
        if (ttl === void 0) { ttl = 360; }
        if (maxByteSize === void 0) { maxByteSize = 16000000; }
        this.cache = new Map();
        this.ttl = ttl;
        this.maxByteSize = maxByteSize;
    }
    Cache.prototype.add = function (query, data) {
        var hashedKey = utils_1.generateHash(query);
        var added = new Date();
        var entry = {
            added: added,
            data: data,
        };
        this.cache.set(hashedKey, entry);
        windowSessionStorage === null || windowSessionStorage === void 0 ? void 0 : windowSessionStorage.setItem(hashedKey, JSON.stringify(entry));
        this.clearSpace();
    };
    Cache.prototype.get = function (query) {
        var hashedKey = utils_1.generateHash(query);
        if (!this.has(query)) {
            return null;
        }
        try {
            var entry = this.cache.get(hashedKey);
            if (!entry) {
                var sessionData = windowSessionStorage === null || windowSessionStorage === void 0 ? void 0 : windowSessionStorage.getItem(hashedKey);
                if (!sessionData) {
                    return;
                }
                return JSON.parse(sessionData);
            }
            return entry.data;
        }
        catch (error) {
            return null;
        }
    };
    Cache.prototype.has = function (query) {
        var hashedKey = utils_1.generateHash(query);
        try {
            var now = new Date();
            var data = this.cache.get(hashedKey);
            if (!data) {
                var sessionData = windowSessionStorage === null || windowSessionStorage === void 0 ? void 0 : windowSessionStorage.getItem(hashedKey);
                if (!sessionData) {
                    return false;
                }
                data = JSON.parse(sessionData);
            }
            var entryAdded = new Date(data.added);
            if (now.getTime() > entryAdded.getTime() + this.ttl * 1000) {
                windowSessionStorage === null || windowSessionStorage === void 0 ? void 0 : windowSessionStorage.removeItem(hashedKey);
                this.cache.delete(hashedKey);
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    };
    Cache.prototype.clearSpace = function () {
        var cacheArray = Array.from(this.cache);
        if (object_sizeof_1.default(cacheArray) < this.maxByteSize) {
            return;
        }
        cacheArray.sort(function (a, b) { return a[1].added.getTime() - b[1].added.getTime(); });
        var reducedCacheArray = cacheArray.slice(1);
        this.cache = new Map(reducedCacheArray);
        this.clearSpace();
    };
    return Cache;
}());
exports["default"] = Cache;


/***/ }),

/***/ 282:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var oauth_1 = __importDefault(__nccwpck_require__(901));
var Cache_1 = __importDefault(__nccwpck_require__(745));
var utils_1 = __nccwpck_require__(645);
var Transport = /** @class */ (function () {
    function Transport(options) {
        this.credentials = options;
        this.oauth = new oauth_1.default.OAuth('https://api.twitter.com/oauth/request_token', 'https://api.twitter.com/oauth/access_token', this.credentials.apiKey, this.credentials.apiSecret, '1.0A', null, 'HMAC-SHA1');
        if (!(options === null || options === void 0 ? void 0 : options.disableCache)) {
            this.cache = new Cache_1.default(options === null || options === void 0 ? void 0 : options.ttl, options.maxByteSize);
        }
    }
    Transport.prototype.updateOptions = function (options) {
        var _this = this;
        var apiKey = options.apiKey, apiSecret = options.apiSecret, rest = __rest(options, ["apiKey", "apiSecret"]);
        var cleanOptions = rest;
        Object.keys(cleanOptions).forEach(function (key) {
            if (cleanOptions[key]) {
                _this.credentials[key] = cleanOptions[key];
            }
        });
    };
    Transport.prototype.doDeleteRequest = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.oauth) {
                    throw Error('Unable to make request. Authentication has not been established');
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.credentials.accessToken || !_this.credentials.accessTokenSecret) {
                            reject(new Error('Unable to make request. Authentication has not been established'));
                            return;
                        }
                        var formattedUrl = utils_1.formatURL(url);
                        _this.oauth.delete(formattedUrl, _this.credentials.accessToken, _this.credentials.accessTokenSecret, function (err, body) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            if (!body) {
                                resolve({});
                                return;
                            }
                            var result = utils_1.parse(body.toString());
                            resolve(result);
                        });
                    })];
            });
        });
    };
    Transport.prototype.doGetRequest = function (url) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_b) {
                if (!this.oauth) {
                    throw Error('Unable to make request. Authentication has not been established');
                }
                if ((_a = this.cache) === null || _a === void 0 ? void 0 : _a.has(url)) {
                    return [2 /*return*/, this.cache.get(url)];
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.credentials.accessToken || !_this.credentials.accessTokenSecret) {
                            reject(new Error('Unable to make request. Authentication has not been established'));
                            return;
                        }
                        var formattedUrl = utils_1.formatURL(url);
                        _this.oauth.get(formattedUrl, _this.credentials.accessToken, _this.credentials.accessTokenSecret, function (err, body) {
                            var _a;
                            if (err) {
                                reject(err);
                                return;
                            }
                            if (!body) {
                                resolve({});
                                return;
                            }
                            var result = utils_1.parse(body.toString());
                            (_a = _this.cache) === null || _a === void 0 ? void 0 : _a.add(url, result);
                            resolve(result);
                        });
                    })];
            });
        });
    };
    Transport.prototype.doPostRequest = function (url, body, contentType) {
        if (contentType === void 0) { contentType = 'application/x-www-form-urlencoded'; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.oauth || !this.credentials) {
                    throw Error('Unable to make request. Authentication has not been established');
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.credentials.accessToken || !_this.credentials.accessTokenSecret) {
                            reject(new Error('Unable to make request. Authentication has not been established'));
                            return;
                        }
                        var formattedUrl = utils_1.formatURL(url);
                        var formattedBody = contentType === 'application/json' ? JSON.stringify(body) : body;
                        _this.oauth.post(formattedUrl, _this.credentials.accessToken, _this.credentials.accessTokenSecret, formattedBody, contentType, function (err, body) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            if (!body) {
                                resolve({});
                                return;
                            }
                            var result = utils_1.parse(body.toString());
                            resolve(result);
                        });
                    })];
            });
        });
    };
    return Transport;
}());
exports["default"] = Transport;


/***/ }),

/***/ 645:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = exports.formatURL = exports.generateHash = exports.createParams = void 0;
exports.createParams = function (params, exclude) {
    if (!params) {
        return '';
    }
    var searchParams = new URLSearchParams();
    Object.entries(params).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (exclude === null || exclude === void 0 ? void 0 : exclude.includes(key)) {
            return;
        }
        if (typeof value === 'boolean') {
            searchParams.append(key, value ? 'true' : 'false');
            return;
        }
        searchParams.append(key, "" + value);
    });
    return "?" + searchParams.toString();
};
exports.generateHash = function (token) {
    var seed = 56852;
    var h1 = 0xdeadbeef ^ seed;
    var h2 = 0x41c6ce57 ^ seed;
    for (var i = 0, ch = void 0; i < token.length; i++) {
        ch = token.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
};
exports.formatURL = function (url) {
    return url
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
};
exports.parse = function (body) {
    var parsed = undefined;
    try {
        parsed = JSON.parse(body);
    }
    catch (error) { }
    if (parsed) {
        return parsed;
    }
    try {
        parsed = JSON.parse('{"' + decodeURI(body).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    }
    catch (error) { }
    if (parsed) {
        return parsed;
    }
    return body;
};


/***/ }),

/***/ 726:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(645);
var AccountsAndUsersClient = /** @class */ (function () {
    function AccountsAndUsersClient(transport) {
        if (!transport) {
            throw Error('Transport class needs to be provided.');
        }
        this.transport = transport;
    }
    /**
     * Returns all lists the authenticating or specified user subscribes to,  including their own. The user is specified using the user_id or screen_name parameters.  If no user is given, the authenticating user is used.A maximum of 100 results will be  returned by this call. Subscribed lists are returned first, followed by owned lists.  This means that if a user subscribes to 90 lists and owns 20 lists, this method returns  90 subscriptions and 10 owned lists. The reverse method returns owned lists first,  so with reverse=true, 20 owned lists and 80 subscriptions would be returned.  If your goal is to obtain every list a user owns or subscribes to,  use GET lists / ownerships and/or GET lists / subscriptions instead.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-list
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsList = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/list.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * members/* Returns the members of the specified list. Private list members will only be shown if the authenticated user owns the specified list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-members
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsMembers = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/members.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Check if the specified user is a member of the specified list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-members-show
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsMembersShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/members/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the lists the specified user has been added to.  If user_id or screen_name are not provided,  the memberships for the authenticating user are returned.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-memberships
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsMemberships = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/memberships.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the lists owned by the specified Twitter user.  Private lists will only be shown if the authenticated user is also the owner of the lists.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-ownerships
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsOwnerships = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/ownerships.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the specified list. Private lists will only be shown if the authenticated user owns the specified list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-show
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a timeline of tweets authored by members of the specified list.  Retweets are included by default. Use the include_rts=false parameter to omit retweets. Embedded Timelines is a great way to embed list timelines on your website.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-statuses
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsStatuses = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/statuses.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * subscribers/* Returns the subscribers of the specified list.  Private list subscribers will only be shown if the authenticated user owns the specified list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-subscribers
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsSubscribers = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/subscribers.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Check if the specified user is a subscriber of the specified list.  Returns the user if they are a subscriber.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-subscribers-show
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsSubscribersShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/subscribers/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Obtain a collection of the lists the specified user is subscribed to,  20 lists per page by default. Does not include the user's own lists.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/get-lists-subscriptions
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsSubscriptions = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/lists/subscriptions.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Creates a new list for the authenticated user. Note that you can create up to 1000 lists per account.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-create
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Deletes the specified list. The authenticated user must own the list to be able to destroy it.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-destroy
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/destroy.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Add a member to a list.  The authenticated user must own the list to be able to add members to it.  Note that lists cannot have more than 5,000 members.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-members-create
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsMembersCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/members/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Adds multiple members to a list, by specifying a comma-separated  list of member ids or screen names. The authenticated user must own the  list to be able to add members to it. Note that lists can't have more  than 5,000 members, and you are limited to adding up to 100 members  to a list at a time with this method.Please note that there can be  issues with lists that rapidly remove and add memberships. Take care when  using these methods such that you are not too rapidly switching between  removals and adds on the same list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-members-create_all
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsMembersCreateAll = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/members/create_all.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Removes the specified member from the list. The authenticated user must be the list's owner to remove members from the list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-members-destroy
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsMembersDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/members/destroy.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Removes multiple members from a list, by specifying a comma-separated list  of member ids or screen names. The authenticated user must own the list to  be able to remove members from it. Note that lists can't have more  than 500 members, and you are limited to removing up to 100 members to a  list at a time with this method.Please note that there can be issues with  lists that rapidly remove and add memberships. Take care when using these methods  such that you are not too rapidly switching between removals and adds on the same list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-members-destroy_all
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsMembersDestroyAll = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/members/destroy_all.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Subscribes the authenticated user to the specified list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-subscribers-create
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsSubscribersCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/subscribers/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Unsubscribes the authenticated user from the specified list.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-subscribers-destroy
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsSubscribersDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/subscribers/destroy.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Updates the specified list. The authenticated user must own the list to be able to update it.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/create-manage-lists/api-reference/post-lists-update
     * @param parameters
     */
    AccountsAndUsersClient.prototype.listsUpdate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/lists/update.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a cursored collection of user IDs for every user following the specified user. At this time, results are ordered with the most recent following first — however,  this ordering is subject to unannounced change and eventual consistency issues. Results are  given in groups of 5,000 user IDs and multiple "pages" of results can be navigated through  using the next_cursor value in subsequent requests. See Using cursors to navigate  collections for more information.This method is especially powerful when used in  conjunction with GET users / lookup, a method that allows  you to convert user IDs into full user objects in bulk.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-followers-ids
     * @param parameters
     */
    AccountsAndUsersClient.prototype.followersIds = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/followers/ids.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a cursored collection of user objects for users following the specified user. At this time, results are ordered with the most recent following first — however,  this ordering is subject to unannounced change and eventual consistency issues.  Results are given in groups of 20 users and multiple "pages" of results can be  navigated through using the next_cursor value in subsequent requests.  See Using cursors to navigate collections for more information.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-followers-list
     * @param parameters
     */
    AccountsAndUsersClient.prototype.followersList = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/followers/list.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a cursored collection of user IDs for every user the specified  user is following (otherwise known as their "friends").At this time, results  are ordered with the most recent following first — however, this ordering  is subject to unannounced change and eventual consistency issues.  Results are given in groups of 5,000 user IDs and multiple "pages"  of results can be navigated through using the next_cursor value in subsequent requests.  See Using cursors to navigate collections for more information.This method is  especially powerful when used in conjunction with GET users / lookup, a method  that allows you to convert user IDs into full user objects in bulk.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-friends-ids
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendsIds = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/friends/ids.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a cursored collection of user objects for every user the  specified user is following (otherwise known as their "friends").At this time,  results are ordered with the most recent following first — however, this  ordering is subject to unannounced change and eventual consistency issues.  Results are given in groups of 20 users and multiple "pages" of results can  be navigated through using the next_cursor value in subsequent requests.  See Using cursors to navigate collections for more information.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-friends-list
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendsList = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/friends/list.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a collection of numeric IDs for every user who has a pending request to follow the authenticating user.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-friendships-incoming
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendshipsIncoming = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/friendships/incoming.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the relationships of the authenticating user to the comma-separated  list of up to 100 screen_names or user_ids provided. Values for connections can be:  following, following_requested, followed_by, none, blocking, muting.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-friendships-lookup
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendshipsLookup = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/friendships/lookup.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a collection of user_ids that the currently authenticated user does  not want to receive retweets from.Use POST friendships / update to set the  "no retweets" status for a given user account on behalf of the current user.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-friendships-no_retweets-ids
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendshipsNoRetweetsIds = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/friendships/no_retweets/ids.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a collection of numeric IDs for every protected user for  whom the authenticating user has a pending follow request.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-friendships-outgoing
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendshipsOutgoing = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/friendships/outgoing.format' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns detailed information about the relationship between two arbitrary users.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-friendships-show
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendshipsShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/friendships/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns fully-hydrated user objects for up to 100 users per request, as specified by comma-separated values passed to the user_id and/or screen_name parameters.This method is especially useful when used in conjunction with collections of user IDs returned from GET friends / ids and GET followers / ids.GET users / show is used to retrieve a single user object.There are a few things to note when using this method. You must be following a protected user to be able to see their most recent status update. If you don't follow a protected user their status will be removed. The order of user IDs or screen names may not match the order of users in the returned array. If a requested user is unknown, suspended, or deleted, then that user will not be returned in the results list. If none of your lookup criteria can be satisfied by returning a user object, a HTTP 404 will be thrown. You are strongly encouraged to use a POST for larger requests.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-lookup
     * @param parameters
     */
    AccountsAndUsersClient.prototype.usersLookup = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/users/lookup.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Provides a simple, relevance-based search interface  to public user accounts on Twitter. Try querying by topical interest,  full name, company name, location, or other criteria. Exact match searches  are not supported.Only the first 1,000 matching results are available.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-search
     * @param parameters
     */
    AccountsAndUsersClient.prototype.usersSearch = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/users/search.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a variety of information about the user specified by  the required user_id or screen_name parameter.  The author's most recent Tweet will be returned inline when possible.GET users / lookup  is used to retrieve a bulk collection of user objects.You must be following a  protected user to be able to see their most recent Tweet. If you don't follow a  protected user, the user's Tweet will be removed. A Tweet will not always be  returned in the current_status field.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-show
     * @param parameters
     */
    AccountsAndUsersClient.prototype.usersShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/users/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Allows the authenticating user to follow (friend) the user  specified in the ID parameter.Returns the followed user when successful.  Returns a string describing the failure condition when unsuccessful.  If the user is already friends with the user a HTTP 403 may be returned,  though for performance reasons this method may also return a HTTP 200 OK  message even if the follow relationship already exists.Actions taken in  this method are asynchronous. Changes will be eventually consistent.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/post-friendships-create
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendshipsCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/friendships/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Allows the authenticating user to unfollow the user specified  in the ID parameter. Returns the unfollowed user when successful.  Returns a string describing the failure condition when unsuccessful. Actions taken in this method are asynchronous.  Changes will be eventually consistent.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/post-friendships-destroy
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendshipsDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/friendships/destroy.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Enable or disable Retweets and device notifications from the specified user.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/post-friendships-update
     * @param parameters
     */
    AccountsAndUsersClient.prototype.friendshipsUpdate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/friendships/update.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns settings (including current trend, geo and sleep time information) for the authenticating user.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-account-settings
     */
    AccountsAndUsersClient.prototype.accountSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/account/settings.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns an HTTP 200 OK response code and a representation of the requesting user if authentication was successful; returns a 401 status code and an error message if not. Use this method to test if supplied user credentials are valid.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials
     * @param parameters
     */
    AccountsAndUsersClient.prototype.accountVerifyCredentials = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/account/verify_credentials.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the authenticated user's saved search queries.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-saved_searches-list
     */
    AccountsAndUsersClient.prototype.savedSearchesList = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/saved_searches/list.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Retrieve the information for the saved search represented by the given id. The authenticating user must be the owner of saved search ID being requested.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-saved_searches-show-id
     * @param parameters
     */
    AccountsAndUsersClient.prototype.savedSearchesShowById = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters, ['id']);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/saved_searches/show/' + parameters.id + '.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a map of the available size variations of the specified user's profile banner. If the user has not uploaded a profile banner, a HTTP 404 will be served instead. This method can be used instead of string manipulation on the profile_banner_url returned in user objects as described in Profile Images and Banners. The profile banner data available at each size variant's URL is in PNG format.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-users-profile_banner
     * @param parameters
     */
    AccountsAndUsersClient.prototype.usersProfileBanner = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/users/profile_banner.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Removes the uploaded profile banner for the authenticating user. Returns HTTP 200 upon success.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/post-account-remove_profile_banner
     */
    AccountsAndUsersClient.prototype.accountRemoveProfileBanner = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/account/remove_profile_banner.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Sets some values that users are able to set under the "Account"  tab of their settings page. Only the parameters specified will be updated.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile
     * @param parameters
     */
    AccountsAndUsersClient.prototype.accountUpdateProfile = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/account/update_profile.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Updates the authenticating user's profile background image.  This method can also be used to enable or disable the profile  background image.Although each parameter is marked as optional, at least one of  image or media_id must be provided when making this request.Learn more about the  deprecation of this endpoint via our forum post.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile_background_image
     * @param parameters
     */
    AccountsAndUsersClient.prototype.accountUpdateProfileBackgroundImageRetired = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/account/update_profile_background_image.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Uploads a profile banner on behalf of the authenticating user. More information about sizing variations can be found in User Profile Images and Banners and GET users / profile_banner.Profile banner images are processed asynchronously. The profile_banner_url and its variant sizes will not necessary be available directly after upload.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile_banner
     * @param parameters
     */
    AccountsAndUsersClient.prototype.accountUpdateProfileBanner = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/account/update_profile_banner.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Updates the authenticating user's profile image.  Note that this method expects raw multipart data, not a URL to an image. This method asynchronously processes the uploaded file before updating the  user's profile image URL. You can either update your local cache the next  time you request the user's information, or, at least 5 seconds after  uploading the image, ask for the updated URL using GET users / show.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/post-account-update_profile_image
     * @param parameters
     */
    AccountsAndUsersClient.prototype.accountUpdateProfileImage = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/account/update_profile_image.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Create a new saved search for the authenticated user. A user may only have 25 saved searches.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/post-saved_searches-create
     * @param parameters
     */
    AccountsAndUsersClient.prototype.savedSearchesCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/saved_searches/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Destroys a saved search for the authenticating user. The authenticating user must be the owner of saved search id being destroyed.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/post-saved_searches-destroy-id
     * @param parameters
     */
    AccountsAndUsersClient.prototype.savedSearchesDestroyById = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/saved_searches/destroy/' + parameters.id + '.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns an array of numeric user ids the authenticating user is blocking. Important This method is cursored, meaning your app must make  multiple requests in order to receive all blocks correctly. See Using cursors to navigate  collections for more details on how cursoring works.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/mute-block-report-users/api-reference/get-blocks-ids
     */
    AccountsAndUsersClient.prototype.blocksIds = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/blocks/ids.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a collection of user objects that the authenticating user is blocking. Important This method is cursored, meaning your app must make multiple  requests in order to receive all blocks correctly. See Using cursors to  navigate collections for more details on how cursoring works.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/mute-block-report-users/api-reference/get-blocks-list
     */
    AccountsAndUsersClient.prototype.blocksList = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/blocks/list.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns an array of numeric user ids the authenticating user has muted.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/mute-block-report-users/api-reference/get-mutes-users-ids
     */
    AccountsAndUsersClient.prototype.mutesUsersIds = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/mutes/users/ids.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns an array of user objects the authenticating user has muted.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/mute-block-report-users/api-reference/get-mutes-users-list
     */
    AccountsAndUsersClient.prototype.mutesUsersList = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/mutes/users/list.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Blocks the specified user from following the authenticating user.  In addition the blocked user will not show in the authenticating users mentions  or timeline (unless retweeted by another user). If a follow or friend  relationship exists it is destroyed.The URL pattern  /version/block/create/:screen_name_or_user_id.format is still accepted but not  recommended. As a sequence of numbers is a valid screen name we recommend using  the screen_name or user_id parameter instead.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/mute-block-report-users/api-reference/post-blocks-create
     * @param parameters
     */
    AccountsAndUsersClient.prototype.blocksCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/blocks/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Mutes the user specified in the ID parameter for the authenticating user. Returns the muted user when successful. Returns a string describing the  failure condition when unsuccessful.Actions taken in this method are asynchronous.  Changes will be eventually consistent.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/mute-block-report-users/api-reference/post-mutes-users-create
     * @param parameters
     */
    AccountsAndUsersClient.prototype.mutesUsersCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/mutes/users/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Un-mutes the user specified in the ID parameter for the authenticating user. Returns the unmuted user when successful. Returns a string describing the  failure condition when unsuccessful.Actions taken in this method are asynchronous.  Changes will be eventually consistent.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/mute-block-report-users/api-reference/post-mutes-users-destroy
     * @param parameters
     */
    AccountsAndUsersClient.prototype.mutesUsersDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/mutes/users/destroy.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Report the specified user as a spam account to Twitter.  Additionally, optionally performs the equivalent of POST blocks / create  on behalf of the authenticated user.
     *
     * @link https://developer.twitter.com/en/docs/accounts-and-users/mute-block-report-users/api-reference/post-users-report_spam
     * @param parameters
     */
    AccountsAndUsersClient.prototype.usersReportSpam = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/users/report_spam.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return AccountsAndUsersClient;
}());
exports["default"] = AccountsAndUsersClient;


/***/ }),

/***/ 941:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(645);
var BasicsClient = /** @class */ (function () {
    function BasicsClient(transport) {
        if (!transport) {
            throw Error('Transport class needs to be provided.');
        }
        this.transport = transport;
    }
    /**
     * Allows a Consumer application to use an OAuth request_token to request user authorization.  This method is a replacement of Section 6.2 of the OAuth 1.0 authentication flow for applications  using the callback authentication flow. The method will use the currently logged in user as the account  for access authorization unless the force_login parameter is set to true.This method differs from  GET oauth / authorize in that if the user has already granted the application permission,  the redirect will occur without the user having to re-approve the application.  To realize this behavior, you must enable the Use Sign in with Twitter setting on your application record.
     *
     * @link https://developer.twitter.com/en/docs/basics/authentication/api-reference/authenticate
     * @param parameters
     */
    BasicsClient.prototype.oauthAuthenticate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/oauth/authenticate' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Allows a Consumer application to use an OAuth Request Token to request user authorization.  This method fulfills Section 6.2 of the OAuth 1.0 authentication flow.  Desktop applications must use this method (and cannot use GET oauth / authenticate). Usage Note: An oauth_callback is never sent to this method, provide it to POST oauth / request_token instead.
     *
     * @link https://developer.twitter.com/en/docs/basics/authentication/api-reference/authorize
     * @param parameters
     */
    BasicsClient.prototype.oauthAuthorize = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/oauth/authorize' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Allows a Consumer application to exchange the OAuth Request Token for an OAuth Access Token. This method fulfills Section 6.3 of the OAuth 1.0 authentication flow.
     *
     * @link https://developer.twitter.com/en/docs/basics/authentication/api-reference/access_token
     * @param parameters
     */
    BasicsClient.prototype.oauthAccessToken = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/oauth/access_token', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Allows a registered application to revoke an issued OAuth access_token  by presenting its client credentials. Once an access_token has been invalidated,  new creation attempts will yield a different Access Token and usage of  the invalidated token will no longer be allowed.
     *
     * @link https://developer.twitter.com/en/docs/basics/authentication/api-reference/invalidate_access_token
     * @param parameters
     */
    BasicsClient.prototype.oauthInvalidateToken = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/oauth/invalidate_token', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Allows a registered application to revoke an issued oAuth 2.0 Bearer Token by presenting  its client credentials. Once a Bearer Token has been invalidated, new creation  attempts will yield a different Bearer Token and usage of the invalidated  token will no longer be allowed.Successful responses include a  JSON-structure describing the revoked Bearer Token.
     *
     * @link https://developer.twitter.com/en/docs/basics/authentication/api-reference/invalidate_bearer_token
     * @param parameters
     */
    BasicsClient.prototype.oauth2InvalidateToken = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/oauth2/invalidate_token', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Allows a Consumer application to obtain an OAuth Request Token to request user authorization.  This method fulfills Section 6.1 of the OAuth 1.0 authentication flow.
     *
     * @link https://developer.twitter.com/en/docs/basics/authentication/api-reference/request_token
     * @param parameters
     */
    BasicsClient.prototype.oauthRequestToken = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/oauth/request_token', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Allows a registered application to obtain an OAuth 2 Bearer Token,  which can be used to make API requests on an application's own behalf,  without a user context. This is called Application-only authentication. A Bearer Token may be invalidated using oauth2/invalidate_token.  Once a Bearer Token has been invalidated, new creation attempts will yield a different Bearer Token and  usage of the previous token will no longer be allowed. Only one bearer token may exist outstanding for an application, and repeated requests to this method  will yield the same already-existent token until it has been invalidated. Successful responses include a JSON-structure describing the awarded Bearer Token. Tokens received by this method should be cached.  If attempted too frequently, requests will be rejected with a HTTP 403 with code 99.
     *
     * @link https://developer.twitter.com/en/docs/basics/authentication/api-reference/token
     * @param parameters
     */
    BasicsClient.prototype.oauth2Token = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/oauth2/token', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return BasicsClient;
}());
exports["default"] = BasicsClient;


/***/ }),

/***/ 179:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(645);
var DirectMessagesClient = /** @class */ (function () {
    function DirectMessagesClient(transport) {
        if (!transport) {
            throw Error('Transport class needs to be provided.');
        }
        this.transport = transport;
    }
    /**
     * Returns a custom profile that was created with POST custom_profiles/new.json.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/custom-profiles/api-reference/get-profile
     * @param parameters
     */
    DirectMessagesClient.prototype.customProfilesById = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters, ['id']);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/custom_profiles/' + parameters.id + '.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Deletes the direct message specified in the required ID parameter. The authenticating user must be the recipient of the specified direct message. Direct Messages are only removed from the interface of the user context provided. Other members of the conversation can still access the Direct Messages. A successful delete will return a 204 http response code with no body content. Important: This method requires an access token with RWD (read, write & direct message) permissions.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/delete-message-event
     * @param parameters
     */
    DirectMessagesClient.prototype.eventsDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doDeleteRequest('https://api.twitter.com/1.1/direct_messages/events/destroy.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a single Direct Message event by the given id.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/get-event
     * @param parameters
     */
    DirectMessagesClient.prototype.eventsShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/direct_messages/events/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns all Direct Message events (both sent and received) within the last 30 days. Sorted in reverse-chronological order.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/sending-and-receiving/api-reference/list-events
     * @param parameters
     */
    DirectMessagesClient.prototype.eventsList = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/direct_messages/events/list.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Publishes a new message_create event resulting in a Direct Message sent to a specified user from the authenticating user. Returns an event if successful. Supports publishing Direct Messages with optional Quick Reply and media attachment. Replaces behavior currently provided by POST direct_messages/new.Requires a JSON POST body and Content-Type header to be set to application/json. Setting Content-Length may also be required if it is not automatically.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/new-event
     * @param parameters
     */
    DirectMessagesClient.prototype.eventsNew = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/direct_messages/events/new.json', parameters, 'application/json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Displays a visual typing indicator in the recipient’s Direct Message conversation view with the sender. Each request triggers a typing indicator animation with a duration of ~3 seconds.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/typing-indicator-and-read-receipts/api-reference/new-typing-indicator
     * @param parameters
     */
    DirectMessagesClient.prototype.indicateTyping = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/direct_messages/indicate_typing.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a Welcome Message Rule by the given id.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/welcome-messages/api-reference/get-welcome-message-rule
     * @param parameters
     */
    DirectMessagesClient.prototype.welcomeMessagesRulesShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/direct_messages/welcome_messages/rules/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a Welcome Message by the given id.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/welcome-messages/api-reference/get-welcome-message
     * @param parameters
     */
    DirectMessagesClient.prototype.welcomeMessagesShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/direct_messages/welcome_messages/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Creates a new Welcome Message that will be stored and sent in the future from the authenticating user in defined circumstances. Returns the message template if successful. Supports publishing with the same elements as Direct Messages (e.g. Quick Replies, media attachments). Requires a JSON POST body and Content-Type header to be set to application/json. Setting Content-Length may also be required if it is not automatically. See the Welcome Messages overview to learn how to work with Welcome Messages.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/welcome-messages/api-reference/new-welcome-message
     * @param parameters
     */
    DirectMessagesClient.prototype.welcomeMessagesNew = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/direct_messages/welcome_messages/new.json', parameters, 'application/json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Creates a new Welcome Message Rule that determines which Welcome Message will be shown in a given conversation. Returns the created rule if successful. Requires a JSON POST body and Content-Type header to be set to application/json. Setting Content-Length may also be required if it is not automatically. Additional rule configurations are forthcoming. For the initial beta release, the most recently created Rule will always take precedence, and the assigned Welcome Message will be displayed in the conversation.See the Welcome Messages overview to learn how to work with Welcome Messages.
     *
     * @link https://developer.twitter.com/en/docs/direct-messages/welcome-messages/api-reference/new-welcome-message-rule
     * @param parameters
     */
    DirectMessagesClient.prototype.welcomeMessagesRulesNew = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/direct_messages/welcome_messages/rules/new.json', parameters, 'application/json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a list of Welcome Messages.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/welcome-messages/api-reference/list-welcome-messages
     * @param parameters
     */
    DirectMessagesClient.prototype.welcomeMessagesList = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/direct_messages/welcome_messages/list.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a list of Welcome Messages.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/welcome-messages/api-reference/delete-welcome-message
     * @param parameters
     */
    DirectMessagesClient.prototype.welcomeMessagesDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doDeleteRequest('https://api.twitter.com/1.1/direct_messages/welcome_messages/destroy.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a list of Welcome Messages.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/direct-messages/welcome-messages/api-reference/delete-welcome-message-rule
     * @param parameters
     */
    DirectMessagesClient.prototype.welcomeMessagesRulesDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doDeleteRequest('https://api.twitter.com/1.1/direct_messages/welcome_messages/rules/destroy.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return DirectMessagesClient;
}());
exports["default"] = DirectMessagesClient;


/***/ }),

/***/ 389:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(645);
var GeoClient = /** @class */ (function () {
    function GeoClient(transport) {
        if (!transport) {
            throw Error('Transport class needs to be provided.');
        }
        this.transport = transport;
    }
    /**
     * Returns all the information about a known place.
     *
     * @link https://developer.twitter.com/en/docs/geo/place-information/api-reference/get-geo-id-place_id
     * @param parameters
     */
    GeoClient.prototype.geoIdByPlaceId = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters, ['place_id']);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/geo/id/' + parameters.place_id + '.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Given a latitude and a longitude, searches for up to 20 places that can be used as a place_id when updating a status.This request is an informative call and will deliver generalized results about geography.
     *
     * @link https://developer.twitter.com/en/docs/geo/places-near-location/api-reference/get-geo-reverse_geocode
     */
    GeoClient.prototype.geoReverseGeocode = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/geo/reverse_geocode.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Search for places that can be attached to a Tweet via POST statuses/update. Given a latitude and a longitude pair, an IP address, or a name, this request will return a list of all the valid places that can be used as the place_id when updating a status.Conceptually, a query can be made from the user's location, retrieve a list of places, have the user validate the location they are at, and then send the ID of this location with a call to POST statuses/update.This is the recommended method to use find places that can be attached to statuses/update. Unlike GET geo/reverse_geocode which provides raw data access, this endpoint can potentially re-order places with regards to the user who is authenticated. This approach is also preferred for interactive place matching with the user.Some parameters in this method are only required based on the existence of other parameters. For instance, "lat" is required if "long" is provided, and vice-versa. Authentication is recommended, but not required with this method.
     *
     * @link https://developer.twitter.com/en/docs/geo/places-near-location/api-reference/get-geo-search
     */
    GeoClient.prototype.geoSearch = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/geo/search.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return GeoClient;
}());
exports["default"] = GeoClient;


/***/ }),

/***/ 207:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(645);
var MediaClient = /** @class */ (function () {
    function MediaClient(transport) {
        if (!transport) {
            throw Error('Transport class needs to be provided.');
        }
        this.transport = transport;
    }
    /**
     * The INIT command request is used to initiate a file upload session. It returns a media_id which should be used to execute all subsequent requests. The next step after a successful return from INIT command is the APPEND command. See the Uploading media guide for constraints and requirements on media files.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload-init
     * @param parameters
     */
    MediaClient.prototype.mediaUploadInit = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://upload.twitter.com/1.1/media/upload.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * The APPEND command is used to upload a chunk (consecutive byte range) of the media file. For example, a 3 MB file could be split into 3 chunks of size 1 MB, and uploaded using 3 APPEND command requests. After the entire file is uploaded, the next step is to call the FINALIZE command.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload-append
     * @param parameters
     */
    MediaClient.prototype.mediaUploadAppend = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://upload.twitter.com/1.1/media/upload.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * The STATUS command is used to periodically poll for updates of media processing operation. After the STATUS command response returns succeeded, you can move on to the next step which is usually create Tweet with media_id.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/get-media-upload-status
     * @param parameters
     */
    MediaClient.prototype.mediaUploadStatus = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://upload.twitter.com/1.1/media/upload.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * The FINALIZE command should be called after the entire media file is uploaded using APPEND commands. If and (only if) the response of the FINALIZE command contains a processing_info field, it may also be necessary to use a STATUS command and wait for it to return success before proceeding to Tweet creation.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload-finalize
     * @param parameters
     */
    MediaClient.prototype.mediaUploadFinalize = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://upload.twitter.com/1.1/media/upload.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Use this endpoint to upload images to Twitter. This endpoint returns a media_id by default and can optionally return a media_key when a media_category is specified. These values are used by Twitter endpoints that accept images. For example, a media_id value can be used to create a Tweet with an attached photo using the POST statuses/update endpoint. All Ads API endpoints require a media_key. For example, a media_key value can be used to create a Draft Tweet with a photo using the POST accounts/:account_id/draft_tweets endpoint.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload
     * @param parameters
     */
    MediaClient.prototype.mediaUpload = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://upload.twitter.com/1.1/media/upload.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * This endpoint can be used to provide additional information about the uploaded media_id. This feature is currently only supported for images and GIFs.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-metadata-create
     * @param parameters
     */
    MediaClient.prototype.mediaMetadataCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://upload.twitter.com/1.1/media/metadata/create.json', parameters, 'application/json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Use this endpoint to dissociate subtitles from a video and delete the subtitles. You can dissociate subtitles from a video before or after Tweeting.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-subtitles-delete
     */
    MediaClient.prototype.mediaSubtitlesDelete = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://upload.twitter.com/1.1/media/subtitles/delete.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Use this endpoint to associate uploaded subtitles to an uploaded video. You can associate subtitles to video before or after Tweeting. Request flow for associating subtitle to video before the video is Tweeted : 1. Upload video using the chunked upload endpoint and get the video media_id. 2. Upload subtitle using the chunked upload endpoint with media category set to “Subtitles” and get the subtitle media_id.  3. Call this endpoint to associate the subtitle to the video. 4. Create Tweet with the video media_id.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-subtitles-create
     */
    MediaClient.prototype.mediaSubtitlesCreate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://upload.twitter.com/1.1/media/subtitles/create.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return MediaClient;
}());
exports["default"] = MediaClient;


/***/ }),

/***/ 688:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(645);
var MetricsClient = /** @class */ (function () {
    function MetricsClient(transport) {
        if (!transport) {
            throw Error('Transport class needs to be provided.');
        }
        this.transport = transport;
    }
    /**
     * The metrics field allows developers to access public and private engagement metrics for Tweet and media objects. Public metrics are accessible by anyone with a developer account while private metrics are accessible from owned/authorized accounts (definition below).
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/metrics
     * @param parameters
     */
    MetricsClient.prototype.tweets = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/2/tweets' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return MetricsClient;
}());
exports["default"] = MetricsClient;


/***/ }),

/***/ 765:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(645);
var TrendsClient = /** @class */ (function () {
    function TrendsClient(transport) {
        if (!transport) {
            throw Error('Transport class needs to be provided.');
        }
        this.transport = transport;
    }
    /**
     * Returns the locations that Twitter has trending topic information for.The response is an array of "locations" that encode the location's WOEID and some other human-readable information such as a canonical name and country the location belongs in.A WOEID is a Yahoo! Where On Earth ID.
     *
     * @link https://developer.twitter.com/en/docs/trends/locations-with-trending-topics/api-reference/get-trends-available
     */
    TrendsClient.prototype.trendsAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/trends/available.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the locations that Twitter has trending topic information for,  closest to a specified location.The response is an array of "locations"  that encode the location's WOEID and some other human-readable information  such as a canonical name and country the location belongs in.A WOEID is a Yahoo!  Where On Earth ID.
     *
     * @link https://developer.twitter.com/en/docs/trends/locations-with-trending-topics/api-reference/get-trends-closest
     * @param parameters
     */
    TrendsClient.prototype.trendsClosest = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/trends/closest.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the top 50 trending topics for a specific WOEID, if trending  information is available for it.The response is an array of trend  objects that encode the name of the trending topic, the query  parameter that can be used to search for the topic on Twitter Search, and the Twitter Search URL.This information is cached for 5 minutes.  Requesting more frequently than that will not return any more data, and  will count against rate limit usage.The tweet_volume for the last 24 hours  is also returned for many trends if this is available.
     *
     * @link https://developer.twitter.com/en/docs/trends/trends-for-location/api-reference/get-trends-place
     * @param parameters
     */
    TrendsClient.prototype.trendsPlace = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/trends/place.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return TrendsClient;
}());
exports["default"] = TrendsClient;


/***/ }),

/***/ 183:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __nccwpck_require__(645);
var TweetsClient = /** @class */ (function () {
    function TweetsClient(transport) {
        if (!transport) {
            throw Error('Transport class needs to be provided.');
        }
        this.transport = transport;
    }
    /**
     * Retrieve the identified Collection, presented as a list of the Tweets curated within. The response structure of this method differs significantly from timelines you  may be used to working with elsewhere in the Twitter API.To navigate a Collection,  use the position object of a response, which includes attributes for max_position,  min_position, and was_truncated. was_truncated indicates whether additional  Tweets exist in the collection outside of the range of the current request.  To retrieve Tweets further back in time, use the value of min_position found  in the current response as the max_position parameter in the next call to this endpoint.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/get-collections-entries
     * @param parameters
     */
    TweetsClient.prototype.collectionsEntries = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/collections/entries.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Find Collections created by a specific user or containing a  specific curated Tweet.Results are organized in a cursored collection.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/get-collections-list
     * @param parameters
     */
    TweetsClient.prototype.collectionsList = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/collections/list.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Retrieve information associated with a specific Collection.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/get-collections-show
     * @param parameters
     */
    TweetsClient.prototype.collectionsShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/collections/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Create a Collection owned by the currently authenticated user. The API endpoint may refuse to complete the request if the authenticated  user has exceeded the total number of allowed collections for their account.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/post-collections-create
     * @param parameters
     */
    TweetsClient.prototype.collectionsCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/collections/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Permanently delete a Collection owned by the currently authenticated user.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/post-collections-destroy
     * @param parameters
     */
    TweetsClient.prototype.collectionsDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/collections/destroy.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Add a specified Tweet to a Collection.A collection will store up  to a few thousand Tweets. Adding a Tweet to a collection beyond its  allowed capacity will remove the oldest Tweet in the collection based  on the time it was added to the collection.Use POST collections / entries / curate  to add Tweets to a Collection in bulk.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/post-collections-entries-add
     * @param parameters
     */
    TweetsClient.prototype.collectionsEntriesAdd = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/collections/entries/add.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Curate a Collection by adding or removing Tweets in bulk.  Updates must be limited to 100 cumulative additions or removals per request. Use POST collections / entries / add and POST collections / entries / remove  to add or remove a single Tweet.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/post-collections-entries-curate
     */
    TweetsClient.prototype.collectionsEntriesCurate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/collections/entries/curate.json')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Move a specified Tweet to a new position in a curation_reverse_chron ordered collection.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/post-collections-entries-move
     * @param parameters
     */
    TweetsClient.prototype.collectionsEntriesMove = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/collections/entries/move.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Remove the specified Tweet from a Collection.Use POST  collections / entries / curate to remove Tweets from a Collection in bulk.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/post-collections-entries-remove
     * @param parameters
     */
    TweetsClient.prototype.collectionsEntriesRemove = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/collections/entries/remove.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Update information concerning a Collection owned by the currently authenticated user. Partial updates are not currently supported: please provide name, description,  and url whenever using this method. Omitted description or url parameters will  be treated as if an empty string was passed, overwriting  any previously stored value for the Collection.
     *
     * @link https://developer.twitter.com/en/docs/tweets/curate-a-collection/api-reference/post-collections-update
     * @param parameters
     */
    TweetsClient.prototype.collectionsUpdate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/collections/update.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a collection of the most recent Tweets and Retweets posted  by the authenticating user and the users they follow. The home timeline is  central to how most users interact with the Twitter service.Up to 800  Tweets are obtainable on the home timeline. It is more volatile for  users that follow many users or follow users who Tweet frequently. See Working with Timelines for instructions on traversing timelines efficiently.
     *
     * @link https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
     * @param parameters
     */
    TweetsClient.prototype.statusesHomeTimeline = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/statuses/home_timeline.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Important notice: On June 19, 2019, we began enforcing a  limit of 100,000 requests per day to the /statuses/mentions_timeline endpoint.  This is in addition to existing user-level rate limits (75 requests / 15-minutes).  This limit is enforced on a per-application basis, meaning that a  single developer app can make up to 100,000 calls during any  single 24-hour period.Returns the 20 most recent mentions  (Tweets containing a users's @screen_name) for the authenticating user. The timeline returned is the equivalent of the one seen when you view  your mentions on twitter.com.This method can only return up to 800 tweets. See Working with Timelines for instructions on traversing timelines.
     *
     * @link https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-mentions_timeline
     * @param parameters
     */
    TweetsClient.prototype.statusesMentionsTimeline = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/statuses/mentions_timeline.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Important notice: On June 19, 2019, we began enforcing a limit of  100,000 requests per day to the /statuses/user_timeline endpoint,  in addition to existing user-level and app-level rate limits. This limit is applied on a per-application basis, meaning that a single developer app  can make up to 100,000 calls during any single 24-hour period.Returns a collection  of the most recent Tweets posted by the user indicated by the screen_name or  user_id parameters.User timelines belonging to protected users may only be  requested when the authenticated user either "owns" the timeline or is an  approved follower of the owner.The timeline returned is the equivalent of  the one seen as a user's profile on Twitter.This method can only return up  to 3,200 of a user's most recent Tweets. Native retweets of other statuses  by the user is included in this total, regardless of whether include_rts  is set to false when requesting this resource.See Working with Timelines  for instructions on traversing timelines.See Embedded Timelines,  Embedded Tweets, and GET statuses/oembed for tools to render  Tweets according to Display Requirements.
     *
     * @link https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-user_timeline
     * @param parameters
     */
    TweetsClient.prototype.statusesUserTimeline = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/statuses/user_timeline.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Note: favorites are now known as likes. Returns the 20 most recent Tweets liked by the authenticating or specified user.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-favorites-list
     * @param parameters
     */
    TweetsClient.prototype.favoritesList = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/favorites/list.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns fully-hydrated Tweet objects for up to 100 Tweets per request, as specified by comma-separated values passed to the id parameter.This method is especially useful to get the details (hydrate) a collection of Tweet IDs.GET statuses / show / :id is used to retrieve a single Tweet object.There are a few things to note when using this method. You must be following a protected user to be able to see their most recent Tweets. If you don't follow a protected user their status will be removed. The order of Tweet IDs may not match the order of Tweets in the returned array. If a requested Tweet is unknown or deleted, then that Tweet will not be returned in the results list, unless the map parameter is set to true, in which case it will be returned with a value of null. If none of your lookup criteria matches valid Tweet IDs an empty array will be returned for map=false. You are strongly encouraged to use a POST for larger requests.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-statuses-lookup
     * @param parameters
     */
    TweetsClient.prototype.statusesLookup = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/statuses/lookup.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a collection of up to 100 user IDs belonging to users who have retweeted the Tweet specified by the id parameter. This method offers similar data to GET statuses / retweets / :id.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-statuses-retweeters-ids
     * @param parameters
     */
    TweetsClient.prototype.statusesRetweetersIds = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/statuses/retweeters/ids.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a collection of the 100 most recent retweets of the Tweet specified by the id parameter.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-statuses-retweets-id
     * @param parameters
     */
    TweetsClient.prototype.statusesRetweetsById = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters, ['id']);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/statuses/retweets/' + parameters.id + '.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns the most recent Tweets authored by the authenticating user  that have been retweeted by others. This timeline is a subset of the user's GET statuses / user_timeline.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-statuses-retweets_of_me
     * @param parameters
     */
    TweetsClient.prototype.statusesRetweetsOfMe = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/statuses/retweets_of_me.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a single Tweet, specified by the id parameter. The Tweet's author will also be embedded within the Tweet. See GET statuses / lookup for getting Tweets in bulk (up to 100 per call). See also Embedded Timelines, Embedded Tweets, and GET statuses/oembed for tools to render Tweets according to Display Requirements. About GeoIf there is no geotag for a status, then there will be an  empty <geo></geo> or "geo" : {}.  This can only be populated if the user has used the Geotagging API to send a statuses/update. The JSON response mostly uses conventions laid out in GeoJSON.  The coordinates that Twitter renders are reversed from the GeoJSON specification  (GeoJSON specifies a longitude then a latitude, whereas Twitter represents it as  a latitude then a longitude), eg: "geo":  { "type":"Point", "coordinates":[37.78029, -122.39697] }
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/get-statuses-show-id
     * @param parameters
     */
    TweetsClient.prototype.statusesShow = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/statuses/show.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Note: favorites are now known as likes.Favorites (likes) the Tweet  specified in the ID parameter as the authenticating user.  Returns the favorite Tweet when successful.The process invoked by  this method is asynchronous. The immediately returned Tweet object may not indicate  the resultant favorited status of the Tweet. A 200 OK response from this method  will indicate whether the intended action was successful or not.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/post-favorites-create
     * @param parameters
     */
    TweetsClient.prototype.favoritesCreate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/favorites/create.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Note: favorites are now known as likes.Unfavorites (un-likes) the Tweet  specified in the ID parameter as the authenticating user.  Returns the un-liked Tweet when successful.The process invoked by this method is asynchronous.  The immediately returned Tweet object may not indicate the resultant favorited status of the Tweet.  A 200 OK response from this method will indicate whether the intended action was successful or not.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/post-favorites-destroy
     * @param parameters
     */
    TweetsClient.prototype.favoritesDestroy = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/favorites/destroy.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Destroys the status specified by the required ID parameter. The authenticating user must be the author of the specified status. Returns the destroyed status if successful.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/post-statuses-destroy-id
     * @param parameters
     */
    TweetsClient.prototype.statusesDestroyById = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/statuses/destroy/' + parameters.id + '.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a single Tweet, specified by either a Tweet web URL or the Tweet ID, in an oEmbed-compatible format. The returned HTML snippet will be automatically recognized as an Embedded Tweet when Twitter's widget JavaScript is included on the page. The oEmbed endpoint allows customization of the final appearance of an Embedded Tweet by setting the corresponding properties in HTML markup to b einterpreted by Twitter's JavaScript bundled with the HTML response by default. The format of the returned markup may change over time as Twitter adds new features or adjusts its Tweet representation. The Tweet fallback markup is meant to be cached on your servers for upt o the suggested cache lifetime specified in the cache_age.
     *
     * @link https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/get-statuses-oembed
     * @param parameters
     */
    TweetsClient.prototype.statusesOembed = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://publish.twitter.com/oembed' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Retweets a tweet. Returns the original Tweet with Retweet details embedded.Usage Notes: This method is subject to update limits. A HTTP 403 will be returned if this limit as been hit. Twitter will ignore attempts to perform duplicate retweets. The retweet_count will be current as of when the payload is generated and may not reflect the exact count. It is intended as an approximation.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/post-statuses-retweet-id
     * @param parameters
     */
    TweetsClient.prototype.statusesRetweetById = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/statuses/retweet/' + parameters.id + '.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Untweets a retweeted status. Returns the original Tweet with Retweet details embedded.Usage Notes: This method is subject to update limits. A HTTP 429 will be returned if this limit has been hit. The untweeted retweet status ID must be authored by the user backing the authentication token. An application must have write privileges to POST. A HTTP 401 will be returned for read-only applications. When passing a source status ID instead of the retweet status ID a HTTP 200 response will be returned with the same Tweet object but no action.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/post-statuses-unretweet-id
     * @param parameters
     */
    TweetsClient.prototype.statusesUnretweetById = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/statuses/unretweet/' + parameters.id + '.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Updates the authenticating user's current status, also known as Tweeting. For each update attempt, the update text is compared with the authenticating  user's recent Tweets. Any attempt that would result in duplication will be  blocked, resulting in a 403 error. A user cannot submit the same status twice in a row. While not rate limited by the API, a user is limited in the number of Tweets they  can create at a time. If the number of updates posted by the user reaches the current  allowed limit this method will return an HTTP 403 error.About Geo Any geo-tagging parameters in the update will be ignored if geo_enabled for the user  is false (this is the default setting for all users, unless the user has enabled geolocation in their settings) The number of digits after the decimal separator passed to lat (up to 8) is tracked so that  when the lat is returned in a status object it will have the same number of digits  after the decimal separator. Use a decimal point as the separator (and not a decimal comma) for the latitude and the longitude  - usage of a decimal comma will cause the geo-tagged portion of the status update to be dropped. For JSON, the response mostly uses conventions described in GeoJSON. However,  the geo object coordinates that Twitter renders are reversed from the GeoJSON specification.  GeoJSON specifies a longitude then a latitude, whereas Twitter represents it as a latitude then  a longitude: "geo": { "type":"Point", "coordinates":[37.78217, -122.40062] } The coordinates object is replacing the geo object (no deprecation date has been set for the geo  object yet) -- the difference is that the coordinates object, in JSON, is now rendered correctly in GeoJSON. If a place_id is passed into the status update, then that place will be attached  to the status. If no place_id was explicitly provided, but latitude and longitude  are, the API attempts to implicitly provide a place by calling geo/reverse_geocode. Users have the ability to remove all geotags from all their Tweets en masse via the  user settings page. Currently there is no method to remove geotags from individual Tweets.
     *
     * @link https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/post-statuses-update
     * @param parameters
     */
    TweetsClient.prototype.statusesUpdate = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transport.doPostRequest('https://api.twitter.com/1.1/statuses/update.json', parameters)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns a collection of relevant Tweets matching a specified query. Please note that Twitter's search service and, by extension, the  Search API is not meant to be an exhaustive source of Tweets.  Not all Tweets will be indexed or made available via the search interface. To learn how to use Twitter Search effectively, please see the Standard search  operators page for a list of available filter operators. Also, see the Working with  Timelines page to learn best practices for navigating results by since_id and max_id.
     *
     * @link https://developer.twitter.com/en/docs/tweets/search/api-reference/get-search-tweets
     * @param parameters
     */
    TweetsClient.prototype.search = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = utils_1.createParams(parameters);
                        return [4 /*yield*/, this.transport.doGetRequest('https://api.twitter.com/1.1/search/tweets.json' + params)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return TweetsClient;
}());
exports["default"] = TweetsClient;


/***/ }),

/***/ 127:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TwitterClient = void 0;
var Transport_1 = __importDefault(__nccwpck_require__(282));
var BasicsClient_1 = __importDefault(__nccwpck_require__(941));
var AccountsAndUsersClient_1 = __importDefault(__nccwpck_require__(726));
var TweetsClient_1 = __importDefault(__nccwpck_require__(183));
var DirectMessagesClient_1 = __importDefault(__nccwpck_require__(179));
var MediaClient_1 = __importDefault(__nccwpck_require__(207));
var TrendsClient_1 = __importDefault(__nccwpck_require__(765));
var GeoClient_1 = __importDefault(__nccwpck_require__(389));
var MetricsClient_1 = __importDefault(__nccwpck_require__(688));
var TwitterClient = /** @class */ (function () {
    /**
     * Provide Twitter API Credentials and options
     * @param options
     */
    function TwitterClient(options) {
        if (!options.apiKey) {
            throw Error('API KEY needs to be provided.');
        }
        if (!options.apiSecret) {
            throw Error('API SECRET needs to be provided.');
        }
        if (!options.accessToken) {
            throw Error('ACCESS TOKEN needs to be provided.');
        }
        if (!options.accessTokenSecret) {
            throw Error('ACCESS TOKEN SECRET needs to be provided.');
        }
        this.transport = new Transport_1.default(options);
    }
    Object.defineProperty(TwitterClient.prototype, "basics", {
        get: function () {
            if (!this.basicsClient) {
                this.basicsClient = new BasicsClient_1.default(this.transport);
            }
            return this.basicsClient;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TwitterClient.prototype, "accountsAndUsers", {
        get: function () {
            if (!this.accountsAndUsersClient) {
                this.accountsAndUsersClient = new AccountsAndUsersClient_1.default(this.transport);
            }
            return this.accountsAndUsersClient;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TwitterClient.prototype, "tweets", {
        get: function () {
            if (!this.tweetsClient) {
                this.tweetsClient = new TweetsClient_1.default(this.transport);
            }
            return this.tweetsClient;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TwitterClient.prototype, "directMessages", {
        get: function () {
            if (!this.directMessagesClient) {
                this.directMessagesClient = new DirectMessagesClient_1.default(this.transport);
            }
            return this.directMessagesClient;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TwitterClient.prototype, "media", {
        get: function () {
            if (!this.mediaClient) {
                this.mediaClient = new MediaClient_1.default(this.transport);
            }
            return this.mediaClient;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TwitterClient.prototype, "trends", {
        get: function () {
            if (!this.trendsClient) {
                this.trendsClient = new TrendsClient_1.default(this.transport);
            }
            return this.trendsClient;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TwitterClient.prototype, "geo", {
        get: function () {
            if (!this.geoClient) {
                this.geoClient = new GeoClient_1.default(this.transport);
            }
            return this.geoClient;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TwitterClient.prototype, "metrics", {
        get: function () {
            if (!this.metricsClient) {
                this.metricsClient = new MetricsClient_1.default(this.transport);
            }
            return this.metricsClient;
        },
        enumerable: false,
        configurable: true
    });
    return TwitterClient;
}());
exports.TwitterClient = TwitterClient;


/***/ }),

/***/ 300:
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ 113:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 685:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 687:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 477:
/***/ ((module) => {

"use strict";
module.exports = require("querystring");

/***/ }),

/***/ 310:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const { TwitterClient } = __nccwpck_require__(127);
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
        `RESULTS JOBS:
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
})();

module.exports = __webpack_exports__;
/******/ })()
;